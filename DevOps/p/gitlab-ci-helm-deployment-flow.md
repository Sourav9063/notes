# GitLab CI And Helm Deployment Flow

This document explains how this project's GitLab pipeline builds, publishes, and deploys `mapsense-ui`, why the `deploy/` folder is required, and how to deploy manually if GitLab CI is unavailable.

## High-Level Flow

The pipeline in `.gitlab-ci.yml` has two stages:

1. `build-publish`
2. `deploy`

For staging, these jobs run automatically on `develop`:

- `build_publish_staging`
- `deploy_staging`

For production, these jobs are available on `main`:

- `build_publish_prod_staging`
- `deploy_prod_staging`

`build_publish_prod_staging` is manual, so production image build/publish needs someone to trigger it from GitLab.

The deployed Kubernetes object is created from the Helm chart in `deploy/`. Docker image contains Next.js app only; Helm chart stays in Git repo and is used by deploy job.

## Runner Role

Specific GitLab runners available for this project include:

- `#21 (37d6219c)` named `gitlab-runner terraform demo-ci-cd`
- `#18 (ad275c0d)` named `gitlab-runner for project terraform`

These runners execute GitLab jobs. Build jobs need Docker-in-Docker because they run `docker build` and `docker push`. Deploy jobs need `kubectl` and `helm` because they talk to Kubernetes.

## Global Variables

Important variables in `.gitlab-ci.yml`:

- `DOCKER_TLS_CERTDIR=""`: disables Docker TLS cert directory because old Docker-in-Docker runners commonly fail without this.
- `GIT_STRATEGY=clone`: runner clones fresh source instead of reusing old checkout.
- `HARBOR_PROJECT_BUILDER`: cache/builder image repo.
- `HARBOR_PROJECT`: final runtime image repo.
- `HELM_CHART_LOCATION=deploy`: tells Helm to use local `deploy/` chart folder.
- `HELM_NAMESPACE=mapsense`: Kubernetes namespace where app is deployed.
- `HELM_RELEASE_NAME=mapsense-release`: Helm release name.
- `CHART_APP_NAME=mapsense-ui`: app name passed into Helm chart.
- `CHART_SERVICE_TYPE=ClusterIP`: Kubernetes service type.
- `CHART_REPLICA_COUNT=1`: replica count passed into Helm chart.
- `AUTHOR_NAME` and `AUTHOR_TEAM`: annotations added to Kubernetes Deployment.

Secret/project variables expected in GitLab:

- `STAGING_ENV`: base64-encoded `.env` content for staging.
- `PROD_ENV`: base64-encoded `.env` content for production.
- `KUBERR_STAGE_TOKEN`: token used to fetch staging kubeconfig.
- `KUBERR_FRONTEND_TOKEN`: token used to fetch production/frontend kubeconfig.
- `HARBOR_USER`: Harbor username.
- `HARBOR_PASSWORD`: Harbor password.
- `IMAGE_PULL_SECRET`: base64 `.dockercfg` value used by Kubernetes image pull secret.

## `before_script`

Every job runs shared setup first:

```sh
apk add --no-cache --update git jq curl
apk add --update git
which ssh-agent || ( apk update && apk add openssh-client )
apk add --update alpine-sdk
export SHORT_SHA="$(git rev-parse --short $CI_COMMIT_SHA)"
export CI_COMMIT_REF_NAME_DASHED=$(echo "$CI_COMMIT_REF_NAME" | sed "s/\//-/")
```

Purpose:

- installs basic CLI tools needed by scripts.
- calculates short commit SHA for image tags.
- converts branch names like `feature/x` to `feature-x` so image tags stay valid.

SSH clone code is commented out because GitLab's normal checkout is being used.

## Environment Setup Blocks

There are two YAML anchors for environment setup.

### Staging

`setup-staging-environments`:

```sh
echo $STAGING_ENV | base64 -d > .env
export DEPLOYMENT_ENV="staging"
export KUBE_CONFIG_ENCODED=$(eval "$KUBERR_STAGE_CMD" | jq -r '.kubeconfig')
export KUBE_CONTEXT_NAME="stage"
export ENV_HASH=$(echo -n "$STAGING_ENV" | sha256sum | head -c 8)
export IMAGE_TAG="${DEPLOYMENT_ENV}-${CI_COMMIT_REF_NAME_DASHED}-${SHORT_SHA}-${ENV_HASH}"
```

What it does:

