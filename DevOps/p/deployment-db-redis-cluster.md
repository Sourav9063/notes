# Staging Deployment Strategy (In-Cluster Postgres/Redis)

## Overview

This document outlines the current strategy for deploying the application to staging using in-cluster dependencies.

## Current Approach: `.env` Baking

We are currently using an approach where the `.env` file is generated during the CI build process and "baked" into the Docker image.

1. **CI Pipeline:** `echo $STAGING_ENV | base64 -d > .env` creates the file on the runner.
2. **Docker Build:** `COPY . .` in the `Dockerfile` copies the `.env` into the image.
3. **Runtime:** Next.js reads environment variables directly from this file at startup.

## Setting up In-Cluster Databases for Staging

To set up the in-cluster dependencies for the staging environment, you can use Bitnami's official Helm charts directly in your staging Kubernetes cluster:

**1. Install PostgreSQL:**

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install mapsense-db bitnami/postgresql \
  --namespace mapsense \
  --set auth.postgresPassword=YourStagingPassword \
  --set auth.database=mapsense_db
```

**2. Install Redis:**

```bash
helm install mapsense-cache bitnami/redis \
  --namespace mapsense \
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
