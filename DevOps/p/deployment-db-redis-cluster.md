# Staging Deployment Strategy (In-Cluster Postgres/Redis)

## Overview

This document outlines the current strategy for deploying the application to staging using in-cluster dependencies.

## Current Approach: `.env` Baking

We are currently using an approach where the `.env` file is generated during the CI build process and "baked" into the Docker image.

1. **CI Pipeline:** `echo $STAGING_ENV | base64 -d > .env` creates the file on the runner.
2. **Docker Build:** `COPY . .` in the `Dockerfile` copies the `.env` into the image.
3. **Runtime:** Next.js reads environment variables directly from this file at startup.

**Risk:** anyone who can pull the image can read every value in `.env`, including DB and Redis passwords. Old image layers keep old values even after rotation. Safer option: keep only build-time `NEXT_PUBLIC_*` values in the image, and load server secrets at runtime from a Kubernetes Secret through `envFrom` in the Helm chart.

## Setting up In-Cluster Databases for Staging

To set up the in-cluster dependencies for the staging environment, you can use Bitnami's official Helm charts directly in your staging Kubernetes cluster.

Bitnami changed distribution in 2025:

- Charts are published as OCI artifacts. Old `https://charts.bitnami.com/bitnami` repo now redirects to a frozen index.
- Free `docker.io/bitnami/*` images now publish only `latest`. Versioned Debian images moved to `docker.io/bitnamilegacy/*`, which gets no updates.

Effects:

- Charts from old repo reference versioned tags that no longer exist, so Pods hit `ImagePullBackOff`.
- Current OCI charts default to `latest` images. Pulls work, but `latest` can jump Postgres major version; new major cannot start on old data directory. Pin image by digest (`--set image.digest=sha256:...`) once staging works.
- Alternative: pin legacy image, e.g. `--set image.repository=bitnamilegacy/postgresql --set image.tag=17.6.0-debian-12-r4 --set global.security.allowInsecureImages=true`. Charts reject substituted images without last flag. Legacy images get no security fixes.

**1. Install PostgreSQL:**

```bash
helm install mapsense-db oci://registry-1.docker.io/bitnamicharts/postgresql \
  --namespace mapsense \
  --create-namespace \
  --set auth.postgresPassword=YourStagingPassword \
  --set auth.database=mapsense_db
```

**2. Install Redis:**

```bash
helm install mapsense-cache oci://registry-1.docker.io/bitnamicharts/redis \
  --namespace mapsense \
  --create-namespace \
  --set architecture=standalone \
  --set auth.password=YourStagingRedisPassword
```

_(You will then see `mapsense-db-postgresql-0` and `mapsense-cache-master-0` running via `kubectl get pods -n mapsense`)_

## How to Connect Staging to the In-Cluster Databases

Since the application reads from the baked-in `.env` file, you must update your `$STAGING_ENV` variable in the GitLab UI (Settings > CI/CD > Variables) to include the Kubernetes internal DNS connection strings.

1. **Update `$STAGING_ENV`** to include:

   ```env
   DATABASE_URL="postgresql://postgres:YourStagingPassword@mapsense-db-postgresql.mapsense.svc.cluster.local:5432/mapsense_db"
   REDIS_URL="redis://:YourStagingRedisPassword@mapsense-cache-master.mapsense.svc.cluster.local:6379"
   ```

2. **Redeploy Staging:** When the GitLab pipeline runs next, it will build a new image containing these updated connection strings.

## Local Access (Outside K8s)

To connect to the staging database from your development machine (e.g., for DBeaver or local testing):

```bash
# Tunnel to PostgreSQL
kubectl port-forward -n mapsense svc/mapsense-db-postgresql 5432:5432

# Tunnel to Redis
kubectl port-forward -n mapsense svc/mapsense-cache-master 6379:6379
```

_(Then connect using `localhost` and your staging passwords)._

```bash
kubectl get secret --namespace mapsense mapsense-db-postgresql -o jsonpath="{.data.postgres-password}" | base64 --decode
```