- decodes GitLab `STAGING_ENV` into `.env`.
- fetches Kubernetes config for staging through Kuberr.
- sets Kubernetes context name to `stage`.
- generates image tag using environment, branch, commit, and env hash.

Example image tag:

```text
staging-develop-a1b2c3d-91e8abcd
```

The `ENV_HASH` matters because `.env` is baked into Docker image during build. If env changes but code commit does not, hash changes and image tag changes.

### Production

`setup-production-environments` does same thing with `PROD_ENV`, production Kuberr endpoint, and context `frontend`.

## Build And Publish Job

Build jobs use:

```yaml
image: docker:18.09.7
services:
  - docker:18-dind
```

This means job runs inside Docker CLI image and talks to Docker daemon sidecar.

The shared `build-script` does:

```sh
docker login -u ${HARBOR_USER} -p "${HARBOR_PASSWORD}" harbor.pathaointernal.com

export DOCKER_CACHE_IMAGE="${HARBOR_PROJECT_BUILDER}:${DEPLOYMENT_ENV}-latest"

docker pull $DOCKER_CACHE_IMAGE || true
docker build . \
  -f ./Dockerfile \
  --target build-stage \
  --cache-from $DOCKER_CACHE_IMAGE \
  -t $DOCKER_CACHE_IMAGE
docker push $HARBOR_PROJECT_BUILDER

docker build . \
  --cache-from $DOCKER_CACHE_IMAGE \
  -f ./Dockerfile \
  -t "${HARBOR_PROJECT}:${DEPLOYMENT_ENV}-latest" \
  -t "${HARBOR_PROJECT}:${IMAGE_TAG}"
docker push $HARBOR_PROJECT
```

Step-by-step:

1. Login to Harbor.
2. Pull previous builder image for Docker cache.
3. Build only `build-stage` target from `Dockerfile`.
4. Push builder/cache image.
5. Build final runtime image.
6. Tag final image twice:
   - `${DEPLOYMENT_ENV}-latest`
   - exact `${IMAGE_TAG}`
7. Push final image repo.

The exact `${IMAGE_TAG}` is what deployment uses. `latest` is convenience tag only.

## Dockerfile Role

The Dockerfile has two stages:

### Build stage

```dockerfile
FROM harbor.pathaointernal.com/external/node:22-alpine AS build-stage
RUN npm install -g bun
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build:docker
```

Purpose:

- uses Node Alpine base.
- installs Bun as package manager/build runner.
- installs dependencies from `bun.lock`.
- copies app source.
- runs Next.js build.

Because `.env` is written before Docker build and `.dockerignore` allows `.env`, that env file is copied into image during `COPY . .`.

### Runtime stage

```dockerfile
FROM harbor.pathaointernal.com/external/node:22-alpine AS runner
RUN apk add --no-cache dumb-init
COPY --from=build-stage /app/.next/standalone ./
COPY --from=build-stage /app/.next/static ./.next/static
COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["dumb-init", "sh", "-c", "./entrypoint.sh"]
```

Purpose:

- copies only Next.js standalone output into final image.
- runs as non-root `node` user.
- starts through `dumb-init`.
- exposes port `8080`.

`entrypoint.sh` starts generated standalone server:

```sh
PORT=8080 node server.js
```

Bun is useful during install/build here, but runtime remains Node because Next.js standalone output is a Node server.

## Deploy Job

Deploy jobs use:

```yaml
image: a8uhnf/kubectl:v1.9.0
```

The shared `deploy-script` does:

```sh
mkdir -p /etc/deploy

echo $KUBE_CONFIG_ENCODED | base64 -d > $KUBECONFIG
kubectl config use-context $KUBE_CONTEXT_NAME

helm init --client-only --stable-repo-url https://charts.helm.sh/stable

helm upgrade --install ${HELM_RELEASE_NAME} ${HELM_CHART_LOCATION} \
  --namespace ${HELM_NAMESPACE} \
  --set appName="$CHART_APP_NAME" \
  --set author.name="$AUTHOR_NAME" \
  --set author.team="$AUTHOR_TEAM" \
  --set deploy.image.repo="$HARBOR_PROJECT" \
  --set deploy.image.tag="$IMAGE_TAG" \
  --set deploy.replicas="$CHART_REPLICA_COUNT" \
  --set service.type="${CHART_SERVICE_TYPE}" \
  --set imgPullSecret="${IMAGE_PULL_SECRET}"
```

Step-by-step:

1. Creates `/etc/deploy`.
2. Writes kubeconfig from Kuberr output to `/etc/deploy/config.yaml`.
3. Selects Kubernetes context.
4. Initializes Helm client mode.
5. Runs `helm upgrade --install`.

`upgrade --install` means:

- if release exists, update it.
- if release does not exist, create it.

## Why `deploy/` Folder Is Needed

`deploy/` is Helm chart consumed by deploy job. It defines Kubernetes resources for this app.

Files:

- `deploy/Chart.yaml`: chart metadata.
- `deploy/values.example.yaml`: example/default values for app name, namespace, replica count, image repo/tag, and pull secret.
- `deploy/templates/deployment.yaml`: Kubernetes Deployment.
- `deploy/templates/service.yaml`: Kubernetes Service.
- `deploy/templates/regsecret.yaml`: Harbor image pull secret.

Important point: `deploy/` is not copied into Docker image. `.dockerignore` excludes it from build context. GitLab deploy job still has `deploy/` because runner has cloned Git repo.

### `deployment.yaml`

Creates Kubernetes Deployment:

- name: `{{ .Values.appName }}`
- label: `app={{ .Values.appName }}`
- replicas: `{{ .Values.deploy.replicas }}`
- image: `{{ .Values.deploy.image.repo }}:{{ .Values.deploy.image.tag }}`
- container port: `8080`
- env var: `HOSTNAME=0.0.0.0`
- image pull secret: `regsecret-{{ .Values.appName }}`

`HOSTNAME=0.0.0.0` is important for container networking. Next.js must bind to all interfaces, not localhost only.

### `service.yaml`

Creates Kubernetes Service:

- service port: `80`
- target port: `8080`
- selector: `app={{ .Values.appName }}`
- type: `ClusterIP`

This lets other in-cluster resources reach app on port `80` while container listens on `8080`.

### `regsecret.yaml`

Creates image pull secret:

```yaml
name: regsecret-{{ .Values.appName }}
type: kubernetes.io/dockercfg
```

This secret lets Kubernetes pull private image from Harbor.

Without this secret, pod can fail with `ImagePullBackOff` or `ErrImagePull`.

## Manual Deploy Without GitLab CI

Use this path when GitLab CI is down or manual recovery is needed.

Assumptions:

- local machine has `gcloud`, `kubectl`, `helm`, and `docker`.
- local Docker can reach `harbor.pathaointernal.com`.
- local user has permission for GKE cluster and Harbor.
- `.env` for target environment is available locally.
- `IMAGE_PULL_SECRET` value is available.

### 1. Authenticate To GKE

For staging cluster:

```sh
gcloud container clusters get-credentials p-stageenv --zone asia-east1-a --project pathao-production-cloud
```

Confirm current context:

```sh
kubectl config current-context
kubectl get namespace mapsense
```

Create namespace if missing:

```sh
kubectl create namespace mapsense
```

### 2. Prepare Environment File

GitLab normally decodes `STAGING_ENV` or `PROD_ENV` into `.env`.

For manual deploy, create `.env` in repo root before building:

```sh
cp .env.staging .env
```

Use real staging env source. Do not commit `.env`.

### 3. Choose Image Tag

Use explicit tag. Avoid relying only on `latest`.

Example:

```sh
export DEPLOYMENT_ENV=staging
export SHORT_SHA="$(git rev-parse --short HEAD)"
export ENV_HASH="$(sha256sum .env | head -c 8)"
export IMAGE_TAG="${DEPLOYMENT_ENV}-manual-${SHORT_SHA}-${ENV_HASH}"
export HARBOR_PROJECT="harbor.pathaointernal.com/data-engineering/mapsense-ui"
export HARBOR_PROJECT_BUILDER="harbor.pathaointernal.com/data-engineering/mapsense-ui-builder"
```

On macOS, if `sha256sum` is unavailable:

```sh
export ENV_HASH="$(shasum -a 256 .env | head -c 8)"
```

### 4. Build And Push Image

Login:

```sh
docker login harbor.pathaointernal.com
```

Build builder/cache image:

```sh
docker build . \
  -f ./Dockerfile \
  --target build-stage \
  -t "${HARBOR_PROJECT_BUILDER}:${DEPLOYMENT_ENV}-latest"
```

Push builder/cache image:

```sh
docker push "${HARBOR_PROJECT_BUILDER}:${DEPLOYMENT_ENV}-latest"
```

Build final image:

```sh
docker build . \
  -f ./Dockerfile \
  -t "${HARBOR_PROJECT}:${DEPLOYMENT_ENV}-latest" \
  -t "${HARBOR_PROJECT}:${IMAGE_TAG}"
```

Push final image:

```sh
docker push "${HARBOR_PROJECT}:${DEPLOYMENT_ENV}-latest"
docker push "${HARBOR_PROJECT}:${IMAGE_TAG}"
```

### 5. Deploy With Helm

Set values same way GitLab does:

```sh
export HELM_RELEASE_NAME=mapsense-release
export HELM_CHART_LOCATION=deploy
export HELM_NAMESPACE=mapsense
export CHART_APP_NAME=mapsense-ui
export CHART_REPLICA_COUNT=1
export CHART_SERVICE_TYPE=ClusterIP
export AUTHOR_NAME=sourav.ahmed@pathao.com
export AUTHOR_TEAM=data
```

Set `IMAGE_PULL_SECRET` from secure source. It must be base64 `.dockercfg` content:

```sh
export IMAGE_PULL_SECRET="<base64-dockercfg-content>"
```

Deploy:

```sh
helm upgrade --install "${HELM_RELEASE_NAME}" "${HELM_CHART_LOCATION}" \
  --namespace "${HELM_NAMESPACE}" \
  --set appName="${CHART_APP_NAME}" \
  --set author.name="${AUTHOR_NAME}" \
  --set author.team="${AUTHOR_TEAM}" \
  --set deploy.image.repo="${HARBOR_PROJECT}" \
  --set deploy.image.tag="${IMAGE_TAG}" \
  --set deploy.replicas="${CHART_REPLICA_COUNT}" \
  --set service.type="${CHART_SERVICE_TYPE}" \
  --set imgPullSecret="${IMAGE_PULL_SECRET}"
```

If Helm version is old and namespace does not exist, create namespace first with `kubectl create namespace mapsense`.

### 6. Verify Deploy

Check rollout:

```sh
kubectl rollout status deployment/mapsense-ui -n mapsense
```

Check pods:

```sh
kubectl get pods -n mapsense -l app=mapsense-ui
```

Check image:

```sh
kubectl get deployment mapsense-ui -n mapsense -o jsonpath='{.spec.template.spec.containers[0].image}'
```

Check service:

```sh
kubectl get svc mapsense-ui -n mapsense
```

Check logs:

```sh
kubectl logs -n mapsense deployment/mapsense-ui --tail=100
```

## Common Failure Points

### Docker build fails after switching runtime to Bun

Current Next.js standalone server expects Node runtime:

```sh
PORT=8080 node server.js
```

Using Bun for install/build is fine. Using Bun as production runtime needs separate verification. Bun image may not have `node` user or `node` binary, causing CI/build/runtime failures.

### Pods show `ImagePullBackOff`

Likely causes:

- image tag does not exist in Harbor.
- `IMAGE_PULL_SECRET` is missing/wrong.
- `regsecret-mapsense-ui` was not created.

Check:

```sh
kubectl describe pod -n mapsense -l app=mapsense-ui
kubectl get secret regsecret-mapsense-ui -n mapsense
```

### App starts but cannot read env

This pipeline bakes `.env` into image. If manual deploy reused old image tag after changing env, Kubernetes may run old env content.

Fix:

- rebuild image after env change.
- use new explicit image tag.
- run Helm upgrade with new tag.

### Service exists but app unreachable

Check app listens on `8080` and `HOSTNAME=0.0.0.0`.

Relevant chart values:

- Service `port: 80`
- Service `targetPort: 8080`
- Deployment `containerPort: 8080`

### Helm deploy updates nothing

Likely using same image tag. Kubernetes may not roll new pod if Deployment spec does not change.

Use unique `${IMAGE_TAG}` for every deploy.

## Useful One-Off Commands

Render Helm output locally:

```sh
helm template mapsense-release deploy \
  --namespace mapsense \
  --set appName=mapsense-ui \
  --set author.name=sourav.ahmed@pathao.com \
  --set author.team=data \
  --set deploy.image.repo=harbor.pathaointernal.com/data-engineering/mapsense-ui \
  --set deploy.image.tag=staging-manual-test \
  --set deploy.replicas=1 \
  --set service.type=ClusterIP \
  --set imgPullSecret=dummy
```

Force Kubernetes to restart pods without changing image:

```sh
kubectl rollout restart deployment/mapsense-ui -n mapsense
```

Rollback Helm release:

```sh
helm history mapsense-release -n mapsense
helm rollback mapsense-release <revision> -n mapsense
```
