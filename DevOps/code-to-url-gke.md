# Code To URL On Google Cloud: Node.js -> Docker -> GKE -> Internet

End-to-end guide: write a production-shaped Node.js API, package it as a Docker image, run it on Google Kubernetes Engine (GKE), and serve it at `https://api.example.com` with automatic TLS, CI/CD, secrets, monitoring, and infrastructure as code.

Every command uses example names. Replace them once in section 1 and paste the rest.

Every file shown below also exists as a runnable project in [`code-to-url-gke/`](code-to-url-gke/) (app, Dockerfile, Compose, Helm chart, Terraform, GitHub Actions workflow). Copy it to its own repository to use it; GitHub only runs workflows from the repository root `.github/`.

Verified while writing (October 2026):

- App code: type-checked with TypeScript, 19 unit tests pass (JWT verification against a local JWKS server, auth, CORS, upload limits, download ownership), Docker image built and run with Docker Compose against Postgres, `SIGTERM` shutdown tested, GCS and S3 signed upload/download URLs generated offline (signed size headers confirmed).
- Local Kubernetes: chart installed on a kind cluster under Pod Security `restricted` with ingress-nginx: migration hook, readiness, 401 on writes, CORS preflight, manual CronJob run, and NetworkPolicy blocking other namespaces all checked.
- Helm chart: `helm lint` and `helm template` pass; rendered manifests validated with `kubeconform` against Kubernetes 1.33 schemas (SecretStore checked against the External Secrets v1 CRD schema). ingress-nginx and ExternalDNS values rendered with their charts.
- Azure storage adapter and identity-provider settings (3.13): type-checked / taken from provider docs, not run.
- Terraform: `terraform validate` and `terraform fmt -check` pass with Google provider 8.x.
- GitHub Actions workflow: `actionlint` passes.
- `gcloud` flags checked against Google Cloud SDK 578.
- Not run against a real Google Cloud project. Expect small drift as tools evolve; official docs are linked per section.

## Contents

0. Big picture
1. Example names
2. Laptop tools
3. The application
4. Docker
5. Google Cloud foundation
6. Artifact Registry
7. GKE cluster
8. Database, storage, secrets, identity
9. Cluster platform: ingress-nginx, cert-manager, External Secrets, ExternalDNS
10. Helm chart and first deploy
11. Internet: DNS, TLS, request journey
12. CI/CD with GitHub Actions
13. Terraform: the same infrastructure as code
14. Observability
15. Security checklist
16. Day-2 operations
17. Troubleshooting runbook
18. Other clouds: what changes
19. Beyond
20. Final checklist

## 0. Big Picture

### 0.1 The Journey

```txt
src/*.ts                         your code
  -> npm run build               TypeScript -> dist/*.js
  -> docker build                image: OS + Node + dist + node_modules
  -> docker push                 Artifact Registry stores image
  -> helm upgrade                Kubernetes objects created/updated in GKE
  -> GKE schedules Pods          containers run on VMs (nodes)
  -> ingress-nginx               public entry; routes Host -> Service
  -> Google load balancer        static public IP 203.0.113.45
  -> DNS A record                api.example.com -> 203.0.113.45
  -> cert-manager                Let's Encrypt certificate for HTTPS
  -> https://api.example.com     users
```

### 0.2 Stack And Why

| Layer | Choice | Why this one |
| --- | --- | --- |
| Runtime | Node.js 24 LTS + TypeScript | LTS support window; types catch bugs at build time |
| HTTP | Express 5 | Most used Node framework; async errors handled natively |
| Validation | zod | Runtime validation with static types |
| Logging | pino | Fast JSON logs; maps cleanly to Cloud Logging |
| Metrics | prom-client | Prometheus standard; Google Managed Prometheus reads it |
| DB driver / migrations | pg / node-pg-migrate | Plain SQL, battle-tested, advisory-locked migrations |
| Object storage | Cloud Storage (GCS), signed URLs | Clients upload directly; API never streams files |
| Container | Docker multi-stage, `node:24-bookworm-slim` | Small, glibc-based, non-root user built in |
| Registry | Artifact Registry | Google-native, IAM-controlled, vulnerability scanning |
| Orchestration | GKE Standard, regional, private nodes | Managed control plane, autoscaling, upgrades |
| Packaging | Helm | Industry default for Kubernetes app packaging |
| Ingress | ingress-nginx | Most deployed Ingress controller; portable across clouds |
| TLS | cert-manager + Let's Encrypt | Free, automatic issuance and renewal |
| Database | Cloud SQL for PostgreSQL + Cloud SQL Auth Proxy | Managed HA, backups, PITR; IAM-authorized encrypted connections |
| Secrets | Secret Manager + External Secrets Operator | Secrets live outside Git and outside images |
| Workload auth | Workload Identity | No service account key files anywhere |
| CI/CD | GitHub Actions + Workload Identity Federation | No long-lived cloud keys in GitHub |
| IaC | Terraform, state in a GCS bucket | Reviewable, repeatable infrastructure |
| Observability | Cloud Logging, Managed Prometheus, uptime checks | Built into GKE; no extra servers |

ingress-nginx note: Kubernetes retired ingress-nginx; maintenance ended March 2026 and there are no further releases or security fixes. Existing installs and install artifacts keep working. Pin the chart version, watch security advisories, and plan a Gateway API migration (section 19). Notice: https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/

### 0.3 Kubernetes Words Used Below

```txt
Cluster          Control plane (API server, scheduler) + nodes (VMs). GKE runs the control plane.
Node             VM that runs Pods. Here: e2-standard-4 Compute Engine VMs.
Pod              Smallest unit: one or more containers sharing network (localhost) and volumes.
Deployment       Keeps N identical Pods running; does rolling updates.
Service          Stable virtual IP + DNS name in front of Pods with matching labels.
Ingress          HTTP routing rule: host/path -> Service. Needs an Ingress controller.
Ingress controller  Proxy that implements Ingress rules. Here: ingress-nginx.
ConfigMap        Non-secret configuration.
Secret           Sensitive configuration. Base64 is encoding, not encryption; restrict access.
ServiceAccount   Identity of a Pod inside Kubernetes (KSA). Linked to a Google identity via Workload Identity.
Namespace        Folder for objects; scope for names, RBAC, policies.
Job              Runs Pods to completion. Used for database migrations.
HPA              HorizontalPodAutoscaler: changes replica count from CPU or other metrics.
PDB              PodDisruptionBudget: limits voluntary evictions during node upgrades.
NetworkPolicy    Pod-level firewall.
CRD              Custom Resource Definition: new object types (Certificate, ExternalSecret, PodMonitoring).
Helm chart       Templated bundle of Kubernetes YAML with values per environment.
```

### 0.4 Google Cloud Words Used Below

```txt
Project          Billing + IAM + resource boundary. One per environment: acme-shop-stg, acme-shop-prod.
VPC              Private network. Subnet ranges for nodes, Pods, Services.
Cloud NAT        Outbound internet for VMs without public IPs.
Private Google Access  Lets private VMs reach Google APIs (Storage, Artifact Registry) without NAT.
Private Service Access VPC peering that gives Cloud SQL a private IP inside your VPC.
GSA              Google service account: identity for workloads and automation.
Workload Identity  Maps a Kubernetes ServiceAccount to a GSA. No key files.
Workload Identity Federation  Lets an external identity (GitHub Actions OIDC token) call Google APIs. No key files.
Artifact Registry  Docker image registry.
Cloud SQL        Managed PostgreSQL.
Secret Manager   Managed secret storage with versions and IAM.
Cloud DNS        Managed authoritative DNS.
```

### 0.5 Environments

Industry default: one Google Cloud project per environment.

```txt
acme-shop-stg    staging cluster, staging database, staging bucket
acme-shop-prod   production cluster, production database, production bucket
                 + Artifact Registry (single image store; staging pulls from it)
                 + Workload Identity Federation pool for GitHub Actions
```

Build an image once, deploy the same image (same git SHA tag) to staging, then production.

This guide builds production step by step. Section 13.6 lists what differs for staging.

## 1. Example Names

Paste once per terminal session. Every later command uses these variables.

```bash
# ---- Google Cloud ----
export PROJECT_ID=acme-shop-prod                 # globally unique; pick your own
export REGION=asia-southeast1                    # Singapore; pick region near users
export BILLING_ACCOUNT=000000-AAAAAA-BBBBBB      # gcloud billing accounts list

# ---- Network ----
export NETWORK=shop-vpc
export SUBNET=shop-gke-subnet

# ---- Cluster ----
export CLUSTER=shop-gke
export NAMESPACE=shop

# ---- Images ----
export AR_REPO=shop
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/shop-api"

# ---- Data ----
export SQL_INSTANCE=shop-pg
export DB_NAME=shop
export DB_USER=shop_api
export BUCKET="${PROJECT_ID}-uploads"

# ---- Identities ----
export APP_GSA="shop-api@${PROJECT_ID}.iam.gserviceaccount.com"
export NODE_GSA="gke-nodes@${PROJECT_ID}.iam.gserviceaccount.com"
export APP_KSA=shop-api

# ---- Internet ----
export DOMAIN=example.com
export API_HOST="api.${DOMAIN}"
export ACME_EMAIL="ops@${DOMAIN}"

# ---- GitHub ----
export GITHUB_REPO=acme/shop-api
```

Naming rules worth keeping:

```txt
Lowercase, hyphenated resource names: shop-pg, shop-gke, shop-vpc.
Prefix buckets with project ID: bucket names are global across all of Google Cloud.
Same names in every environment; the project is the environment boundary.
Image tag = full git SHA. Never deploy "latest".
```

## 2. Laptop Tools

macOS with Homebrew:

```bash
brew install node@24 git jq
brew install --cask google-cloud-sdk         # gcloud, gsutil, bq
brew install kubectl helm terraform
brew install k9s                             # optional terminal UI for clusters
brew install trivy                           # image vulnerability scanner
gcloud components install gke-gcloud-auth-plugin   # kubectl auth for GKE
```

Docker engine: Docker Desktop, OrbStack, or Colima.

Ubuntu/Debian: use the official apt repositories for Google Cloud SDK, Docker, kubectl, Helm, and Terraform. `apt install google-cloud-cli-gke-gcloud-auth-plugin` installs the GKE auth plugin.

Check:

```bash
node --version            # v24.x
docker version            # client and server both answer
gcloud version
kubectl version --client
helm version              # v4.x (v3 works; flag differences noted below)
terraform version
```

Log in:

```bash
# User login for gcloud CLI commands.
gcloud auth login

# Separate login for client libraries/Terraform on your laptop (Application Default Credentials).
gcloud auth application-default login

gcloud config set project "$PROJECT_ID"
gcloud config set compute/region "$REGION"
```

Helm 4 vs Helm 3:

```txt
Helm 4: --rollback-on-failure (Helm 3: --atomic)
Helm 4: --wait accepts a strategy; plain --wait = "watcher"
Charts in this guide work with both.
```

## 3. The Application

Example service: `shop-api`, a JSON API with products in Postgres and direct-to-bucket uploads through signed URLs.

### 3.1 Production Rules The Code Follows

```txt
Config only from environment variables, validated at startup.        (12-factor)
Logs only to stdout as one JSON object per line.                       (Kubernetes collects stdout)
No local state: files go to object storage, data goes to Postgres.     (Pods are disposable)
/healthz = liveness (process alive). Never checks dependencies.
/readyz  = readiness (send me traffic?). Fails during shutdown and when DB is unreachable.
SIGTERM  = stop accepting, finish in-flight requests, close DB pool, exit 0.
Metrics on a separate port, never exposed through Ingress.
```

### 3.2 Repository Layout

```txt
shop-api/
  src/
    app.ts              Express app: routes, validation, CORS, errors (no listening)
    server.ts           Process entry: wiring, listen, graceful shutdown
    config.ts           Env var schema
    auth.ts             OpenID Connect JWT verification (any provider)
    logger.ts           pino configured for Cloud Logging
    db.ts               pg connection pool
    metrics.ts          Prometheus metrics + metrics HTTP server
    storage/
      types.ts          ObjectStorage interface (cloud-neutral)
      gcs.ts            Google Cloud Storage implementation
      index.ts          Picks implementation from STORAGE_PROVIDER
    jobs/
      daily-report.ts   Scheduled job entry point (CronJob)
  test/
    app.test.ts
    auth.test.ts
  migrations/
    1767225600000_create-products.sql
  chart/shop-api/       Helm chart (section 10)
  infra/                Terraform (section 13)
  k8s/local/            kind cluster + throwaway Postgres for local Kubernetes tests (section 10.10)
  .github/workflows/ci-cd.yaml
  Dockerfile
  .dockerignore
  compose.yaml
  package.json
  tsconfig.json
```

`app.ts` builds the app from injected dependencies; `server.ts` owns process concerns. Tests use `app.ts` with fakes and never open ports or databases.

### 3.3 Create The Project

```bash
mkdir shop-api && cd shop-api
git init
npm init -y
npm pkg set type=module

# Runtime dependencies.
npm install express helmet cors jose pino pino-http prom-client pg zod @google-cloud/storage node-pg-migrate

# Build/test dependencies.
npm install -D typescript @types/node@24 @types/express @types/cors @types/pg tsx vitest supertest @types/supertest pino-pretty

npm pkg set \
  scripts.build="tsc -p tsconfig.json" \
  scripts.start="node dist/server.js" \
  scripts.dev="tsx watch src/server.ts" \
  scripts.test="vitest run" \
  scripts.typecheck="tsc -p tsconfig.json --noEmit" \
  scripts.migrate="node-pg-migrate -m migrations"
```

Commit `package-lock.json`. `npm ci` in Docker and CI installs exactly what it lists.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

`NodeNext` means native ES modules: relative imports end in `.js` even in `.ts` files (`import { x } from './db.js'`).

### 3.4 Config: `src/config.ts`

```ts
import { z } from 'zod';

const commaSeparated = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  METRICS_PORT: z.coerce.number().int().positive().default(9464),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  DATABASE_URL: z.string().min(1),
  STORAGE_PROVIDER: z.enum(['gcs']).default('gcs'),
  UPLOAD_BUCKET: z.string().min(1),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  // Browser origins allowed to call this API, comma-separated. Empty = no cross-origin access.
  CORS_ORIGINS: commaSeparated,
  // Any OpenID Connect provider: token issuer, this API's audience, and the provider's public keys URL.
  OIDC_ISSUER: z.string().min(1),
  OIDC_AUDIENCE: z.string().min(1),
  OIDC_JWKS_URL: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;

// Fail at startup, not on first request, when env is wrong.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return configSchema.parse(env);
}
```

`configSchema` is exported so scheduled jobs can validate only the variables they use (3.14).

A missing `DATABASE_URL` crashes the Pod at start with a clear zod error. Kubernetes shows `CrashLoopBackOff`; `kubectl logs` shows which variable is missing.

### 3.5 Logging: `src/logger.ts`

```ts
import { pino, type Logger } from 'pino';

// Cloud Logging reads `severity` and `message` from JSON log lines.
const severityByLevel: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

export function createLogger(level: string): Logger {
  return pino({
    level,
    messageKey: 'message',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ severity: severityByLevel[label] ?? 'DEFAULT', level: label }),
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
}
```

Output line:

```json
{"severity":"INFO","level":"info","time":"2026-10-14T19:37:20.914Z","pid":1,"hostname":"shop-api-7d9c6b5f4-x2kqp","port":8080,"message":"http server listening"}
```

GKE's logging agent turns `severity` into the log entry severity, so Logs Explorer filters like `severity>=ERROR` work. Without the mapping every line shows as `DEFAULT` or `ERROR` (stderr).

Local pretty logs: `npm run dev | npx pino-pretty`.

### 3.6 Database Pool: `src/db.ts`

```ts
import pg from 'pg';
import type { Logger } from 'pino';

export function createPool(connectionString: string, logger: Logger): pg.Pool {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Server cancels queries running longer than this; keeps requests under ingress-nginx's 60s timeout.
    statement_timeout: 10_000,
  });
  // Without this listener, an idle client error crashes the process.
  pool.on('error', (err) => logger.error({ err }, 'idle postgres client error'));
  return pool;
}
```

Connection budget: `max` x replicas must stay below database `max_connections` minus headroom. 10 replicas x 10 = 100 connections. Cloud SQL `db-custom-2-7680` allows several hundred; small tiers allow far fewer. Add PgBouncer when replicas grow.

### 3.7 Metrics: `src/metrics.ts`

```ts
import { createServer, type Server } from 'node:http';
import { collectDefaultMetrics, Histogram, register } from 'prom-client';

collectDefaultMetrics();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// Separate port, so /metrics is never reachable through the public Ingress.
export function startMetricsServer(port: number): Server {
  return createServer(async (req, res) => {
    if (req.url !== '/metrics') {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }).listen(port);
}
```

Default metrics include event loop lag, heap, GC, CPU. The histogram gives request rate, error rate, and latency percentiles (the RED method).

### 3.8 Object Storage: `src/storage/*`

Interface first. Only `gcs.ts` knows about Google; section 18 adds S3 and Azure without touching routes.

`src/storage/types.ts`:

```ts
export interface UploadTarget {
  url: string;
  // Headers the client must send with the PUT request; providers differ.
  headers: Record<string, string>;
}

export interface ObjectStorage {
  // Short-lived URL the client uses to PUT the file directly to the bucket.
  // Providers that support it reject bodies larger than sizeBytes.
  createUploadTarget(key: string, contentType: string, sizeBytes: number, expiresInSeconds: number): Promise<UploadTarget>;
  // Short-lived URL to GET a private object directly from the bucket.
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```

`src/storage/gcs.ts`:

```ts
import { Storage, type Bucket } from '@google-cloud/storage';
import type { ObjectStorage, UploadTarget } from './types.js';

export class GcsStorage implements ObjectStorage {
  private readonly bucket: Bucket;

  // new Storage() uses Application Default Credentials:
  // Workload Identity on GKE, `gcloud auth application-default login` on a laptop.
  constructor(bucketName: string, storage = new Storage()) {
    this.bucket = storage.bucket(bucketName);
  }

  async createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
    expiresInSeconds: number,
  ): Promise<UploadTarget> {
    // Signed header: Cloud Storage rejects the PUT (400) if the body is larger than sizeBytes.
    const sizeLimit = { 'x-goog-content-length-range': `0,${sizeBytes}` };
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      contentType,
      extensionHeaders: sizeLimit,
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return { url, headers: { 'Content-Type': contentType, ...sizeLimit } };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return url;
  }
}
```

`src/storage/index.ts`:

```ts
import type { Config } from '../config.js';
import { GcsStorage } from './gcs.js';
import type { ObjectStorage } from './types.js';

export function createStorage(config: Config): ObjectStorage {
  switch (config.STORAGE_PROVIDER) {
    case 'gcs':
      return new GcsStorage(config.UPLOAD_BUCKET);
  }
}
```

Why signed URLs:

```txt
Without: client -> Ingress -> API Pod -> GCS. Big files hold Pod memory, connections, and Ingress body limits.
With:    client -> API (tiny JSON) -> signed URL; client -> GCS directly. API stays small and fast.
```

Signing on GKE: there is no private key file. The library calls the IAM `signBlob` API as the workload's service account. That needs `roles/iam.serviceAccountTokenCreator` granted to the service account on itself (section 8.6).

Upload size limit: a plain signed PUT URL accepts a body of any size. The client declares `sizeBytes`; the API rejects anything above `MAX_UPLOAD_BYTES`, then signs the `x-goog-content-length-range: 0,<sizeBytes>` header into the URL. Cloud Storage returns `400` if the body is larger, and `403 SignatureDoesNotMatch` if the client drops the header. The bucket's CORS config must allow that header (8.3).

Downloads: objects stay private. `createDownloadUrl` signs a short-lived `GET` URL (5 minutes) after the API checks ownership. Public, cacheable files (product images) belong in a separate public bucket or behind Cloud CDN instead of per-request signing.

### 3.9 HTTP App: `src/app.ts`

```ts
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import type { Pool } from 'pg';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import { currentUser, ownerFolder, requireAuth, type VerifyToken } from './auth.js';
import { httpRequestDuration } from './metrics.js';
import type { ObjectStorage } from './storage/types.js';

export interface AppDeps {
  db: Pick<Pool, 'query'>;
  storage: ObjectStorage;
  logger: Logger;
  verifyToken: VerifyToken;
  corsOrigins: string[];
  maxUploadBytes: number;
  isShuttingDown: () => boolean;
}

const productInput = z.object({
  name: z.string().trim().min(1).max(200),
  priceCents: z.number().int().nonnegative(),
});

const uploadInput = z.object({
  fileName: z.string().regex(/^[\w.-]{1,200}$/),
  contentType: z.string().regex(/^[\w.+-]+\/[\w.+-]+$/),
  sizeBytes: z.number().int().positive(),
});

// Only keys this API generates: uploads/<owner folder>/<uuid>-<file name>. Rejects "..", "//", other prefixes.
const downloadInput = z.object({
  key: z.string().regex(/^uploads\/[0-9a-f]{32}\/[0-9a-f-]{36}-[\w.-]{1,200}$/),
});

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

export function createApp(deps: AppDeps): express.Express {
  const { db, storage, logger, verifyToken, corsOrigins, maxUploadBytes, isShuttingDown } = deps;
  const app = express();
  const auth = requireAuth(verifyToken);

  // Trust one proxy hop (ingress-nginx), so req.ip is the real client IP.
  app.set('trust proxy', 1);
  app.use(helmet());
  // Browsers on these origins may call the API with a bearer token. Others get no CORS headers.
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  // Probes are registered before request logging so they do not flood logs.
  // Liveness: process can serve HTTP. Never check dependencies here.
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness: Pod should receive traffic.
  app.get('/readyz', async (_req, res) => {
    if (isShuttingDown()) {
      res.status(503).json({ status: 'shutting_down' });
      return;
    }
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch (err) {
      logger.warn({ err }, 'readiness check failed');
      res.status(503).json({ status: 'database_unavailable' });
    }
  });

  app.use(pinoHttp({ logger }));
  app.use((req, res, next) => {
    const stopTimer = httpRequestDuration.startTimer();
    res.on('finish', () => {
      // Route pattern (/api/products/:id), not raw URL, keeps metric cardinality low.
      stopTimer({ method: req.method, route: req.route?.path ?? 'unmatched', status_code: res.statusCode });
    });
    next();
  });

  // Public read.
  app.get('/api/products', async (_req, res) => {
    const { rows } = await db.query(
      'SELECT id, name, price_cents AS "priceCents", created_at AS "createdAt" FROM products ORDER BY id DESC LIMIT 50',
    );
    res.json(rows);
  });

  // Writes and file access need a signed-in user.
  app.post('/api/products', auth, async (req, res) => {
    const input = productInput.parse(req.body);
    const { rows } = await db.query(
      'INSERT INTO products (name, price_cents) VALUES ($1, $2) RETURNING id, name, price_cents AS "priceCents", created_at AS "createdAt"',
      [input.name, input.priceCents],
    );
    res.status(201).json(rows[0]);
  });

  app.post('/api/uploads', auth, async (req, res) => {
    const input = uploadInput.parse(req.body);
    if (input.sizeBytes > maxUploadBytes) {
      res.status(413).json({ error: 'file_too_large', maxBytes: maxUploadBytes });
      return;
    }
    const key = `uploads/${ownerFolder(currentUser(res))}/${randomUUID()}-${input.fileName}`;
    const target = await storage.createUploadTarget(key, input.contentType, input.sizeBytes, UPLOAD_URL_TTL_SECONDS);
    res.status(201).json({ key, method: 'PUT', ...target });
  });

  app.get('/api/downloads', auth, async (req, res) => {
    const { key } = downloadInput.parse(req.query);
    // Users may only read their own files. 404 (not 403) avoids confirming other users' keys exist.
    if (!key.startsWith(`uploads/${ownerFolder(currentUser(res))}/`)) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const url = await storage.createDownloadUrl(key, DOWNLOAD_URL_TTL_SECONDS);
    res.json({ key, method: 'GET', url });
  });

  // Express 5 forwards rejected promises from async handlers here.
  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'invalid_request', issues: err.issues });
      return;
    }
    req.log.error({ err }, 'unhandled request error');
    res.status(500).json({ error: 'internal_error' });
  };
  app.use(errorHandler);

  return app;
}
```

Readiness checks the database on purpose: every route needs it. If the database is down, all Pods go unready and ingress-nginx returns `503` immediately instead of hanging requests. Services with routes that work without the database should keep readiness local and degrade per route instead.

`pg` returns `BIGSERIAL` ids as strings (`"id":"1"`) because JavaScript numbers lose precision above 2^53. Keep them strings in the API.

Access rules:

```txt
GET  /api/products    public
POST /api/products    signed-in user (Authorization: Bearer <JWT>)
POST /api/uploads     signed-in user; file lands in uploads/<owner folder>/
GET  /api/downloads   signed-in user; only keys inside their own folder (others get 404)
```

Owner folder = first 32 hex characters of SHA-256 of the token subject. Raw subjects can contain `/` or `|` (`auth0|123`), which would break prefix checks; a hash cannot. The strict key regex rejects `..`, extra slashes, and keys the API did not generate. Authentication details: 3.13.

CORS: a browser app on `https://app.example.com` calling `https://api.example.com` is cross-origin. The browser first sends an `OPTIONS` preflight; the `cors` middleware answers only for origins in `CORS_ORIGINS` and allows the `Authorization` header. Other origins get no CORS headers, so browsers block them. CORS protects users' browsers, not the API: curl and servers ignore it, which is why authentication is still required. Bearer tokens (not cookies) mean no `credentials: true` and no CSRF exposure.

CORS could also be set with ingress-nginx annotations (`nginx.ingress.kubernetes.io/enable-cors`); keeping it in the app makes it testable and identical in every environment.

### 3.10 Process Entry: `src/server.ts`

```ts
import { createApp } from './app.js';
import { createJwtVerifier } from './auth.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { createLogger } from './logger.js';
import { startMetricsServer } from './metrics.js';
import { createStorage } from './storage/index.js';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const db = createPool(config.DATABASE_URL, logger);
const storage = createStorage(config);

let shuttingDown = false;
const app = createApp({
  db,
  storage,
  logger,
  verifyToken: createJwtVerifier({
    issuer: config.OIDC_ISSUER,
    audience: config.OIDC_AUDIENCE,
    jwksUrl: config.OIDC_JWKS_URL,
  }),
  corsOrigins: config.CORS_ORIGINS,
  maxUploadBytes: config.MAX_UPLOAD_BYTES,
  isShuttingDown: () => shuttingDown,
});

const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'http server listening'));
// Keep idle connections open longer than ingress-nginx keeps upstream connections (60s).
// Otherwise Node may close a connection nginx is about to reuse, causing random 502s.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

const metricsServer = startMetricsServer(config.METRICS_PORT);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown started');

  // Hard stop before Kubernetes sends SIGKILL (terminationGracePeriodSeconds).
  const forceExit = setTimeout(() => {
    logger.error('graceful shutdown timed out');
    process.exit(1);
  }, 20_000);
  forceExit.unref();

  // Stop accepting connections; wait for in-flight requests to finish.
  await new Promise<void>((resolve) => server.close(() => resolve()));
  metricsServer.close();
  await db.end();
  logger.info('shutdown complete');
  process.exit(0);
}

// Node as PID 1 gets no default signal handling; explicit handlers make SIGTERM work.
process.on('SIGTERM', (signal) => void shutdown(signal));
process.on('SIGINT', (signal) => void shutdown(signal));
```

Pod termination timeline (zero dropped requests):

```txt
t=0s   Pod marked Terminating. Kubernetes starts removing it from Service endpoints (async).
t=0s   preStop hook: sleep 5s. App still serves; ingress-nginx may still route here.
t=5s   ingress-nginx has dropped the Pod from upstreams. Kubelet sends SIGTERM.
t=5s   App: readiness 503, server.close() stops new connections, in-flight requests finish.
t=~6s  DB pool closed, exit 0.
t=30s  terminationGracePeriodSeconds: kubelet would SIGKILL here. App force-exits at 25s (5s + 20s).
```

Without the preStop sleep, SIGTERM races endpoint removal and some requests get `502`.

### 3.11 Migration: `migrations/1767225600000_create-products.sql`

Create with `npm run migrate -- create create-products -j sql`, then fill it in:

```sql
-- Up Migration
CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  price_cents INTEGER     NOT NULL CHECK (price_cents >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE products;
```

node-pg-migrate records applied migrations in table `pgmigrations` and takes a Postgres advisory lock, so two concurrent runs cannot both apply a migration.

Zero-downtime rule: during a rollout, old and new app versions run at the same time against the same schema. Make every migration backward compatible:

```txt
Add column nullable or with default         -> safe
Rename column                               -> add new, dual-write, backfill, switch reads, drop old (several releases)
Drop column                                 -> stop using it in one release, drop in the next
CREATE INDEX on big table                   -> CREATE INDEX CONCURRENTLY (needs: -- no transaction)
```

### 3.12 Tests: `test/app.test.ts`

```ts
import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDeps } from '../src/app.js';
import { ownerFolder } from '../src/auth.js';

const USER = { id: 'user-1' };
const AUTH = { Authorization: 'Bearer valid-token' };
const MY_FOLDER = ownerFolder(USER);
const OTHER_FOLDER = ownerFolder({ id: 'user-2' });
const FILE_ID = '123e4567-e89b-12d3-a456-426614174000';

function buildApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    db: { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as AppDeps['db'],
    storage: {
      createUploadTarget: vi.fn().mockResolvedValue({
        url: 'https://storage.example/signed-put',
        headers: { 'Content-Type': 'image/png' },
      }),
      createDownloadUrl: vi.fn().mockResolvedValue('https://storage.example/signed-get'),
    },
    logger: pino({ level: 'silent' }),
    verifyToken: async (token) => {
      if (token !== 'valid-token') throw new Error('invalid token');
      return USER;
    },
    corsOrigins: ['https://app.example.com'],
    maxUploadBytes: 1000,
    isShuttingDown: () => false,
    ...overrides,
  });
}

describe('probes', () => {
  it('liveness is always ok', async () => {
    await request(buildApp()).get('/healthz').expect(200, { status: 'ok' });
  });

  it('readiness fails while shutting down', async () => {
    await request(buildApp({ isShuttingDown: () => true })).get('/readyz').expect(503);
  });

  it('readiness fails when database is down', async () => {
    const db = { query: vi.fn().mockRejectedValue(new Error('down')) } as unknown as AppDeps['db'];
    await request(buildApp({ db })).get('/readyz').expect(503);
  });
});

describe('auth', () => {
  it('product list is public', async () => {
    await request(buildApp()).get('/api/products').expect(200);
  });

  it('writes need a bearer token', async () => {
    await request(buildApp()).post('/api/products').send({ name: 'Tea', priceCents: 300 }).expect(401);
  });

  it('rejects an invalid token', async () => {
    await request(buildApp())
      .post('/api/products')
      .set({ Authorization: 'Bearer forged' })
      .send({ name: 'Tea', priceCents: 300 })
      .expect(401);
  });

  it('rejects invalid product input', async () => {
    await request(buildApp()).post('/api/products').set(AUTH).send({ name: '', priceCents: -1 }).expect(400);
  });
});

describe('uploads', () => {
  it('returns a signed upload target inside the user folder', async () => {
    const res = await request(buildApp())
      .post('/api/uploads')
      .set(AUTH)
      .send({ fileName: 'photo.png', contentType: 'image/png', sizeBytes: 500 })
      .expect(201);
    expect(res.body.url).toBe('https://storage.example/signed-put');
    expect(res.body.key).toMatch(new RegExp(`^uploads/${MY_FOLDER}/[0-9a-f-]{36}-photo\\.png$`));
    expect(res.body.headers).toEqual({ 'Content-Type': 'image/png' });
  });

  it('rejects files above the size limit', async () => {
    await request(buildApp())
      .post('/api/uploads')
      .set(AUTH)
      .send({ fileName: 'big.png', contentType: 'image/png', sizeBytes: 1001 })
      .expect(413);
  });
});

describe('downloads', () => {
  it('returns a signed download url for own file', async () => {
    const key = `uploads/${MY_FOLDER}/${FILE_ID}-photo.png`;
    const res = await request(buildApp()).get('/api/downloads').query({ key }).set(AUTH).expect(200);
    expect(res.body.url).toBe('https://storage.example/signed-get');
  });

  it("hides other users' files", async () => {
    const key = `uploads/${OTHER_FOLDER}/${FILE_ID}-photo.png`;
    await request(buildApp()).get('/api/downloads').query({ key }).set(AUTH).expect(404);
  });

  it('rejects keys outside the uploads layout', async () => {
    const key = `uploads/${MY_FOLDER}/../${OTHER_FOLDER}/${FILE_ID}-photo.png`;
    await request(buildApp()).get('/api/downloads').query({ key }).set(AUTH).expect(400);
  });
});

describe('cors', () => {
  it('allows preflight from the web app origin', async () => {
    const res = await request(buildApp())
      .options('/api/products')
      .set({ Origin: 'https://app.example.com', 'Access-Control-Request-Method': 'POST' })
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://app.example.com');
  });

  it('sends no CORS headers to other origins', async () => {
    const res = await request(buildApp()).get('/api/products').set({ Origin: 'https://evil.example' });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
```

`test/auth.test.ts` runs a tiny local JWKS server and signs real tokens, so the verifier is tested end to end without any identity provider:

```ts
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createJwtVerifier, type VerifyToken } from '../src/auth.js';

const ISSUER = 'https://auth.example.com/';
const AUDIENCE = 'https://api.example.com';

let server: Server;
let privateKey: CryptoKey;
let verify: VerifyToken;

// Local stand-in for an identity provider's JWKS endpoint.
beforeAll(async () => {
  const keys = await generateKeyPair('RS256');
  privateKey = keys.privateKey;
  const jwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  verify = createJwtVerifier({ issuer: ISSUER, audience: AUDIENCE, jwksUrl: `http://127.0.0.1:${port}/jwks` });
});

afterAll(() => {
  server.close();
});

function token(claims: { iss?: string; aud?: string; sub?: string; expiresIn?: string }) {
  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(claims.iss ?? ISSUER)
    .setAudience(claims.aud ?? AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(claims.expiresIn ?? '5m');
  if (claims.sub !== undefined) jwt.setSubject(claims.sub);
  return jwt.sign(privateKey);
}

describe('createJwtVerifier', () => {
  it('accepts a valid token and returns the subject', async () => {
    await expect(verify(await token({ sub: 'user-1' }))).resolves.toEqual({ id: 'user-1' });
  });

  it('rejects another issuer', async () => {
    await expect(verify(await token({ sub: 'user-1', iss: 'https://evil.example/' }))).rejects.toThrow();
  });

  it('rejects another audience', async () => {
    await expect(verify(await token({ sub: 'user-1', aud: 'https://other-api.example' }))).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    await expect(verify(await token({ sub: 'user-1', expiresIn: '-1m' }))).rejects.toThrow();
  });

  it('rejects a token without subject', async () => {
    await expect(verify(await token({}))).rejects.toThrow('token has no subject');
  });
});
```

Run:

```bash
npm run typecheck
npm test
npm run build && ls dist
```

Add integration tests against a real Postgres (Testcontainers or the Compose database) once business logic grows.

### 3.13 Authentication: `src/auth.ts`

The API never stores passwords or sessions. Users sign in with an identity provider; the web or mobile app sends the provider's JWT access token as `Authorization: Bearer <token>`; the API verifies it locally with the provider's public keys.

```ts
import { createHash } from 'node:crypto';
import type { RequestHandler, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AuthUser {
  id: string;
}

export type VerifyToken = (token: string) => Promise<AuthUser>;

export interface OidcOptions {
  issuer: string;
  audience: string;
  jwksUrl: string;
}

// Works with any OpenID Connect provider that issues JWT access tokens.
export function createJwtVerifier({ issuer, audience, jwksUrl }: OidcOptions): VerifyToken {
  // Downloads and caches the provider's public keys; refetches when a token uses a new key ID (key rotation).
  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  return async (token) => {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience, clockTolerance: '5s' });
    if (!payload.sub) throw new Error('token has no subject');
    return { id: payload.sub };
  };
}

export function requireAuth(verifyToken: VerifyToken): RequestHandler {
  return async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      res.locals.user = await verifyToken(token);
    } catch {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };
}

export function currentUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}

// Fixed-length, path-safe folder per user. Raw subjects may contain "/" or "|".
export function ownerFolder(user: AuthUser): string {
  return createHash('sha256').update(user.id).digest('hex').slice(0, 32);
}
```

What `jwtVerify` checks: signature against the provider's published keys (JWKS), `iss` equals `OIDC_ISSUER` exactly, `aud` contains `OIDC_AUDIENCE`, `exp`/`nbf` with 5 seconds of clock tolerance. Keys are fetched once and cached; no network call per request.

Any OpenID Connect provider works; only three environment variables change. Find them from the provider's discovery document:

```bash
curl -s https://auth.example.com/.well-known/openid-configuration | jq '{issuer, jwks_uri}'
```

| Provider | `OIDC_ISSUER` | `OIDC_JWKS_URL` | `OIDC_AUDIENCE` |
| --- | --- | --- | --- |
| Google Identity Platform / Firebase Auth | `https://securetoken.google.com/<project-id>` | `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` | `<project-id>` (ID tokens) |
| Auth0 | `https://<tenant>.auth0.com/` (trailing slash) | `https://<tenant>.auth0.com/.well-known/jwks.json` | API identifier, e.g. `https://api.example.com` |
| Okta | `https://<org>.okta.com/oauth2/default` | `https://<org>.okta.com/oauth2/default/v1/keys` | `api://default` or your auth server audience |
| Microsoft Entra ID | `https://login.microsoftonline.com/<tenant-id>/v2.0` | `https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys` | API app's client ID |
| AWS Cognito | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` | `<issuer>/.well-known/jwks.json` | App client ID (ID tokens; access tokens carry `client_id`, not `aud`) |
| Keycloak (self-hosted) | `https://<host>/realms/<realm>` | `<issuer>/protocol/openid-connect/certs` | Client ID or an audience mapper value |

Others (ZITADEL, Authentik, Clerk, Supabase Auth, Ory) publish the same discovery document. Pick by what you already use: Identity Platform fits a Google Cloud stack, Entra ID fits Microsoft 365 organizations, Cognito fits AWS, Keycloak or ZITADEL when you must self-host.

Get a token for testing. User tokens come from signing in through the web app. Machine-to-machine clients use the OAuth client-credentials grant (parameter names vary: Auth0 uses `audience`, Entra ID and Okta use `scope`):

```bash
TOKEN=$(curl -s -X POST https://auth.example.com/oauth/token \
  -d grant_type=client_credentials \
  -d client_id="$CLIENT_ID" \
  -d client_secret="$CLIENT_SECRET" \
  -d audience=https://api.example.com | jq -r .access_token)

# Inspect claims (iss, aud, sub, exp) without verifying.
node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64url')))" "$TOKEN"
```

Authentication answers "who is this". Authorization ("may they do this") comes next: check roles, groups, or `scope` claims per route, for example only tokens with `scope` containing `products:write` may create products. Keep those checks in the API, next to the data they protect.

Private nodes reach the provider's JWKS URL through Cloud NAT (5.4).

### 3.14 Scheduled Jobs: `src/jobs/daily-report.ts`

Same image, different command. Kubernetes runs it as a CronJob (template in 10.6).

```ts
// Scheduled job entry point (Kubernetes CronJob). Runs once and exits: 0 = success, non-zero = failure.
import { configSchema } from '../config.js';
import { createPool } from '../db.js';
import { createLogger } from '../logger.js';

// Jobs validate only the settings they use.
const config = configSchema.pick({ DATABASE_URL: true, LOG_LEVEL: true }).parse(process.env);
const logger = createLogger(config.LOG_LEVEL);
const db = createPool(config.DATABASE_URL, logger);

try {
  const { rows } = await db.query(
    `SELECT count(*)::int AS "totalProducts",
            count(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS "newProducts"
       FROM products`,
  );
  logger.info(rows[0], 'daily report');
} catch (err) {
  logger.error({ err }, 'daily report failed');
  process.exitCode = 1; // Job marks the run failed and retries up to backoffLimit
} finally {
  await db.end();
}
```

Rules for jobs:

```txt
Exit code is the result: 0 = success, non-zero = failed (Kubernetes retries up to backoffLimit).
Idempotent: a retry or a duplicate run must not double-charge, double-send, or corrupt data.
Bounded: activeDeadlineSeconds kills runaway runs; concurrencyPolicy: Forbid prevents overlap.
Log one summary line per run with counts; alert on failed Jobs (14.3).
Time zone explicit (CronJob timeZone), never "whatever the node uses".
```

Run on demand (testing, catch-up after an outage):

```bash
kubectl -n shop create job --from=cronjob/shop-api-daily-report manual-report-$(date +%s)
```

Alternatives: Cloud Scheduler triggering Cloud Run jobs (Google), EventBridge Scheduler (AWS), Azure Container Apps jobs. A Kubernetes CronJob is the portable option and reuses the app's image, secrets, and identity.

### 3.15 Database Failover And Timeouts

Cloud SQL high availability fails over to the standby zone automatically; maintenance also restarts the instance inside the maintenance window. Either way, open connections drop for seconds to about a minute.

```txt
In-flight queries fail     -> those requests return 500
Pool drops broken clients  -> next queries open fresh connections automatically (no restart needed)
/readyz fails meanwhile    -> Pods leave the load balancer briefly; ingress-nginx answers 503 fast
```

Make it boring:

```txt
statement_timeout (db.ts)  Postgres cancels queries after 10s; requests never hang until nginx's 60s timeout.
Retry only idempotent work Clients/frontends retry GETs with exponential backoff and jitter.
                           Retry writes only with an idempotency key (client sends Idempotency-Key; API stores it).
Maintenance window         Set it to low-traffic hours (8.1); Enterprise Plus edition reduces maintenance downtime further.
Test it                    gcloud sql instances failover shop-pg   (staging; watch error rate and recovery time)
```

## 4. Docker

### 4.1 What An Image Is

```txt
Image      Read-only stack of filesystem layers + metadata (CMD, USER, ENV, ports).
Layer      Result of one Dockerfile instruction. Cached and reused when inputs are unchanged.
Container  Running process started from an image, with its own filesystem view and network.
Registry   Server storing images by name:tag and immutable digest (sha256:...).
```

Kubernetes never sees your source code. It pulls an image and runs it.

### 4.2 Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ---- base: shared Node runtime ----
FROM node:24-bookworm-slim AS base
WORKDIR /app

# ---- deps: all dependencies, needed to compile TypeScript ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- build: compile TypeScript to dist/ ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: runtime dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- runtime: final image ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY migrations ./migrations
# Official Node images ship a non-root "node" user (uid 1000).
USER node
EXPOSE 8080 9464
CMD ["node", "dist/server.js"]
```

Why each choice:

```txt
Multi-stage           Compilers, dev deps, and source never reach the final image.
package*.json first   Dependency layer is cached until package-lock.json changes; code edits rebuild in seconds.
npm ci                Exact lockfile install; fails if package.json and lock disagree.
--mount=type=cache    Reuses npm download cache across builds (BuildKit).
bookworm-slim         Debian glibc base: native modules work, smaller than full image.
                      Alpine (musl) is smaller but some native modules and DNS behave differently.
USER node             Non-root. Kubernetes policy below also enforces runAsNonRoot.
CMD exec form         ["node", ...] makes node PID 1 and receive SIGTERM directly.
                      Shell form (CMD node dist/server.js) wraps in /bin/sh, which does not forward signals.
migrations copied     Same image runs the migration Job; app code and schema always match.
```

Even smaller and fewer CVEs: switch the runtime stage to a distroless Node image (`gcr.io/distroless/nodejs*`) or Chainguard images. Trade-off: no shell for `kubectl exec` debugging; use ephemeral debug containers instead (section 17).

### 4.3 `.dockerignore`

Comments must be on their own line. Text after a pattern becomes part of the pattern.

```txt
# Dependencies and build output are recreated inside the image.
node_modules
dist
# Secrets and local files.
.env*
*.log
# Not needed to build the image.
.git
.github
test
chart
k8s
infra
compose.yaml
Dockerfile
```

Without it, `COPY` sends local `node_modules` (wrong OS binaries), `.git` history, and `.env` secrets into the build context.

### 4.4 Build And Run Locally

```bash
# Build. -t names the image. "." is the build context (respects .dockerignore).
docker build -t shop-api:dev .

# Inspect.
docker image ls shop-api
docker history shop-api:dev               # layer sizes
docker run --rm --entrypoint id shop-api:dev
# uid=1000(node) gid=1000(node) groups=1000(node)
```

The image alone cannot start without Postgres. Compose runs the full local stack.

### 4.5 Local Stack: `compose.yaml`

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
      - "9464:9464"
    environment:
      DATABASE_URL: postgres://shop_api:local-password@postgres:5432/shop
      UPLOAD_BUCKET: acme-shop-dev-uploads
      LOG_LEVEL: debug
      CORS_ORIGINS: http://localhost:3000
      # Point at your identity provider's dev tenant/realm to test signed-in routes locally.
      OIDC_ISSUER: https://auth.example.com/
      OIDC_AUDIENCE: https://api.example.com
      OIDC_JWKS_URL: https://auth.example.com/.well-known/jwks.json
    depends_on:
      migrate:
        condition: service_completed_successfully

  migrate:
    build: .
    command: ["node", "node_modules/node-pg-migrate/bin/node-pg-migrate.js", "up", "-m", "migrations"]
    environment:
      DATABASE_URL: postgres://shop_api:local-password@postgres:5432/shop
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: shop_api
      POSTGRES_PASSWORD: local-password
      POSTGRES_DB: shop
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop_api -d shop"]
      interval: 2s
      retries: 30

volumes:
  pgdata:
```

Same ordering as Kubernetes: database healthy -> migrations complete -> API starts.

`postgres:17` matches Cloud SQL `POSTGRES_17` below. Keep local and cloud major versions equal.

Run:

```bash
docker compose up -d --build
docker compose ps -a                     # migrate: exited (0); api, postgres: running
docker compose logs -f api

curl -s localhost:8080/readyz
# {"status":"ready"}

# Writes need a token from the identity provider configured in OIDC_* (3.13).
curl -s -X POST localhost:8080/api/products -H 'content-type: application/json' -d '{"name":"Coffee","priceCents":450}'
# {"error":"unauthorized"}

# With a token from your provider's dev tenant/realm:
curl -s -X POST localhost:8080/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Coffee","priceCents":450}'
# {"id":"1","name":"Coffee","priceCents":450,"createdAt":"..."}

# No provider yet? Seed data straight into the local database.
docker compose exec postgres psql -U shop_api -d shop -c "INSERT INTO products (name, price_cents) VALUES ('Coffee', 450)"

curl -s localhost:8080/api/products
curl -s localhost:9464/metrics | head

# Graceful shutdown check: exit code must be 0, with "shutdown complete" in logs.
docker compose stop api
docker compose ps -a api
docker compose logs api | tail -2

# Clean everything including the database volume.
docker compose down -v
```

Uploads locally need real Google credentials that can sign URLs. Use a dev bucket and impersonate the app service account (needs `roles/iam.serviceAccountTokenCreator` on it for your user):

```bash
gcloud auth application-default login --impersonate-service-account="$APP_GSA"
```

Then mount `~/.config/gcloud/application_default_credentials.json` into the container and set `GOOGLE_APPLICATION_CREDENTIALS` to that path, or run the API with `npm run dev` outside Docker.

### 4.6 Tags, Digests, Architectures

```txt
Tag     Mutable name: shop-api:3f2c1e9...  Can be re-pointed to another image.
Digest  Immutable content hash: shop-api@sha256:ab12...  Always the same bytes.
```

Rules:

```txt
Tag every build with the full git SHA. Deploy that tag.
Enable tag immutability in production registries if possible, or deploy by digest.
Never deploy "latest": rollbacks and audits become guesswork.
```

CPU architecture must match nodes. GKE `e2-standard-*` nodes are `linux/amd64`. An Apple Silicon laptop builds `linux/arm64` by default, which fails on amd64 nodes with `exec format error`.

```bash
# Build for the node architecture explicitly.
docker buildx build --platform linux/amd64 -t "$IMAGE:$(git rev-parse HEAD)" .

# Multi-arch image (amd64 + arm64 nodes such as Tau T2A / Axion C4A). Must push; local image store holds one arch.
docker buildx build --platform linux/amd64,linux/arm64 -t "$IMAGE:$(git rev-parse HEAD)" --push .
```

### 4.7 Scan Before Shipping

```bash
# Fail on fixable HIGH/CRITICAL vulnerabilities, same gate as CI.
trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 shop-api:dev

# Software bill of materials (SBOM).
trivy image --format cyclonedx --output sbom.json shop-api:dev
```

Artifact Registry also scans pushed images when the Container Scanning API is enabled.

Fix findings by updating the base image (`docker build --pull`) and dependencies (`npm update`, `npm audit`), then rebuild.

## 5. Google Cloud Foundation

### 5.1 Project And Billing

```bash
gcloud projects create "$PROJECT_ID" --name="Acme Shop Prod"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
gcloud config set project "$PROJECT_ID"

# Budget alert: emails billing admins at 50%, 90%, 100% of 300 USD/month.
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="acme-shop-prod monthly" \
  --budget-amount=300USD \
  --filter-projects="projects/$PROJECT_ID" \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```

Budgets alert; they do not stop spending.

### 5.2 Enable APIs

```bash
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  containerscanning.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  dns.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

```txt
iamcredentials  signBlob for signed URLs, service account impersonation
sts             token exchange for Workload Identity Federation (GitHub Actions)
servicenetworking  Private Service Access for Cloud SQL private IP
```

### 5.3 VPC And Subnet

```bash
# Custom-mode VPC: you define every subnet. Auto mode creates subnets in every region.
gcloud compute networks create "$NETWORK" --subnet-mode=custom

# One subnet for GKE with two secondary ranges (VPC-native cluster):
#   primary  10.10.0.0/20  nodes      (4,096 IPs)
#   pods     10.16.0.0/14  Pod IPs    (~262k IPs; each node reserves a /24 by default)
#   services 10.20.0.0/20  Service IPs (4,096)
gcloud compute networks subnets create "$SUBNET" \
  --network="$NETWORK" \
  --region="$REGION" \
  --range=10.10.0.0/20 \
  --secondary-range=pods=10.16.0.0/14,services=10.20.0.0/20 \
  --enable-private-ip-google-access
```

Plan ranges once; changing them later means a new cluster. Ranges must not overlap with other VPCs you will peer or connect over VPN.

`--enable-private-ip-google-access`: nodes without public IPs still reach Google APIs (Artifact Registry, Cloud Storage, Secret Manager).

### 5.4 Cloud NAT

Private nodes have no public IP. Pulling public images (`quay.io`, `registry.k8s.io`, Docker Hub) and calling Let's Encrypt or third-party APIs needs NAT.

```bash
gcloud compute routers create shop-router --network="$NETWORK" --region="$REGION"

gcloud compute routers nats create shop-nat \
  --router=shop-router \
  --region="$REGION" \
  --auto-allocate-nat-external-ips \
  --nat-all-subnet-ip-ranges \
  --enable-logging \
  --log-filter=ERRORS_ONLY
```

Third parties that allowlist your egress IP: reserve static IPs and use `--nat-external-ip-pool` instead of auto-allocation.

### 5.5 Private Service Access (For Cloud SQL Private IP)

```bash
# Reserve an internal range Google uses for managed services in your VPC.
gcloud compute addresses create google-managed-services-shop-vpc \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network="$NETWORK"

# Peer your VPC with Google's service producer network.
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-shop-vpc \
  --network="$NETWORK"
```

## 6. Artifact Registry

```bash
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="shop container images"

# Let local Docker push/pull using your gcloud login.
gcloud auth configure-docker "${REGION}-docker.pkg.dev"
```

Cleanup policy: keep the newest 30 versions, delete untagged images after 7 days.

`ar-cleanup.json`:

```json
[
  {
    "name": "keep-recent",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 30 }
  },
  {
    "name": "delete-untagged",
    "action": { "type": "Delete" },
    "condition": { "tagState": "untagged", "olderThan": "7d" }
  }
]
```

```bash
# Preview first; rerun with --no-dry-run to enforce.
gcloud artifacts repositories set-cleanup-policies "$AR_REPO" \
  --location="$REGION" --policy=ar-cleanup.json --dry-run
```

First push by hand (CI does this later):

```bash
export TAG=$(git rev-parse HEAD)
docker buildx build --platform linux/amd64 -t "$IMAGE:$TAG" --push .

gcloud artifacts docker images list "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}" --include-tags
```

Image name anatomy:

```txt
asia-southeast1-docker.pkg.dev / acme-shop-prod / shop / shop-api : 3f2c1e9...
registry host (region)           project          repo   image      tag
```

## 7. GKE Cluster

### 7.1 Standard Or Autopilot

```txt
GKE Standard   You manage node pools (machine type, count, autoscaling). Pay per VM.
               Full control; DaemonSets and privileged workloads allowed. Used below.
GKE Autopilot  Google manages nodes. Pay per Pod resource request. Less to operate.
               Enforces secure defaults (no privileged Pods). Good default for small teams.
```

Everything after cluster creation works on both. Autopilot command is in 7.4.

Regional vs zonal:

```txt
Regional (--region)  Control plane and nodes in 3 zones. Survives a zone outage. Production default.
Zonal (--zone)       One zone. Cheaper, fine for staging. Control plane upgrades cause brief API downtime.
```

### 7.2 Node Service Account

Default node identity is the Compute Engine default service account with Editor on the project. Replace it with a minimal one.

```bash
gcloud iam service-accounts create gke-nodes --display-name="GKE node pool"

# Logs, metrics, and other node-level permissions GKE needs.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$NODE_GSA" \
  --role=roles/container.defaultNodeServiceAccount

# Pull images from this repository only.
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location="$REGION" \
  --member="serviceAccount:$NODE_GSA" \
  --role=roles/artifactregistry.reader
```

### 7.3 Create The Cluster

```bash
gcloud container clusters create "$CLUSTER" \
  --region="$REGION" \
  --release-channel=regular \
  --network="$NETWORK" \
  --subnetwork="$SUBNET" \
  --enable-ip-alias \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services \
  --enable-private-nodes \
  --enable-ip-access \
  --enable-dns-access \
  --enable-master-authorized-networks \
  --master-authorized-networks="$(curl -s https://ifconfig.me)/32" \
  --workload-pool="${PROJECT_ID}.svc.id.goog" \
  --enable-dataplane-v2 \
  --enable-managed-prometheus \
  --service-account="$NODE_GSA" \
  --scopes=cloud-platform \
  --workload-metadata=GKE_METADATA \
  --machine-type=e2-standard-4 \
  --disk-type=pd-balanced \
  --disk-size=50 \
  --num-nodes=1 \
  --enable-autoscaling --min-nodes=1 --max-nodes=3 \
  --enable-autorepair \
  --enable-autoupgrade \
  --max-surge-upgrade=1 \
  --max-unavailable-upgrade=0 \
  --shielded-secure-boot \
  --shielded-integrity-monitoring
```

Takes 5-10 minutes. Flag by flag:

```txt
--region                    Regional cluster: 3 zones. --num-nodes/--min/--max are PER ZONE (1-3 each => 3-9 nodes).
--release-channel=regular   Google picks tested versions and auto-upgrades. rapid = newest, stable = slowest.
--enable-ip-alias + ranges  VPC-native: Pods get real VPC IPs from the "pods" secondary range.
--enable-private-nodes      Nodes have no public IPs. Outbound via Cloud NAT. Not reachable from internet.
--enable-ip-access          Control plane IP endpoint, restricted by authorized networks below.
--master-authorized-networks  Only your current IP can call the IP endpoint. Add office/VPN CIDRs.
--enable-dns-access         DNS endpoint (gke-....goog) protected by IAM instead of IP allowlists.
                            CI runners with changing IPs use this (section 12).
--workload-pool             Enables Workload Identity: Pods authenticate as Google service accounts.
--enable-dataplane-v2       eBPF (Cilium) networking; enforces NetworkPolicy; better visibility.
--enable-managed-prometheus Google Cloud Managed Service for Prometheus collectors (PodMonitoring CRD).
--service-account/--scopes  Minimal node identity; IAM, not scopes, limits access.
--workload-metadata=GKE_METADATA  Pods see the GKE metadata server, not the node's credentials.
--max-surge/--max-unavailable  Node upgrades add a new node before draining an old one.
--shielded-*                Secure boot and integrity monitoring for nodes.
```

Cost shape (check the pricing calculator for current numbers): cluster management fee per cluster-hour (one zonal or Autopilot cluster per billing account gets a free-tier credit), plus VMs, disks, load balancer, NAT, and egress.

### 7.4 Autopilot Alternative

```bash
gcloud container clusters create-auto "$CLUSTER" \
  --region="$REGION" \
  --release-channel=regular \
  --network="$NETWORK" \
  --subnetwork="$SUBNET" \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services \
  --enable-private-nodes \
  --enable-ip-access \
  --enable-dns-access \
  --enable-master-authorized-networks \
  --master-authorized-networks="$(curl -s https://ifconfig.me)/32"
```

Workload Identity, Dataplane V2, Managed Prometheus, Shielded nodes, and node auto-upgrades are always on in Autopilot. Set resource requests on every container: Autopilot bills by them.

### 7.5 Connect kubectl

```bash
# Uses the IP endpoint (your IP is authorized).
gcloud container clusters get-credentials "$CLUSTER" --region="$REGION"

# Or the DNS endpoint (works from any IP; needs container.clusters.connect via IAM).
gcloud container clusters get-credentials "$CLUSTER" --region="$REGION" --dns-endpoint

kubectl config current-context
# gke_acme-shop-prod_asia-southeast1_shop-gke

kubectl get nodes -o wide
kubectl get pods -A
```

New laptop IP or office network:

```bash
gcloud container clusters update "$CLUSTER" --region="$REGION" \
  --enable-master-authorized-networks \
  --master-authorized-networks="$(curl -s https://ifconfig.me)/32,198.51.100.0/24"
```

`--master-authorized-networks` replaces the whole list; include every CIDR you still need.

### 7.6 Smoke Test

```bash
kubectl create namespace smoke
kubectl -n smoke create deployment hello --image=registry.k8s.io/e2e-test-images/agnhost:2.53 -- /agnhost netexec --http-port=8080
kubectl -n smoke expose deployment hello --port=80 --target-port=8080
kubectl -n smoke rollout status deployment/hello

# Call it from inside the cluster through the Service DNS name.
kubectl -n smoke run curl --rm -it --restart=Never --image=curlimages/curl -- \
  curl -s http://hello.smoke.svc.cluster.local/hostname

kubectl delete namespace smoke
```

Proves: image pulls through NAT, scheduling, Pod networking, Service DNS.

### 7.7 What GKE Created

```bash
gcloud compute instances list                       # node VMs (gke-shop-gke-default-pool-...)
gcloud compute instance-groups managed list         # one managed instance group per zone
gcloud compute firewall-rules list --filter="network=$NETWORK"   # GKE-managed rules
kubectl get ns                                      # default, kube-system, gke-*, gmp-system ...
kubectl -n kube-system get pods                     # kube-dns, anetd (Dataplane V2), metrics-server, ...
```

Do not edit GKE-managed instance groups or firewall rules by hand; GKE reconciles them.

## 8. Database, Storage, Secrets, Identity

### 8.1 Cloud SQL For PostgreSQL

```bash
gcloud sql instances create "$SQL_INSTANCE" \
  --database-version=POSTGRES_17 \
  --edition=ENTERPRISE \
  --tier=db-custom-2-7680 \
  --region="$REGION" \
  --availability-type=REGIONAL \
  --network="projects/${PROJECT_ID}/global/networks/${NETWORK}" \
  --no-assign-ip \
  --ssl-mode=ENCRYPTED_ONLY \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --backup-start-time=19:00 \
  --enable-point-in-time-recovery \
  --retained-backups-count=14 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=20 \
  --insights-config-query-insights-enabled \
  --deletion-protection
```

```txt
--edition=ENTERPRISE      Standard edition; ENTERPRISE_PLUS adds faster failover and data cache at higher cost.
--tier=db-custom-2-7680   2 vCPU, 7.5 GB RAM. Staging: db-custom-1-3840 or a shared-core tier.
--availability-type=REGIONAL  Synchronous standby in another zone; automatic failover. ZONAL for staging.
--no-assign-ip + --network    Private IP only; no public endpoint exists.
--ssl-mode=ENCRYPTED_ONLY     Rejects unencrypted connections. The Auth Proxy always encrypts.
--backup-start-time       UTC. 19:00 UTC = 03:00 Singapore.
--enable-point-in-time-recovery  Restore to any second within the log retention window.
--deletion-protection     Instance cannot be deleted until this is turned off.
```

Takes 10-15 minutes.

```bash
gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE"

# Hex keeps the password URL-safe inside DATABASE_URL (no escaping needed).
DB_PASSWORD=$(openssl rand -hex 32)
gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD"

# Connection name used by the Auth Proxy: PROJECT:REGION:INSTANCE
gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)'
# acme-shop-prod:asia-southeast1:shop-pg
```

How the app reaches the database:

```txt
app container --TCP 127.0.0.1:5432--> cloud-sql-proxy sidecar --mTLS + IAM--> Cloud SQL private IP
```

The Cloud SQL Auth Proxy checks the Pod's Google identity (`roles/cloudsql.client`), encrypts with TLS, and handles certificate rotation. The app connects to localhost with a plain Postgres URL.

Upgrade path: IAM database authentication (`--auto-iam-authn` on the proxy, user = service account) removes the password entirely.

### 8.2 Store The Password In Secret Manager

```bash
printf '%s' "$DB_PASSWORD" | gcloud secrets create shop-api-db-password \
  --replication-policy=automatic \
  --data-file=-

unset DB_PASSWORD
```

`printf '%s'` avoids a trailing newline becoming part of the password. `--data-file=-` reads stdin, so the value never appears in shell history or process lists.

Rotation later: `gcloud secrets versions add shop-api-db-password --data-file=-` plus `gcloud sql users set-password`; External Secrets picks the new version up within its refresh interval (section 16.6).

### 8.3 Cloud Storage Bucket

```bash
gcloud storage buckets create "gs://$BUCKET" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --public-access-prevention

gcloud storage buckets update "gs://$BUCKET" --versioning
```

```txt
--uniform-bucket-level-access  IAM only; no per-object ACLs to audit.
--public-access-prevention     Objects can never be made public by accident.
--versioning                   Overwrites/deletes keep old versions (recoverable).
```

Browsers upload with `PUT` to `storage.googleapis.com`, a different origin from your web app, so the bucket needs CORS.

`cors.json`:

```json
[
  {
    "origin": ["https://app.example.com"],
    "method": ["PUT", "GET"],
    "responseHeader": ["Content-Type", "x-goog-content-length-range"],
    "maxAgeSeconds": 3600
  }
]
```

Lifecycle: delete noncurrent versions after 3 newer ones exist. `lifecycle.json`:

```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "numNewerVersions": 3 }
    }
  ]
}
```

```bash
gcloud storage buckets update "gs://$BUCKET" --cors-file=cors.json --lifecycle-file=lifecycle.json
gcloud storage buckets describe "gs://$BUCKET" --format="default(cors_config,lifecycle_config)"
```

### 8.4 App Service Account (GSA)

```bash
gcloud iam service-accounts create shop-api --display-name="shop-api workload"
```

### 8.5 Workload Identity Binding (KSA -> GSA)

Kubernetes ServiceAccount `shop/shop-api` may act as `shop-api@acme-shop-prod.iam.gserviceaccount.com`:

```bash
gcloud iam service-accounts add-iam-policy-binding "$APP_GSA" \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${APP_KSA}]"
```

The other half is the annotation on the KSA (`iam.gke.io/gcp-service-account`), set by the Helm chart.

How it works at runtime:

```txt
Pod calls Google API via client library
-> library asks metadata server (169.254.169.254) for a token
-> GKE metadata server sees Pod's KSA shop/shop-api
-> exchanges the KSA token for a GSA token (allowed by the binding above)
-> library calls Cloud Storage / Secret Manager / Cloud SQL Admin as shop-api GSA
```

No JSON key file exists anywhere. Nothing to leak, rotate, or commit.

### 8.6 App Permissions (Least Privilege)

```bash
# Connect through Cloud SQL Auth Proxy.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$APP_GSA" \
  --role=roles/cloudsql.client

# Create/read objects in this bucket only.
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$APP_GSA" \
  --role=roles/storage.objectUser

# Read this one secret only.
gcloud secrets add-iam-policy-binding shop-api-db-password \
  --member="serviceAccount:$APP_GSA" \
  --role=roles/secretmanager.secretAccessor

# Sign URLs: signBlob on itself (no private key on GKE).
gcloud iam service-accounts add-iam-policy-binding "$APP_GSA" \
  --member="serviceAccount:$APP_GSA" \
  --role=roles/iam.serviceAccountTokenCreator
```

Grant at the smallest scope that works: bucket, secret, or service account level before project level.

IAM changes can take a minute or more to propagate. A fresh `403` right after granting usually resolves itself.

## 9. Cluster Platform

Shared components installed once per cluster, before any app:

```txt
ingress-nginx      public HTTP(S) entry point
cert-manager       TLS certificates from Let's Encrypt
external-secrets   syncs Secret Manager -> Kubernetes Secrets
external-dns       (optional) DNS records from Ingress hosts
```

Pin chart versions. `helm upgrade --install` without `--version` installs whatever is newest that day, so two clusters drift apart.

Find current versions:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm repo update
helm search repo ingress-nginx/ingress-nginx
helm search repo external-dns/external-dns
helm show chart oci://quay.io/jetstack/charts/cert-manager | grep '^version'
helm show chart oci://ghcr.io/external-secrets/charts/external-secrets | grep '^version'
```

Versions used below (October 2026): ingress-nginx chart `4.15.1`, cert-manager `v1.21.2`, external-secrets `2.12.0`, external-dns chart `1.23.0`.

### 9.1 App Namespace With Pod Security

```bash
kubectl create namespace "$NAMESPACE"

# Pod Security Admission: reject Pods that run as root, escalate privileges, or keep Linux capabilities.
kubectl label namespace "$NAMESPACE" \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted
```

The Helm chart in section 10 satisfies `restricted`. A copied example Deployment without `securityContext` gets rejected with a message naming each violation.

Guardrails so one bad deploy (replicas: 500, a memory leak) cannot starve the whole cluster. `namespace-guardrails.yaml`:

```yaml
# Caps the namespace's total. Every container must then declare CPU/memory requests and a memory limit.
apiVersion: v1
kind: ResourceQuota
metadata:
  name: shop-quota
  namespace: shop
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.memory: 32Gi
    pods: "60"
---
# Defaults for containers that forget resources, and a per-container ceiling.
apiVersion: v1
kind: LimitRange
metadata:
  name: shop-defaults
  namespace: shop
spec:
  limits:
    - type: Container
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      default:
        memory: 512Mi
      max:
        memory: 4Gi
```

```bash
kubectl apply -f namespace-guardrails.yaml
kubectl -n shop describe resourcequota shop-quota     # used vs hard
```

Size the quota for peak: HPA maxReplicas x per-Pod requests + rollout surge + Jobs. Hitting it shows as `exceeded quota` in ReplicaSet events and Pods never appear.

### 9.2 Reserve The Public IP

```bash
# Regional static IP: the Service type LoadBalancer (passthrough Network Load Balancer) is regional.
gcloud compute addresses create shop-ingress-ip --region="$REGION"

export INGRESS_IP=$(gcloud compute addresses describe shop-ingress-ip --region="$REGION" --format='value(address)')
echo "$INGRESS_IP"
# 203.0.113.45 (example)
```

A reserved IP survives deleting and recreating ingress-nginx or the whole cluster. DNS never changes.

### 9.3 ingress-nginx

`ingress-nginx-values.yaml`:

```yaml
controller:
  replicaCount: 2
  minAvailable: 1
  service:
    # Reserved regional static IP (section 9.2).
    loadBalancerIP: 203.0.113.45
    # Send traffic only to nodes running a controller Pod; preserves client source IP.
    externalTrafficPolicy: Local
  admissionWebhooks:
    # GKE private nodes: control plane may reach Pods only on 443/10250 by default.
    port: 10250
  metrics:
    enabled: true
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
  config:
    # JSON access logs, parsed into fields by Cloud Logging.
    log-format-escape-json: "true"
    log-format-upstream: '{"time":"$time_iso8601","remote_addr":"$remote_addr","request_id":"$req_id","host":"$host","method":"$request_method","uri":"$request_uri","status":$status,"bytes_sent":$bytes_sent,"request_time":$request_time,"upstream_response_time":"$upstream_response_time","user_agent":"$http_user_agent"}'
```

```bash
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --version 4.15.1 \
  --namespace ingress-nginx --create-namespace \
  -f ingress-nginx-values.yaml \
  --set controller.service.loadBalancerIP="$INGRESS_IP" \
  --wait

kubectl -n ingress-nginx get pods,svc
# service/ingress-nginx-controller  LoadBalancer  10.20.x.x  203.0.113.45  80:3xxxx/TCP,443:3xxxx/TCP
```

`EXTERNAL-IP` showing `<pending>` for more than a few minutes: `kubectl -n ingress-nginx describe svc ingress-nginx-controller` events usually say the IP is in another region or already in use.

Why the webhook port matters: ingress-nginx validates every Ingress through an admission webhook called by the GKE control plane. With private nodes, Google's automatic firewall rule only allows control plane -> nodes on TCP 443 and 10250. The default webhook port 8443 would time out, and every `kubectl apply` of an Ingress fails with `failed calling webhook "validate.nginx.ingress.kubernetes.io"`. Alternatives: keep 8443 and add a firewall rule from the control plane range to nodes on TCP 8443.

Test the edge before any app exists:

```bash
curl -i "http://$INGRESS_IP/"
# HTTP/1.1 404 Not Found   <- ingress-nginx default backend: LB, firewall, controller all work
```

Platform metrics for Managed Prometheus, `ingress-nginx-podmonitoring.yaml`:

```yaml
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/component: controller
  endpoints:
    - port: metrics
      interval: 30s
```

```bash
kubectl apply -f ingress-nginx-podmonitoring.yaml
```

### 9.4 cert-manager

```bash
helm upgrade --install cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.21.2 \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --wait

kubectl -n cert-manager get pods
```

cert-manager's webhook listens on 10250 by default for the same private-cluster reason as above.

Two issuers: Let's Encrypt staging (untrusted certificates, generous rate limits) for first tests, production for real traffic.

`cluster-issuers.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ops@example.com
    privateKeySecretRef:
      name: letsencrypt-staging-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
```

```bash
kubectl apply -f cluster-issuers.yaml
kubectl get clusterissuers
# NAME                  READY
# letsencrypt-prod      True
# letsencrypt-staging   True
```

HTTP-01 challenge flow:

```txt
Ingress with cert-manager.io/cluster-issuer annotation is created
-> cert-manager creates Certificate, Order, Challenge
-> cert-manager adds a temporary Ingress for http://api.example.com/.well-known/acme-challenge/<token>
-> Let's Encrypt fetches that URL over the internet (port 80 must be open, DNS must point here)
-> success: certificate stored in Secret shop-api-tls; ingress-nginx serves it
-> cert-manager renews ~30 days before expiry, automatically
```

Wildcard certificates (`*.example.com`) need the DNS-01 solver (cert-manager writes a TXT record in Cloud DNS). Use it when many hostnames share one certificate or the service is not publicly reachable.

### 9.5 External Secrets Operator

```bash
helm upgrade --install external-secrets oci://ghcr.io/external-secrets/charts/external-secrets \
  --version 2.12.0 \
  --namespace external-secrets --create-namespace \
  --wait

kubectl get crds | grep external-secrets.io
```

Model:

```txt
SecretStore     How to reach a backend (Secret Manager in project X, authenticating as KSA Y).
ExternalSecret  Which remote secrets to read and the shape of the Kubernetes Secret to write.
Secret          Normal Kubernetes Secret, created and refreshed by the operator. Pods consume it as usual.
```

The app chart ships its own `SecretStore` and `ExternalSecret` (section 10.6). Each app reads secrets as its own identity, so one compromised app cannot read another app's secrets.

Alternative without an operator: Secret Manager add-on for GKE (CSI driver) mounts secrets as files. ESO fits better when apps expect environment variables and when the same pattern must work on AWS/Azure (section 18).

### 9.6 ExternalDNS (Optional)

Manual DNS (section 11.1) is enough for one hostname. ExternalDNS creates and deletes records from Ingress hosts automatically: useful with many hosts, preview environments, or frequent changes.

```bash
gcloud iam service-accounts create external-dns --display-name="ExternalDNS"
export EXTERNAL_DNS_GSA="external-dns@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$EXTERNAL_DNS_GSA" \
  --role=roles/dns.admin

gcloud iam service-accounts add-iam-policy-binding "$EXTERNAL_DNS_GSA" \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:${PROJECT_ID}.svc.id.goog[external-dns/external-dns]"
```

`external-dns-values.yaml`:

```yaml
provider:
  name: google
extraArgs:
  - --google-project=acme-shop-prod
domainFilters:
  - example.com
sources:
  - ingress
# sync = also delete records when Ingress is deleted. upsert-only = never delete.
policy: sync
# Marks records owned by this cluster (stored in TXT records).
txtOwnerId: shop-gke-prod
serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: external-dns@acme-shop-prod.iam.gserviceaccount.com
```

```bash
helm upgrade --install external-dns external-dns/external-dns \
  --version 1.23.0 \
  --namespace external-dns --create-namespace \
  -f external-dns-values.yaml \
  --wait

kubectl -n external-dns logs deploy/external-dns -f
```

Needs the Cloud DNS zone from section 11.1. With ExternalDNS, skip the manual `A` record.

## 10. Helm Chart And First Deploy

### 10.1 Why Helm

```txt
Raw YAML     One copy per environment; names, images, hosts duplicated and drifting.
Helm chart   Templates + values. One chart, one values file per environment.
             Releases are versioned: helm history, helm rollback.
```

Kustomize (built into kubectl) is the main alternative: patches instead of templates. Both are industry standard; Helm is used here because platform components (ingress-nginx, cert-manager) ship as Helm charts too.

### 10.2 Chart Layout

```txt
chart/shop-api/
  Chart.yaml               chart name and version
  values.yaml              defaults = production
  values-staging.yaml      only what differs in staging
  values-local.yaml        local kind cluster: no Google services (10.10)
  templates/
    _helpers.tpl           shared labels, image, Cloud SQL proxy sidecar, security context
    serviceaccount.yaml    KSA with Workload Identity annotation
    configmap.yaml         non-secret env vars
    externalsecret.yaml    SecretStore + ExternalSecret -> Secret with DATABASE_URL
    deployment.yaml        app Pods + Cloud SQL Auth Proxy native sidecar
    service.yaml           stable ClusterIP in front of Pods
    ingress.yaml           api.example.com -> Service, TLS via cert-manager
    hpa.yaml               autoscaling on CPU
    pdb.yaml               keep Pods available during node upgrades
    networkpolicy.yaml     only ingress-nginx and Prometheus may connect
    podmonitoring.yaml     Managed Prometheus scrape config
    migration-job.yaml     database migrations as a Helm hook
    cronjob.yaml           scheduled jobs from the cronJobs list in values
```

Create it with `helm create chart/shop-api`, delete the generated templates, and add the files below.

### 10.3 `Chart.yaml`

```yaml
apiVersion: v2
name: shop-api
description: Shop API service
type: application
# Chart version. Bump when templates change.
version: 0.1.0
# Default app version; CI overrides image.tag per deploy.
appVersion: "0.1.0"
```

### 10.4 Values

`values.yaml` (production defaults):

```yaml
# Defaults = production. Environment files override only what differs.

image:
  repository: asia-southeast1-docker.pkg.dev/acme-shop-prod/shop/shop-api
  # Set by CI to the git SHA. Never deploy "latest".
  tag: ""
  pullPolicy: IfNotPresent

# Ignored when autoscaling.enabled=true (HPA owns replica count).
replicaCount: 2

serviceAccount:
  name: shop-api
  # Google service account this Kubernetes service account acts as (Workload Identity). Empty = no annotation.
  gcpServiceAccount: shop-api@acme-shop-prod.iam.gserviceaccount.com

# Non-secret environment variables (rendered into a ConfigMap).
env:
  LOG_LEVEL: info
  STORAGE_PROVIDER: gcs
  UPLOAD_BUCKET: acme-shop-prod-uploads
  MAX_UPLOAD_BYTES: "10485760"
  CORS_ORIGINS: https://app.example.com
  # Identity provider (any OpenID Connect provider; section 3.13 lists common values).
  OIDC_ISSUER: https://auth.example.com/
  OIDC_AUDIENCE: https://api.example.com
  OIDC_JWKS_URL: https://auth.example.com/.well-known/jwks.json

ports:
  http: 8080
  metrics: 9464

# Secret shop-api-secrets (DATABASE_URL) comes from Secret Manager through External Secrets.
# Disable to create that Secret yourself (local kind cluster).
externalSecret:
  enabled: true

database:
  name: shop
  user: shop_api
  # Secret Manager secret holding the database password.
  passwordSecret: shop-api-db-password
  gcpProjectId: acme-shop-prod

cloudSqlProxy:
  # Disable when the database is reachable directly (local kind cluster, other clouds).
  enabled: true
  image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.26.0
  # PROJECT:REGION:INSTANCE
  instanceConnectionName: acme-shop-prod:asia-southeast1:shop-pg
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      memory: 256Mi

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    # No CPU limit: avoids throttling; requests already reserve fair share.
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

podDisruptionBudget:
  minAvailable: 1

ingress:
  enabled: true
  className: nginx
  host: api.example.com
  # cert-manager issuer for HTTPS. Empty = plain HTTP Ingress without TLS (local only).
  clusterIssuer: letsencrypt-prod
  tlsSecretName: shop-api-tls
  annotations:
    # Uploads go straight to the bucket via signed URL, so API bodies stay small.
    nginx.ingress.kubernetes.io/proxy-body-size: "1m"
    # Per-client-IP rate limit, counted separately in each ingress-nginx replica:
    # effective limit = value x controller replicas (2 => ~40 rps).
    nginx.ingress.kubernetes.io/limit-rps: "20"

networkPolicy:
  enabled: true
  ingressControllerNamespace: ingress-nginx
  # Google Cloud Managed Service for Prometheus collectors run here.
  metricsNamespace: gmp-system

podMonitoring:
  enabled: true
  interval: 30s

migrations:
  enabled: true

# Scheduled jobs (Kubernetes CronJobs). Same image, different command.
cronJobTimeZone: Asia/Singapore
cronJobs:
  - name: daily-report
    schedule: "0 2 * * *"
    command: ["node", "dist/jobs/daily-report.js"]
```

`values-staging.yaml`:

```yaml
# Image comes from the production registry (values.yaml): build once, deploy the same SHA everywhere.

replicaCount: 1

serviceAccount:
  gcpServiceAccount: shop-api@acme-shop-stg.iam.gserviceaccount.com

env:
  LOG_LEVEL: debug
  UPLOAD_BUCKET: acme-shop-stg-uploads
  CORS_ORIGINS: https://app.staging.example.com,http://localhost:3000
  OIDC_AUDIENCE: https://api.staging.example.com

database:
  gcpProjectId: acme-shop-stg

cloudSqlProxy:
  instanceConnectionName: acme-shop-stg:asia-southeast1:shop-pg

autoscaling:
  enabled: false

podDisruptionBudget:
  minAvailable: 0

ingress:
  host: api.staging.example.com
```

Staging pulls the same image from the production registry (build once, promote the same SHA). Section 13.6 grants the staging node service account read access.

Resource notes:

```txt
requests  Scheduler reserves this. HPA percentages are relative to requests.
memory limit  Container is OOM-killed above it. Set ~2x normal usage; watch for OOMKilled.
CPU limit     Omitted on purpose: limits cause throttling and latency spikes even when the node is idle.
              Many teams keep CPU limits for strict multi-tenant fairness; measure before choosing.
```

### 10.5 `templates/_helpers.tpl`

```yaml
{{- define "shop-api.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "shop-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shop-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "shop-api.labels" -}}
{{ include "shop-api.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "shop-api.image" -}}
{{- required "image.tag is required (use the git SHA)" .Values.image.tag | printf "%s:%s" .Values.image.repository -}}
{{- end -}}

{{- define "shop-api.secretName" -}}
{{- printf "%s-secrets" (include "shop-api.name" .) -}}
{{- end -}}

{{/* Cloud SQL Auth Proxy as a native sidecar (initContainer with restartPolicy: Always). */}}
{{- define "shop-api.cloudSqlProxy" -}}
- name: cloud-sql-proxy
  image: {{ .Values.cloudSqlProxy.image }}
  restartPolicy: Always
  args:
    - --private-ip
    - --port=5432
    - --structured-logs
    - --health-check
    - --http-address=0.0.0.0
    - --http-port=9801
    - --exit-zero-on-sigterm
    - {{ .Values.cloudSqlProxy.instanceConnectionName }}
  startupProbe:
    httpGet:
      path: /startup
      port: 9801
    periodSeconds: 1
    failureThreshold: 60
  livenessProbe:
    httpGet:
      path: /liveness
      port: 9801
    periodSeconds: 10
    failureThreshold: 3
  resources:
    {{- toYaml .Values.cloudSqlProxy.resources | nindent 4 }}
  securityContext:
    runAsNonRoot: true
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
{{- end -}}

{{- define "shop-api.containerSecurityContext" -}}
runAsNonRoot: true
runAsUser: 1000
runAsGroup: 1000
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop: ["ALL"]
{{- end -}}
```

`required` makes `helm install` fail fast when CI forgets `--set image.tag=...`.

Native sidecar: an `initContainer` with `restartPolicy: Always` (Kubernetes 1.29+) starts before the app, must pass its `startupProbe` first, stays running beside the app, and stops after the app on shutdown. In a Job it also stops automatically when the main container exits, which plain sidecars never did.

### 10.6 Templates

`templates/serviceaccount.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Values.serviceAccount.name }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.gcpServiceAccount }}
  annotations:
    # Workload Identity: Pods using this KSA get the GSA's Google Cloud permissions.
    iam.gke.io/gcp-service-account: {{ . }}
  {{- end }}
```

`templates/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
data:
  PORT: {{ .Values.ports.http | quote }}
  METRICS_PORT: {{ .Values.ports.metrics | quote }}
  {{- range $key, $value := .Values.env }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
```

`templates/externalsecret.yaml`:

```yaml
{{- if .Values.externalSecret.enabled }}
# SecretStore: how External Secrets Operator reaches Secret Manager.
# It authenticates as the shop-api KSA (Workload Identity -> shop-api GSA).
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: gcp-secret-manager
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  provider:
    gcpsm:
      projectID: {{ .Values.database.gcpProjectId }}
      auth:
        workloadIdentity:
          serviceAccountRef:
            name: {{ .Values.serviceAccount.name }}
---
# ExternalSecret: which secrets to copy into a Kubernetes Secret, and in what shape.
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: {{ include "shop-api.secretName" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcp-secret-manager
    kind: SecretStore
  target:
    name: {{ include "shop-api.secretName" . }}
    creationPolicy: Owner
    template:
      engineVersion: v2
      data:
        # 127.0.0.1:5432 is the Cloud SQL Auth Proxy sidecar in the same Pod.
        DATABASE_URL: "postgres://{{ .Values.database.user }}:{{ "{{ .dbPassword }}" }}@127.0.0.1:5432/{{ .Values.database.name }}"
  data:
    - secretKey: dbPassword
      remoteRef:
        key: {{ .Values.database.passwordSecret }}
{{- end }}
```

`{{ "{{ .dbPassword }}" }}` renders to a literal `{{ .dbPassword }}`, which External Secrets then fills in from Secret Manager. Helm templates and ESO templates use the same braces; this escapes Helm's.

The resulting Kubernetes Secret `shop-api-secrets` contains one key, `DATABASE_URL`. The password never appears in Git, Helm values, or the image.

`templates/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      {{- include "shop-api.selectorLabels" . | nindent 6 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # Start a new Pod before removing an old one: zero-downtime rollout.
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        {{- include "shop-api.labels" . | nindent 8 }}
      annotations:
        # Changing the ConfigMap changes this hash, which restarts Pods.
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      terminationGracePeriodSeconds: 30
      securityContext:
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      # Spread replicas across zones, then across nodes.
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              {{- include "shop-api.selectorLabels" . | nindent 14 }}
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              {{- include "shop-api.selectorLabels" . | nindent 14 }}
      {{- if .Values.cloudSqlProxy.enabled }}
      initContainers:
        {{- include "shop-api.cloudSqlProxy" . | nindent 8 }}
      {{- end }}
      containers:
        - name: shop-api
          image: {{ include "shop-api.image" . }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.ports.http }}
            - name: metrics
              containerPort: {{ .Values.ports.metrics }}
          envFrom:
            - configMapRef:
                name: {{ include "shop-api.name" . }}
            - secretRef:
                name: {{ include "shop-api.secretName" . }}
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 2
            failureThreshold: 30
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: http
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
          lifecycle:
            preStop:
              # Keep serving while endpoint removal propagates to ingress-nginx,
              # then Kubernetes sends SIGTERM.
              sleep:
                seconds: 5
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            {{- include "shop-api.containerSecurityContext" . | nindent 12 }}
```

Probe roles:

```txt
startupProbe    Gives slow starts time; liveness/readiness wait until it passes.
livenessProbe   Fails 3 times -> container restarted. Only "is the process stuck".
readinessProbe  Fails -> Pod removed from Service endpoints; no restart.
```

`templates/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  type: ClusterIP
  selector:
    {{- include "shop-api.selectorLabels" . | nindent 4 }}
  ports:
    - name: http
      port: 80
      targetPort: http
```

`templates/ingress.yaml`:

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
  annotations:
    {{- with .Values.ingress.clusterIssuer }}
    # cert-manager sees this, requests a Let's Encrypt certificate, stores it in tlsSecretName.
    cert-manager.io/cluster-issuer: {{ . }}
    {{- end }}
    {{- with .Values.ingress.annotations }}
    {{- toYaml . | nindent 4 }}
    {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.clusterIssuer }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tlsSecretName }}
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "shop-api.name" . }}
                port:
                  name: http
{{- end }}
```

ingress-nginx defaults that apply: HTTP -> HTTPS redirect once TLS exists, HSTS header, `X-Forwarded-For`/`X-Forwarded-Proto` set for the app, 60s upstream read timeout (`nginx.ingress.kubernetes.io/proxy-read-timeout` to change).

`templates/hpa.yaml`:

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "shop-api.name" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```

`templates/pdb.yaml`:

```yaml
{{- if gt (int .Values.podDisruptionBudget.minAvailable) 0 }}
# Node upgrades/drains never take the service below minAvailable Pods.
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable }}
  selector:
    matchLabels:
      {{- include "shop-api.selectorLabels" . | nindent 6 }}
{{- end }}
```

`templates/networkpolicy.yaml`:

```yaml
{{- if .Values.networkPolicy.enabled }}
# Only ingress-nginx may call the API port; only Prometheus collectors may scrape metrics.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- include "shop-api.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: {{ .Values.networkPolicy.ingressControllerNamespace }}
      ports:
        - port: http
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: {{ .Values.networkPolicy.metricsNamespace }}
      ports:
        - port: metrics
{{- end }}
```

Egress is left open on purpose: locking it down needs explicit rules for DNS, the metadata server, Google APIs, and the Cloud SQL private range. Do that as a separate hardening step and test it in staging.

`templates/podmonitoring.yaml`:

```yaml
{{- if .Values.podMonitoring.enabled }}
# Google Cloud Managed Service for Prometheus scrape config.
apiVersion: monitoring.googleapis.com/v1
kind: PodMonitoring
metadata:
  name: {{ include "shop-api.name" . }}
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
      {{- include "shop-api.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: metrics
      path: /metrics
      interval: {{ .Values.podMonitoring.interval }}
{{- end }}
```

`templates/migration-job.yaml`:

```yaml
{{- if .Values.migrations.enabled }}
# Runs database migrations on every install/upgrade.
# post-install: first install needs the Secret and ServiceAccount created by this release.
# pre-upgrade: later releases migrate before new Pods start.
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "shop-api.name" . }}-migrate
  labels:
    {{- include "shop-api.labels" . | nindent 4 }}
  annotations:
    helm.sh/hook: post-install,pre-upgrade
    helm.sh/hook-weight: "0"
    # Delete old Job before creating a new one; delete on success; keep failed Job for debugging.
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 600
  template:
    metadata:
      labels:
        {{- include "shop-api.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: migrate
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      restartPolicy: Never
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      {{- if .Values.cloudSqlProxy.enabled }}
      initContainers:
        {{- include "shop-api.cloudSqlProxy" . | nindent 8 }}
      {{- end }}
      containers:
        - name: migrate
          image: {{ include "shop-api.image" . }}
          command: ["node", "node_modules/node-pg-migrate/bin/node-pg-migrate.js", "up", "-m", "migrations"]
          envFrom:
            - secretRef:
                name: {{ include "shop-api.secretName" . }}
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              memory: 256Mi
          securityContext:
            {{- include "shop-api.containerSecurityContext" . | nindent 12 }}
{{- end }}
```

Why `post-install,pre-upgrade` and not `pre-install`: hooks run outside normal resource ordering. On the very first install, a `pre-install` Job would start before this release creates the ServiceAccount and ExternalSecret it needs, and fail. On first install the API starts against an empty schema for a few seconds until the migration finishes; every later upgrade migrates before new Pods roll out.

Caveat: a `pre-upgrade` Job sees secrets from the previous release. A release that adds a new secret key and needs it during migration must ship the secret first.

`templates/cronjob.yaml`:

```yaml
{{- range .Values.cronJobs }}
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ include "shop-api.name" $ }}-{{ .name }}
  labels:
    {{- include "shop-api.labels" $ | nindent 4 }}
spec:
  schedule: {{ .schedule | quote }}
  timeZone: {{ $.Values.cronJobTimeZone | quote }}
  # Never start a run while the previous one is still going.
  concurrencyPolicy: Forbid
  # Skip a missed run if it cannot start within 10 minutes (e.g. cluster was down).
  startingDeadlineSeconds: 600
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: {{ .activeDeadlineSeconds | default 1800 }}
      template:
        metadata:
          labels:
            {{- include "shop-api.selectorLabels" $ | nindent 12 }}
            app.kubernetes.io/component: cron-{{ .name }}
        spec:
          serviceAccountName: {{ $.Values.serviceAccount.name }}
          restartPolicy: Never
          securityContext:
            seccompProfile:
              type: RuntimeDefault
          {{- if $.Values.cloudSqlProxy.enabled }}
          initContainers:
            {{- include "shop-api.cloudSqlProxy" $ | nindent 12 }}
          {{- end }}
          containers:
            - name: job
              image: {{ include "shop-api.image" $ }}
              command: {{ toJson .command }}
              envFrom:
                - configMapRef:
                    name: {{ include "shop-api.name" $ }}
                - secretRef:
                    name: {{ include "shop-api.secretName" $ }}
              resources:
                requests:
                  cpu: 100m
                  memory: 128Mi
                limits:
                  memory: 256Mi
              securityContext:
                {{- include "shop-api.containerSecurityContext" $ | nindent 16 }}
{{- end }}
```

One CronJob per entry in `cronJobs`. Add a job = add a list entry and a script in `src/jobs/`. Settings that matter:

```txt
concurrencyPolicy: Forbid   a slow run blocks the next instead of piling up
startingDeadlineSeconds     a run missed while the controller was down starts late at most 10 minutes, otherwise skipped
backoffLimit / activeDeadlineSeconds  bounded retries and runtime
timeZone                    schedule in local time; DST handled by Kubernetes
```

Watch runs:

```bash
kubectl -n shop get cronjob,jobs
kubectl -n shop logs job/<job-name> -c job
```

### 10.7 Lint And Render

```bash
helm lint chart/shop-api --set image.tag=test
helm lint chart/shop-api -f chart/shop-api/values-staging.yaml --set image.tag=test

# See exactly what Kubernetes will receive.
helm template shop-api chart/shop-api --namespace shop --set image.tag=test > /tmp/rendered.yaml
less /tmp/rendered.yaml

# Schema validation, including CRDs, without a cluster.
# -ignore-missing-schemas: skip CRDs absent from the catalog instead of failing.
docker run --rm -v /tmp:/work ghcr.io/yannh/kubeconform:latest -strict -summary -ignore-missing-schemas \
  -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
  /work/rendered.yaml

# Server-side dry run against the real cluster (admission webhooks, Pod Security, CRDs).
helm template shop-api chart/shop-api --namespace shop --set image.tag=test | kubectl apply --dry-run=server -f -
```

### 10.8 First Deploy

Prerequisites from earlier sections: namespace `shop` (9.1), image pushed (6), Cloud SQL + secret + IAM (8), ingress-nginx, cert-manager, External Secrets (9).

For the first deploy, point the Ingress at the Let's Encrypt staging issuer until DNS and HTTP-01 are proven (section 11):

```bash
export TAG=$(git rev-parse HEAD)

helm upgrade --install shop-api chart/shop-api \
  --namespace "$NAMESPACE" \
  --set image.tag="$TAG" \
  --set ingress.clusterIssuer=letsencrypt-staging \
  --rollback-on-failure --wait --timeout 10m
```

Watch it converge in a second terminal:

```bash
kubectl -n shop get externalsecret,secret,pods,svc,ingress,hpa,pdb
kubectl -n shop get events --sort-by=.lastTimestamp | tail -20
kubectl -n shop logs deploy/shop-api -c shop-api -f
kubectl -n shop logs deploy/shop-api -c cloud-sql-proxy
```

Expected order:

```txt
ServiceAccount, ConfigMap, Service, Deployment, HPA, PDB, Ingress, SecretStore, ExternalSecret created
ExternalSecret status: SecretSynced  -> Secret shop-api-secrets exists
Pods: Init (cloud-sql-proxy starting) -> Running, READY 2/2 (app + native sidecar)
Helm runs post-install hook Job shop-api-migrate -> Completed -> deleted
```

Check from inside the cluster, before DNS:

```bash
kubectl -n shop port-forward svc/shop-api 8080:80
# other terminal:
curl -s localhost:8080/readyz
curl -s -X POST localhost:8080/api/products \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"name":"Tea","priceCents":300}'
curl -s localhost:8080/api/products
```

Check through ingress-nginx using the IP and a Host header:

```bash
curl -s -H "Host: $API_HOST" "http://$INGRESS_IP/healthz"
```

### 10.9 Releases

```bash
helm -n shop list
helm -n shop history shop-api
helm -n shop get values shop-api            # values used by the current revision
helm -n shop get manifest shop-api | less   # exact YAML applied
helm -n shop rollback shop-api 3 --wait     # back to revision 3 (image, config, everything)
```

Rollback restores manifests, not database schema. Backward-compatible migrations (3.11) are what make app rollbacks safe.

### 10.10 Test The Chart Locally With kind

kind runs a Kubernetes cluster inside Docker. Catch chart mistakes, Pod Security rejections, probe problems, migration hooks, CronJobs, and NetworkPolicy behavior in minutes, for free, before touching GKE.

What differs from GKE: no Cloud SQL proxy, External Secrets, Managed Prometheus, cert-manager, or Workload Identity. `values-local.yaml` switches those off; everything else is the same chart.

```bash
brew install kind            # Linux: download the binary from the kind releases page
```

`k8s/local/kind-cluster.yaml`:

```yaml
# Local Kubernetes in Docker. ingress-nginx binds node ports 80/443, mapped to localhost:8088/8443.
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: shop
nodes:
  - role: control-plane
    labels:
      ingress-ready: "true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 8088
        protocol: TCP
      - containerPort: 443
        hostPort: 8443
        protocol: TCP
```

`k8s/local/postgres.yaml`:

```yaml
# Throwaway Postgres for the local kind cluster. Data is lost when the Pod restarts.
apiVersion: v1
kind: Namespace
metadata:
  name: db
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: db
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:17
          env:
            - name: POSTGRES_USER
              value: shop_api
            - name: POSTGRES_PASSWORD
              value: local-password
            - name: POSTGRES_DB
              value: shop
          ports:
            - containerPort: 5432
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "shop_api", "-d", "shop"]
            periodSeconds: 2
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: db
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

`chart/shop-api/values-local.yaml`:

```yaml
# Local kind cluster (section 10.10). No Google Cloud services involved.

image:
  repository: shop-api
  tag: local
  # Image is loaded into kind with `kind load docker-image`; never pull.
  pullPolicy: Never

replicaCount: 1

serviceAccount:
  gcpServiceAccount: ""

env:
  LOG_LEVEL: debug
  UPLOAD_BUCKET: local-uploads
  CORS_ORIGINS: http://localhost:3000

cloudSqlProxy:
  enabled: false

externalSecret:
  enabled: false

autoscaling:
  enabled: false

podDisruptionBudget:
  minAvailable: 0

ingress:
  host: api.localtest.me
  clusterIssuer: ""

podMonitoring:
  enabled: false
```

Run:

```bash
kind create cluster --config k8s/local/kind-cluster.yaml   # switches kubectl context to kind-shop
kubectl config current-context                              # kind-shop; check before every command below

# Image goes straight into the kind node; no registry.
docker build -t shop-api:local .
kind load docker-image shop-api:local --name shop

# ingress-nginx build for kind (hostPorts 80/443 on the node labeled ingress-ready=true).
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/kind/deploy.yaml
kubectl -n ingress-nginx wait --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=300s

kubectl apply -f k8s/local/postgres.yaml
kubectl -n db rollout status deploy/postgres

# Same namespace policy as production.
kubectl create namespace shop
kubectl label namespace shop pod-security.kubernetes.io/enforce=restricted pod-security.kubernetes.io/warn=restricted

# What External Secrets creates in GKE, created by hand here.
kubectl -n shop create secret generic shop-api-secrets \
  --from-literal=DATABASE_URL=postgres://shop_api:local-password@postgres.db.svc.cluster.local:5432/shop

helm upgrade --install shop-api chart/shop-api -n shop -f chart/shop-api/values-local.yaml \
  --rollback-on-failure --wait --timeout 5m
```

Check (`*.localtest.me` resolves to 127.0.0.1 in public DNS):

```bash
curl -s http://api.localtest.me:8088/readyz                  # {"status":"ready"}: migrations ran, DB reachable
curl -s http://api.localtest.me:8088/api/products             # []
curl -s -X POST http://api.localtest.me:8088/api/products \
  -H 'content-type: application/json' -d '{"name":"x","priceCents":1}'   # 401: auth enforced

# CORS preflight from the allowed local origin.
curl -si -X OPTIONS http://api.localtest.me:8088/api/products \
  -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' | grep -i access-control-allow-origin

# CronJob, on demand.
kubectl -n shop create job --from=cronjob/shop-api-daily-report manual-report-1
kubectl -n shop wait --for=condition=complete job/manual-report-1 --timeout=120s
kubectl -n shop logs job/manual-report-1

# NetworkPolicy: Pods outside ingress-nginx cannot reach the API (curl times out).
kubectl create namespace np-test
kubectl -n np-test run probe --rm -i --restart=Never --image=curlimages/curl -- \
  curl -s -m 5 http://shop-api.shop.svc.cluster.local/healthz
kubectl delete namespace np-test
```

Iterate: rebuild, `kind load` again, then `kubectl -n shop rollout restart deploy/shop-api` (same `local` tag, so Helm sees no change).

Clean up and switch back to your real cluster:

```bash
kind delete cluster --name shop
kubectl config get-contexts
kubectl config use-context <your-previous-context>
```


## 11. Internet: DNS, TLS, Request Journey

### 11.1 DNS

Two options. Pick one.

Option A: keep DNS where it is (registrar, Cloudflare, Route 53). Add one record:

```txt
Type  Name               Value          TTL
A     api.example.com    203.0.113.45   300
```

Cloudflare: set the record to "DNS only" (grey cloud) at first. Orange-cloud proxying puts Cloudflare's TLS in front, which changes how HTTP-01 and client IPs behave; add it deliberately later.

Option B: Cloud DNS hosts the zone (needed for ExternalDNS and DNS-01 on Google Cloud):

```bash
gcloud dns managed-zones create example-com \
  --dns-name="${DOMAIN}." \
  --description="Public zone for ${DOMAIN}" \
  --visibility=public

# The four Google name servers to configure at the registrar.
gcloud dns managed-zones describe example-com --format='value(nameServers)'

gcloud dns record-sets create "${API_HOST}." \
  --zone=example-com \
  --type=A \
  --ttl=300 \
  --rrdatas="$INGRESS_IP"
```

At the registrar, replace the domain's name servers with the four from Cloud DNS. Delegation changes can take hours to propagate because of NS TTLs at the parent zone.

Verify:

```bash
dig +short NS example.com            # Google name servers (option B)
dig +short api.example.com           # 203.0.113.45
dig +short api.example.com @8.8.8.8  # public resolver view
dig +trace api.example.com           # full delegation chain from the root
```

TTL strategy: 300 seconds while setting up; raise to 3600 once stable. Lower it again a day before a planned IP change.

### 11.2 TLS Certificate

The Ingress already requested a certificate from the staging issuer (10.8). Once DNS answers with the ingress IP, HTTP-01 succeeds.

```bash
kubectl -n shop get certificate
# NAME           READY   SECRET         AGE
# shop-api-tls   True    shop-api-tls   2m

# Not ready? Follow the chain:
kubectl -n shop describe certificate shop-api-tls
kubectl -n shop get certificaterequest,order,challenge
kubectl -n shop describe challenge
```

Staging certificate works but is untrusted (`curl` needs `-k`). Switch to production by deploying without the override (values default is `letsencrypt-prod`):

```bash
helm upgrade --install shop-api chart/shop-api \
  --namespace "$NAMESPACE" \
  --set image.tag="$TAG" \
  --rollback-on-failure --wait --timeout 10m

# Delete the staging certificate secret so cert-manager issues a fresh production one.
kubectl -n shop delete secret shop-api-tls

kubectl -n shop get certificate -w
```

Inspect what clients receive:

```bash
openssl s_client -connect "$API_HOST:443" -servername "$API_HOST" </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
# subject=CN=api.example.com
# issuer=C=US, O=Let's Encrypt, CN=R1x  (intermediate name varies)
# notAfter=...  (90 days; cert-manager renews about 30 days before)
```

Let's Encrypt production rate limits are per registered domain per week. Test with staging; never loop production issuance in CI.

### 11.3 It Is Live

```bash
curl -i "https://$API_HOST/healthz"
curl -s "https://$API_HOST/api/products"
curl -s -X POST "https://$API_HOST/api/products" \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"name":"Cake","priceCents":800}'

# HTTP redirects to HTTPS.
curl -sI "http://$API_HOST/healthz" | head -3
# HTTP/1.1 308 Permanent Redirect
# Location: https://api.example.com/healthz

# Signed upload end to end: ask the API, then PUT straight to Cloud Storage with the returned headers.
SIZE=$(wc -c < cat.png | tr -d ' ')
UPLOAD=$(curl -s -X POST "https://$API_HOST/api/uploads" \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"fileName\":\"cat.png\",\"contentType\":\"image/png\",\"sizeBytes\":$SIZE}")
echo "$UPLOAD" | jq '{key, headers}'
curl -s -X PUT "$(echo "$UPLOAD" | jq -r .url)" \
  -H 'Content-Type: image/png' \
  -H "x-goog-content-length-range: 0,$SIZE" \
  --data-binary @cat.png -o /dev/null -w '%{http_code}\n'
# 200
gcloud storage ls "gs://$BUCKET/uploads/"

# Signed download of the same file.
KEY=$(echo "$UPLOAD" | jq -r .key)
DOWNLOAD_URL=$(curl -s -G "https://$API_HOST/api/downloads" --data-urlencode "key=$KEY" \
  -H "Authorization: Bearer $TOKEN" | jq -r .url)
curl -s -o cat-copy.png -w '%{http_code}\n' "$DOWNLOAD_URL"
cmp cat.png cat-copy.png && echo identical
```

### 11.4 The Full Request Journey

`curl https://api.example.com/api/products`, hop by hop, with the command that proves each hop works.

```txt
1. DNS
   Client resolver -> root -> .com -> Cloud DNS name servers -> A 203.0.113.45
   Check: dig +short api.example.com

2. Internet -> Google edge
   TCP SYN to 203.0.113.45:443 enters Google's network at the nearest edge.
   The address belongs to a regional external passthrough Network Load Balancer
   (created by GKE for the ingress-nginx Service type LoadBalancer).
   Check: gcloud compute forwarding-rules list --filter="IPAddress=$INGRESS_IP"

3. Load balancer -> node
   Passthrough: packets keep the client IP; no TLS termination here.
   externalTrafficPolicy: Local -> LB health checks pass only on nodes running an
   ingress-nginx Pod, so traffic goes straight to those nodes. GKE created the
   VPC firewall rule allowing it.
   Check: kubectl -n ingress-nginx get pods -o wide   (which nodes)
          gcloud compute firewall-rules list --filter="network=$NETWORK" | grep k8s

4. Node -> ingress-nginx Pod
   Dataplane V2 (eBPF) forwards the Service port to the controller Pod IP.
   Check: kubectl -n ingress-nginx get endpointslices

5. TLS termination + routing (ingress-nginx)
   SNI "api.example.com" selects certificate from Secret shop/shop-api-tls.
   Host header + path "/" match Ingress shop/shop-api -> Service shop-api:80.
   Adds X-Forwarded-For (client IP), X-Forwarded-Proto: https, X-Request-ID.
   Applies rate limit (limit-rps) and body size limit.
   Check: kubectl -n ingress-nginx logs deploy/ingress-nginx-controller | grep api.example.com

6. ingress-nginx -> app Pod
   nginx sends directly to Pod IPs listed in the Service's EndpointSlices
   (only Ready Pods), on port 8080. NetworkPolicy allows this source namespace.
   Check: kubectl -n shop get endpointslices -l kubernetes.io/service-name=shop-api

7. App
   Express handler runs. pino logs the request as JSON to stdout.
   Check: kubectl -n shop logs deploy/shop-api -c shop-api --tail=20

8. App -> database
   pg connects to 127.0.0.1:5432 = Cloud SQL Auth Proxy sidecar in the same Pod.
   Proxy authenticates as GSA shop-api (Workload Identity), opens TLS to the
   Cloud SQL private IP over the Private Service Access peering.
   Check: kubectl -n shop logs deploy/shop-api -c cloud-sql-proxy --tail=20

9. Response returns the same path.
   Cloud Logging stores app + nginx logs; Managed Prometheus scrapes latency metrics.
```

Uploads take a different path after step 7: the API returns a signed URL; the client sends bytes directly to `storage.googleapis.com`, never through ingress-nginx or the Pod.

Debug from the outside in. The first hop that fails is the problem:

```bash
dig +short "$API_HOST"                                      # 1 DNS
nc -vz "$INGRESS_IP" 443                                    # 2-4 LB, firewall, controller
curl -vk --resolve "$API_HOST:443:$INGRESS_IP" "https://$API_HOST/healthz"   # 5 TLS + routing, bypassing DNS
kubectl -n shop get endpointslices -l kubernetes.io/service-name=shop-api   # 6 ready Pods exist
kubectl -n shop port-forward deploy/shop-api 8080:8080      # 7 app directly, bypassing ingress
kubectl -n shop logs deploy/shop-api -c cloud-sql-proxy     # 8 database path
```

### 11.5 The Web App (Frontend)

This guide ships the API. Browsers use a web app at `https://app.example.com`. Hosting options:

```txt
Static single-page app (React/Vite, Angular, Vue: build output is HTML/JS/CSS)
  Google Cloud     Cloud Storage bucket + external Application Load Balancer + Cloud CDN + Google-managed certificate,
                   or Firebase Hosting (simplest on Google).
  Provider-neutral Cloudflare Pages, Netlify, Vercel, AWS S3 + CloudFront, Azure Static Web Apps.
  Same cluster     nginx image serving dist/ as another Deployment + Ingress host app.example.com.
                   Simple; no CDN edge caching.

Server-rendered app (Next.js, Nuxt, Remix, SvelteKit)
  Same pattern as this API: Dockerfile (Next.js "standalone" output), a copy of this chart, Ingress host app.example.com.
  Managed alternatives: Cloud Run, Vercel, Netlify.
```

Wiring the web app to the API:

```txt
API URL        Build-time config, e.g. VITE_API_URL=https://api.example.com (differs per environment).
CORS           Add the app origin to CORS_ORIGINS (API) and to the bucket CORS config (uploads/downloads).
Sign-in        OpenID Connect Authorization Code flow with PKCE, via the provider's SDK or a neutral
               library such as oidc-client-ts. Send the access token as Authorization: Bearer.
DNS + TLS      Same cluster: another A record to INGRESS_IP; cert-manager issues its certificate from the Ingress.
               CDN/hosting platform: CNAME or A record from the platform; it manages TLS.
Caching        Hashed asset files (app.3f9c.js): Cache-Control: public, max-age=31536000, immutable.
               index.html: Cache-Control: no-cache, so new deploys show up immediately.
```

Same-origin alternative: serve both from one host (`example.com/` for the app, `example.com/api/` for the API) with two Ingress paths. No CORS at all, one certificate; the trade-off is coupling the app's and API's domains and caching rules.

## 12. CI/CD With GitHub Actions

### 12.1 Flow

```txt
pull request  -> test job: typecheck, unit tests, helm lint
push to main  -> test -> build (image, scan, push) -> deploy-staging -> [manual approval] -> deploy-production
```

Same image (tag = commit SHA) moves through every environment. Nothing is rebuilt for production.

### 12.2 Keyless Auth: Workload Identity Federation

GitHub issues each workflow run a signed OIDC token ("I am repo acme/shop-api, ref refs/heads/main"). Google trusts that issuer through a Workload Identity Pool and exchanges the token for short-lived Google credentials. No JSON key is stored in GitHub.

```bash
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc shop-api \
  --location=global \
  --workload-identity-pool=github \
  --display-name="shop-api repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == '${GITHUB_REPO}'"

# Value for the GitHub variable GCP_WIF_PROVIDER:
gcloud iam workload-identity-pools providers describe shop-api \
  --location=global --workload-identity-pool=github --format='value(name)'
# projects/123456789012/locations/global/workloadIdentityPools/github/providers/shop-api
```

`--attribute-condition` is the security boundary: without it, any GitHub repository could exchange tokens against your pool. Tighter variants: match `assertion.repository_id` (survives renames, blocks name squatting) or `assertion.ref == 'refs/heads/main'`.

Grant the repository identity (`principalSet`) only what CI needs:

```bash
export GITHUB_PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_REPO}"

# Push images to this repository only.
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location="$REGION" \
  --member="$GITHUB_PRINCIPAL" \
  --role=roles/artifactregistry.writer

# Deploy: Kubernetes API access (includes container.clusters.connect for the DNS endpoint).
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="$GITHUB_PRINCIPAL" \
  --role=roles/container.developer

# Same for staging (the pool lives in the production project; principals work across projects).
gcloud projects add-iam-policy-binding acme-shop-stg \
  --member="$GITHUB_PRINCIPAL" \
  --role=roles/container.developer
```

Tighter later: grant `roles/container.clusterViewer` in IAM and a Kubernetes `RoleBinding` in namespace `shop` only, so CI cannot touch other namespaces.

### 12.3 GitHub Repository Settings

```txt
Settings -> Secrets and variables -> Actions -> Variables:
  GCP_WIF_PROVIDER = projects/123456789012/locations/global/workloadIdentityPools/github/providers/shop-api

Settings -> Environments:
  staging      no protection
  production   Required reviewers: platform team; Deployment branches: main only

Settings -> Branches -> main:
  Require pull request, require status check "test"
```

A variable, not a secret: the provider name is not sensitive. Security comes from the attribute condition and IAM.

### 12.4 Workflow: `.github/workflows/ci-cd.yaml`

```yaml
name: ci-cd

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

env:
  REGION: asia-southeast1
  IMAGE: asia-southeast1-docker.pkg.dev/acme-shop-prod/shop/shop-api

jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - uses: azure/setup-helm@v5
      - run: helm lint chart/shop-api --set image.tag=ci

  build:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-24.04
    permissions:
      contents: read
      id-token: write # lets the job request a GitHub OIDC token for Workload Identity Federation
    steps:
      - uses: actions/checkout@v7

      - uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}

      - uses: google-github-actions/setup-gcloud@v3

      - run: gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

      - uses: docker/setup-buildx-action@v4

      # Build and load locally first, so a vulnerable image is never pushed.
      - uses: docker/build-push-action@v7
        with:
          context: .
          platforms: linux/amd64
          load: true
          tags: ${{ env.IMAGE }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - uses: aquasecurity/trivy-action@0.36.0
        with:
          image-ref: ${{ env.IMAGE }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: "1"

      - run: docker push "${IMAGE}:${GITHUB_SHA}"

  deploy-staging:
    needs: build
    runs-on: ubuntu-24.04
    environment: staging
    concurrency: deploy-staging
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
      - uses: google-github-actions/get-gke-credentials@v3
        with:
          project_id: acme-shop-stg
          cluster_name: shop-gke
          location: ${{ env.REGION }}
          use_dns_based_endpoint: true
      - uses: azure/setup-helm@v5
      - run: |
          helm upgrade --install shop-api chart/shop-api \
            --namespace shop \
            -f chart/shop-api/values-staging.yaml \
            --set image.tag="${GITHUB_SHA}" \
            --rollback-on-failure --wait --timeout 10m

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-24.04
    # GitHub environment with required reviewers = manual approval gate.
    environment: production
    concurrency: deploy-production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
      - uses: google-github-actions/get-gke-credentials@v3
        with:
          project_id: acme-shop-prod
          cluster_name: shop-gke
          location: ${{ env.REGION }}
          use_dns_based_endpoint: true
      - uses: azure/setup-helm@v5
      - run: |
          helm upgrade --install shop-api chart/shop-api \
            --namespace shop \
            --set image.tag="${GITHUB_SHA}" \
            --rollback-on-failure --wait --timeout 10m
```

Details that matter:

```txt
id-token: write       Only jobs that talk to Google get an OIDC token.
use_dns_based_endpoint  Runner IPs change constantly; the DNS endpoint uses IAM instead of IP allowlists.
load -> scan -> push  Vulnerable images never reach the registry.
cache type=gha        BuildKit layer cache in GitHub's cache; unchanged dependency layers are reused.
concurrency           One deploy per environment at a time; later runs queue.
environment           Production waits for a reviewer; GitHub records who approved what.
--rollback-on-failure Failed rollout (or failed migration hook) restores the previous release.
```

Pin third-party actions to a full commit SHA (`uses: owner/action@<40-char sha> # v3`) for supply-chain safety; Dependabot or Renovate keeps the pins updated.

### 12.5 Deploy, Promote, Roll Back

```txt
Deploy        merge PR to main
Promote       approve "deploy-production" in the Actions run
Roll back     re-run the deploy-production job of the last good run (same SHA)
              or: helm -n shop rollback shop-api <revision>
Hotfix        PR -> main as usual; never patch the cluster by hand
```

`kubectl edit` or `kubectl set image` changes are overwritten by the next Helm deploy and leave no review trail. Use them only in emergencies, then commit the same change.

### 12.6 Alternatives

```txt
Cloud Build + Cloud Deploy  Google-native CI and progressive delivery with approvals.
GitLab CI                   Same steps; use GitLab OIDC (id_tokens) with Workload Identity Federation.
Argo CD (GitOps)            CI only pushes the image and bumps the tag in a Git repo; Argo CD inside
                            the cluster pulls and applies. No cluster credentials in CI. See section 19.
```

## 13. Terraform: The Same Infrastructure As Code

Sections 5-9 used `gcloud` to learn each piece. Real environments are created from code: reviewed in pull requests, reproducible for staging, and documented by the code itself.

Use one path per project: either create a fresh project with Terraform, or import what `gcloud` created (13.5). Mixing manual changes with Terraform causes drift.

OpenTofu is a drop-in open-source fork; the files below work with both.

### 13.1 State Bucket (One-Time, By Hand)

Terraform state maps code to real resources and can contain secrets (the generated database password). Store it in a versioned, private GCS bucket, never in Git.

```bash
gcloud storage buckets create gs://acme-shop-prod-tfstate \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --public-access-prevention

gcloud storage buckets update gs://acme-shop-prod-tfstate --versioning
```

The GCS backend locks state during `apply`, so two people cannot apply at once.

### 13.2 Layout

```txt
infra/
  versions.tf     Terraform + provider versions, GCS backend
  variables.tf    inputs with production defaults
  project.tf      APIs
  network.tf      VPC, subnet, NAT, Private Service Access, ingress IP
  gke.tf          node service account, cluster, node pool
  registry.tf     Artifact Registry + cleanup policies
  database.tf     Cloud SQL, database, user, password in Secret Manager
  storage.tf      uploads bucket
  iam.tf          app identity, Workload Identity, GitHub federation
  dns.tf          Cloud DNS zone + api record
  monitoring.tf   uptime check + alert policies
  outputs.tf
```

### 13.3 Files

`infra/versions.tf`:

```hcl
terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State lives in a versioned GCS bucket created once by hand (section 13.1).
  backend "gcs" {
    bucket = "acme-shop-prod-tfstate"
    prefix = "shop/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

`infra/variables.tf`:

```hcl
variable "project_id" {
  type    = string
  default = "acme-shop-prod"
}

variable "region" {
  type    = string
  default = "asia-southeast1"
}

variable "github_repository" {
  description = "owner/repo allowed to deploy through Workload Identity Federation"
  type        = string
  default     = "acme/shop-api"
}

variable "admin_cidrs" {
  description = "CIDRs allowed to reach the GKE control plane IP endpoint"
  type        = list(string)
  default     = ["203.0.113.10/32"]
}

variable "domain" {
  type    = string
  default = "example.com"
}
```

`infra/project.tf`:

```hcl
data "google_project" "this" {}

locals {
  apis = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "secretmanager.googleapis.com",
    "dns.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.apis)
  service            = each.value
  disable_on_destroy = false
}
```

`infra/network.tf`:

```hcl
resource "google_compute_network" "shop" {
  name                    = "shop-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "gke" {
  name                     = "shop-gke-subnet"
  network                  = google_compute_network.shop.id
  region                   = var.region
  ip_cidr_range            = "10.10.0.0/20"
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.16.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.20.0.0/20"
  }
}

# Private nodes have no public IP; Cloud NAT gives them outbound internet.
resource "google_compute_router" "shop" {
  name    = "shop-router"
  network = google_compute_network.shop.id
  region  = var.region
}

resource "google_compute_router_nat" "shop" {
  name                               = "shop-nat"
  router                             = google_compute_router.shop.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Private Service Access: lets Cloud SQL get a private IP inside this VPC.
resource "google_compute_global_address" "private_services" {
  name          = "google-managed-services-shop-vpc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.shop.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.shop.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}

# Public entry point: ingress-nginx LoadBalancer Service uses this IP.
resource "google_compute_address" "ingress" {
  name   = "shop-ingress-ip"
  region = var.region
}
```

`infra/gke.tf`:

```hcl
resource "google_service_account" "gke_nodes" {
  account_id   = "gke-nodes"
  display_name = "GKE node pool"
}

# Minimum permissions nodes need (logs, metrics, image pulls).
resource "google_project_iam_member" "gke_nodes" {
  project = var.project_id
  role    = "roles/container.defaultNodeServiceAccount"
  member  = google_service_account.gke_nodes.member
}

resource "google_artifact_registry_repository_iam_member" "gke_nodes_pull" {
  location   = google_artifact_registry_repository.shop.location
  repository = google_artifact_registry_repository.shop.name
  role       = "roles/artifactregistry.reader"
  member     = google_service_account.gke_nodes.member
}

resource "google_container_cluster" "shop" {
  name     = "shop-gke"
  location = var.region

  network    = google_compute_network.shop.id
  subnetwork = google_compute_subnetwork.gke.id

  # Node pools are managed separately below.
  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "REGULAR"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Dataplane V2 (eBPF) enforces NetworkPolicy.
  datapath_provider = "ADVANCED_DATAPATH"

  private_cluster_config {
    enable_private_nodes = true
  }

  control_plane_endpoints_config {
    # IAM-protected DNS endpoint: CI reaches the control plane without IP allowlists.
    dns_endpoint_config {
      allow_external_traffic = true
    }
  }

  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.admin_cidrs
      content {
        cidr_block = cidr_blocks.value
      }
    }
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  deletion_protection = true
}

resource "google_container_node_pool" "general" {
  name     = "general"
  cluster  = google_container_cluster.shop.id
  location = var.region

  # Per zone: regional cluster has 3 zones.
  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type    = "e2-standard-4"
    disk_size_gb    = 50
    disk_type       = "pd-balanced"
    service_account = google_service_account.gke_nodes.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}
```

`infra/registry.tf`:

```hcl
resource "google_artifact_registry_repository" "shop" {
  repository_id = "shop"
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]

  # Keep the 30 newest images; delete untagged images after 7 days.
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 30
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}
```

`infra/database.tf`:

```hcl
resource "google_sql_database_instance" "shop" {
  name             = "shop-pg"
  region           = var.region
  database_version = "POSTGRES_17"
  depends_on       = [google_service_networking_connection.private_services]

  settings {
    edition           = "ENTERPRISE"
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.shop.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "19:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 14
      }
    }

    maintenance_window {
      day  = 7
      hour = 20
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "shop" {
  name     = "shop"
  instance = google_sql_database_instance.shop.name
}

# Hex keeps the password URL-safe inside DATABASE_URL.
resource "random_id" "db_password" {
  byte_length = 32
}

resource "google_sql_user" "shop_api" {
  name     = "shop_api"
  instance = google_sql_database_instance.shop.name
  password = random_id.db_password.hex
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "shop-api-db-password"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_id.db_password.hex
}
```

The generated password is stored in Terraform state. Protect the state bucket like a secret. Alternatives: create the password outside Terraform and add it with `gcloud secrets versions add`, or use IAM database authentication and no password at all.

`infra/storage.tf`:

```hcl
resource "google_storage_bucket" "uploads" {
  name     = "${var.project_id}-uploads"
  location = var.region

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  # Browsers PUT/GET directly to the bucket with signed URLs.
  # response_header also lists request headers allowed in preflight (size-limit header from section 3.8).
  cors {
    origin          = ["https://app.${var.domain}"]
    method          = ["PUT", "GET"]
    response_header = ["Content-Type", "x-goog-content-length-range"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }
}
```

`infra/iam.tf`:

```hcl
# ---- Application identity ----
resource "google_service_account" "shop_api" {
  account_id   = "shop-api"
  display_name = "shop-api workload"
}

# Kubernetes SA shop/shop-api may act as this Google SA (Workload Identity).
resource "google_service_account_iam_member" "shop_api_workload_identity" {
  service_account_id = google_service_account.shop_api.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[shop/shop-api]"
}

# Sign GCS URLs without a private key (IAM signBlob on itself).
resource "google_service_account_iam_member" "shop_api_sign" {
  service_account_id = google_service_account.shop_api.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = google_service_account.shop_api.member
}

resource "google_project_iam_member" "shop_api_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = google_service_account.shop_api.member
}

resource "google_storage_bucket_iam_member" "shop_api_uploads" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectUser"
  member = google_service_account.shop_api.member
}

resource "google_secret_manager_secret_iam_member" "shop_api_db_password" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.shop_api.member
}

# ---- GitHub Actions identity (no JSON keys) ----
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "shop-api"
  display_name                       = "shop-api repository"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # Only tokens from this repository are accepted.
  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

locals {
  github_principal = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_artifact_registry_repository_iam_member" "github_push" {
  location   = google_artifact_registry_repository.shop.location
  repository = google_artifact_registry_repository.shop.name
  role       = "roles/artifactregistry.writer"
  member     = local.github_principal
}

resource "google_project_iam_member" "github_deploy" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = local.github_principal
}
```

`infra/dns.tf`:

```hcl
resource "google_dns_managed_zone" "shop" {
  name       = "example-com"
  dns_name   = "${var.domain}."
  depends_on = [google_project_service.apis]
}

resource "google_dns_record_set" "api" {
  managed_zone = google_dns_managed_zone.shop.name
  name         = "api.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_address.ingress.address]
}
```

`infra/monitoring.tf`:

```hcl
resource "google_monitoring_uptime_check_config" "api" {
  display_name = "shop-api /healthz"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/healthz"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "api.${var.domain}"
    }
  }
}

resource "google_monitoring_notification_channel" "oncall_email" {
  display_name = "On-call email"
  type         = "email"
  labels = {
    email_address = "oncall@${var.domain}"
  }
}

resource "google_monitoring_alert_policy" "api_down" {
  display_name = "shop-api is down"
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failing"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${google_monitoring_uptime_check_config.api.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "120s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.oncall_email.name]
}

# p95 latency from the app's Prometheus histogram (Managed Service for Prometheus).
resource "google_monitoring_alert_policy" "api_latency" {
  display_name = "shop-api p95 latency > 1s"
  combiner     = "OR"

  conditions {
    display_name = "p95 latency"
    condition_prometheus_query_language {
      query    = "histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{namespace=\"shop\"}[5m]))) > 1"
      duration = "300s"
    }
  }

  notification_channels = [google_monitoring_notification_channel.oncall_email.name]
}
```

`infra/outputs.tf`:

```hcl
output "ingress_ip" {
  value = google_compute_address.ingress.address
}

output "dns_name_servers" {
  description = "Set these at your domain registrar"
  value       = google_dns_managed_zone.shop.name_servers
}

output "sql_connection_name" {
  value = google_sql_database_instance.shop.connection_name
}

output "github_workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}
```

### 13.4 Run

```bash
cd infra
terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan        # read every line: what will be created, changed, DESTROYED
terraform apply tfplan

terraform output
terraform output -raw ingress_ip
```

Pass different inputs without editing files:

```bash
terraform plan -var='admin_cidrs=["198.51.100.7/32"]' -var='domain=shop.example.org'
```

`deletion_protection = true` on the cluster and database means `terraform destroy` fails until you set it to `false` and apply. That is the point.

### 13.5 Importing Resources Created With gcloud

```hcl
# infra/imports.tf
import {
  to = google_container_cluster.shop
  id = "projects/acme-shop-prod/locations/asia-southeast1/clusters/shop-gke"
}

import {
  to = google_sql_database_instance.shop
  id = "acme-shop-prod/shop-pg"
}
```

```bash
terraform plan    # shows "will be imported" plus any differences to reconcile
```

Adjust the code until `plan` shows no unwanted changes, apply, then delete `imports.tf`.

### 13.6 Staging

Turn `infra/` into a module and call it once per environment:

```txt
infra/
  modules/shop/        the .tf files above (minus backend and provider blocks)
  envs/
    prod/main.tf       module "shop" { source = "../../modules/shop", project_id = "acme-shop-prod", ... }
    staging/main.tf    module "shop" { source = "../../modules/shop", project_id = "acme-shop-stg",  ... }
```

Differences for staging:

```txt
project_id                acme-shop-stg; state bucket acme-shop-stg-tfstate
Cloud SQL                 availability_type = "ZONAL", smaller tier
Cluster                   zonal location, smaller node pool
Artifact Registry         none; staging pulls from the production registry
GitHub federation pool    none; production pool principals are granted roles in staging
DNS                       api.staging.example.com record (same zone, or a delegated sub-zone)
```

Staging nodes pull production images:

```bash
gcloud artifacts repositories add-iam-policy-binding shop \
  --project=acme-shop-prod \
  --location="$REGION" \
  --member="serviceAccount:gke-nodes@acme-shop-stg.iam.gserviceaccount.com" \
  --role=roles/artifactregistry.reader
```

### 13.7 Terraform In CI

```txt
Pull request  -> terraform fmt -check, validate, plan; post plan as PR comment
Merge to main -> terraform apply (separate identity with broader IAM than the app deploy identity)
```

Atlantis, Terraform Cloud/HCP Terraform, Spacelift, and plain GitHub Actions all implement this. Keep infrastructure in its own repository or directory with its own CODEOWNERS.


## 14. Observability

### 14.1 Logs (Cloud Logging)

GKE ships every container's stdout/stderr to Cloud Logging. JSON lines become structured entries; `severity` and `message` map to native fields (3.5).

Logs Explorer queries:

```txt
resource.type="k8s_container"
resource.labels.namespace_name="shop"
resource.labels.container_name="shop-api"
severity>=ERROR
```

```txt
resource.type="k8s_container"
resource.labels.namespace_name="ingress-nginx"
jsonPayload.host="api.example.com"
jsonPayload.status>=500
```

CLI:

```bash
gcloud logging read \
  'resource.type="k8s_container" AND resource.labels.namespace_name="shop" AND severity>=ERROR' \
  --freshness=1h --limit=50 --format=json | jq -r '.[].jsonPayload.message'
```

Correlate one request across nginx and app logs with the request ID: ingress-nginx logs `request_id` and forwards it as `X-Request-ID`. Make pino-http use it:

```ts
app.use(pinoHttp({ logger, genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID() }));
```

Retention: `_Default` bucket keeps 30 days. Longer audit retention: a log sink to a bucket or BigQuery.

### 14.2 Metrics (Managed Service for Prometheus)

`PodMonitoring` objects (chart for the app, 9.3 for ingress-nginx) tell Google's collectors what to scrape. Query with PromQL in Cloud Monitoring -> Metrics Explorer -> PromQL, or connect Grafana to the Prometheus API.

```promql
# Requests per second by route
sum by (route) (rate(http_request_duration_seconds_count{namespace="shop"}[5m]))

# Error ratio (5xx / all)
sum(rate(http_request_duration_seconds_count{namespace="shop", status_code=~"5.."}[5m]))
/
sum(rate(http_request_duration_seconds_count{namespace="shop"}[5m]))

# p95 latency
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{namespace="shop"}[5m])))

# Event loop lag (Node-specific saturation signal)
max(nodejs_eventloop_lag_p99_seconds{namespace="shop"})

# Edge view from ingress-nginx
sum by (status) (rate(nginx_ingress_controller_requests{host="api.example.com"}[5m]))
```

Infrastructure metrics (CPU, memory, restarts, node health) come built in: Cloud Monitoring -> Dashboards -> GKE.

```bash
kubectl top nodes
kubectl -n shop top pods --containers
```

### 14.3 Uptime Checks And Alerts

```bash
gcloud monitoring uptime create shop-api-healthz \
  --resource-type=uptime-url \
  --resource-labels=host="$API_HOST",project_id="$PROJECT_ID" \
  --protocol=https \
  --path=/healthz \
  --period=1
```

Probes from several regions on the public internet: the only check that sees DNS, certificate expiry, load balancer, and app together, the way users do.

Alert policies (Terraform in 13.3 creates both):

```txt
Uptime check failing for 2 minutes         -> page
p95 latency > 1s for 5 minutes             -> page
5xx ratio > 2% for 5 minutes               -> page
Pod restarts > 3 in 15 minutes             -> ticket
Cloud SQL CPU > 80% / disk > 85%           -> ticket
Certificate expires in < 14 days           -> ticket (cert-manager renewal broken)
```

Define SLOs (for example 99.9% of requests succeed under 500 ms over 30 days) in Cloud Monitoring -> SLOs, and alert on error-budget burn rate instead of raw thresholds once traffic is steady.

### 14.4 Tracing (Next Step)

OpenTelemetry Node SDK with auto-instrumentation for `http`, `express`, and `pg` exports spans to Cloud Trace. Each slow request then shows time spent in handler, SQL queries, and Cloud Storage calls.

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @google-cloud/opentelemetry-cloud-trace-exporter
```

Start it before the app loads (`node --import ./dist/tracing.js dist/server.js`). Add `"logging.googleapis.com/trace"` to log lines to link logs and traces.

## 15. Security Checklist

Ordered by impact.

Identity and access:

```txt
[x] No service account keys anywhere: Workload Identity (Pods), Workload Identity Federation (CI).
[x] App GSA has bucket-, secret-, and SA-scoped roles; only cloudsql.client is project-level.
[x] Node GSA minimal (container.defaultNodeServiceAccount + registry reader).
[ ] Humans: Google Groups in IAM, not individual users; roles/container.developer for engineers,
    admin only for the platform team. Kubernetes RBAC per namespace on top.
[ ] Organization policies: disable service account key creation, restrict public IPs on VMs,
    require OS Login, restrict resource locations.
```

Network:

```txt
[x] Private nodes; outbound via Cloud NAT only.
[x] Control plane IP endpoint restricted to known CIDRs; DNS endpoint protected by IAM.
[x] Cloud SQL private IP only, encrypted connections required.
[x] NetworkPolicy: only ingress-nginx reaches app port; only Prometheus reaches metrics port.
[ ] Cloud Armor in front (needs an HTTP(S) load balancer: GKE Gateway/Ingress, section 19)
    for WAF rules, geo blocking, and L7 DDoS protection.
```

Workloads:

```txt
[x] Pod Security "restricted": non-root, no privilege escalation, all capabilities dropped,
    read-only root filesystem, RuntimeDefault seccomp.
[x] Images pinned by git SHA; scanned in CI; Artifact Registry continuous scanning.
[x] Secrets only in Secret Manager; synced at runtime; never in Git, images, or Helm values.
[ ] Binary Authorization: cluster runs only images signed by your CI (attestations).
[ ] Image signing with cosign/Sigstore + SLSA provenance (docker/build-push-action can emit provenance).
[ ] GKE Security Posture dashboard: workload configuration and vulnerability findings.
```

Data:

```txt
[x] Cloud SQL automated backups + PITR; regional HA.
[x] Bucket: uniform access, public access prevention, versioning.
[ ] Customer-managed encryption keys (CMEK) if compliance requires.
[ ] Cloud Audit Logs: Data Access logs for Secret Manager and Cloud SQL Admin.
```

Supply chain:

```txt
[x] Lockfile committed; npm ci everywhere.
[ ] Dependabot/Renovate for npm, Docker base images, GitHub Actions, Helm charts.
[ ] Third-party GitHub Actions pinned by commit SHA.
```

## 16. Day-2 Operations

### 16.1 Daily Commands Cheat Sheet

Examples use namespace `shop`, Deployment `shop-api`, release `shop-api`, and node pool `default-pool` (the name `gcloud container clusters create` gives the first pool; Terraform in 13.3 names it `general`). `<pod>` = a Pod name from `kubectl -n shop get pods`.

Optional helpers that make all of this faster: `k9s` (terminal UI), `kubectx`/`kubens` (switch context/namespace), `stern` (multi-Pod log tailing), `helm-diff` (preview upgrades).

#### Clusters, Contexts, Namespaces

Two clusters (staging, production) means two contexts. Know which one you are in before every write command.

```bash
# Fetch credentials for both clusters (one-time per laptop).
gcloud container clusters get-credentials shop-gke --region=asia-southeast1 --project=acme-shop-prod
gcloud container clusters get-credentials shop-gke --region=asia-southeast1 --project=acme-shop-stg

# Short names instead of gke_acme-shop-prod_asia-southeast1_shop-gke.
kubectl config rename-context gke_acme-shop-prod_asia-southeast1_shop-gke prod
kubectl config rename-context gke_acme-shop-stg_asia-southeast1_shop-gke staging

kubectl config get-contexts                       # * marks the current one
kubectl config current-context
kubectl config use-context staging
kubectl config set-context --current --namespace=shop   # default namespace; -n shop becomes optional

# One-off command against another cluster without switching.
kubectl --context prod -n shop get pods

gcloud container clusters list --project=acme-shop-prod
```

Safety habit: show the context in your shell prompt (kube-ps1, starship, or k9s header), and use `--context prod` explicitly for production writes.

#### Look Around

```bash
kubectl -n shop get pods -o wide                          # status, restarts, IP, node
kubectl -n shop get pods -l app.kubernetes.io/name=shop-api --show-labels
kubectl -n shop get pods -w                               # watch changes live (Ctrl-C to stop)
kubectl -n shop get deploy,rs,svc,ingress,hpa,pdb,job      # main objects at once
kubectl -n shop get externalsecret,secretstore,certificate # CRD objects ("get all" skips these)
kubectl get pods -A --field-selector=status.phase!=Running  # anything not running, all namespaces

kubectl -n shop describe deploy shop-api                  # spec + rollout conditions + events
kubectl -n shop describe pod <pod>                        # probes, restarts, OOMKilled, scheduling
kubectl -n shop get deploy shop-api -o yaml               # full live object
kubectl -n shop get deploy shop-api -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'   # running image

kubectl -n shop events --types=Warning                    # recent warnings in namespace
kubectl -n shop events --for pod/<pod>                    # events for one object
kubectl -n shop get events --sort-by=.lastTimestamp | tail -20

kubectl api-resources --namespaced=true                   # every object type the cluster knows
kubectl explain deployment.spec.strategy --recursive      # field docs from the API server
```

#### Logs

```bash
kubectl -n shop logs deploy/shop-api -c shop-api --tail=100          # one Pod of the Deployment
kubectl -n shop logs deploy/shop-api -c shop-api -f --since=10m      # follow
kubectl -n shop logs <pod> -c shop-api --previous                    # container before last crash/restart
kubectl -n shop logs <pod> -c cloud-sql-proxy --timestamps

# All replicas at once, prefixed with Pod/container name.
kubectl -n shop logs -l app.kubernetes.io/name=shop-api --all-containers --prefix --since=15m --max-log-requests=20

# JSON logs -> readable lines.
kubectl -n shop logs deploy/shop-api -c shop-api --tail=200 | jq -r 'select(.severity=="ERROR") | "\(.time) \(.message)"'

stern -n shop shop-api                                               # tail every matching Pod, follows new Pods
```

`kubectl logs` reads only what is still on the node (recent, current and previous container). Older logs: Cloud Logging (14.1).

#### Exec, Copy, Port-Forward, Debug

```bash
kubectl -n shop exec -it deploy/shop-api -c shop-api -- sh           # shell (node image has sh; distroless does not)
kubectl -n shop exec deploy/shop-api -c shop-api -- env | sort        # effective env vars (shows secrets: careful)
kubectl -n shop exec deploy/shop-api -c shop-api -- node -e "fetch('http://localhost:8080/readyz').then(r=>r.text()).then(console.log)"

kubectl -n shop cp <pod>:/tmp/heap.heapsnapshot ./heap.heapsnapshot -c shop-api   # copy file out (needs tar in image)

kubectl -n shop port-forward svc/shop-api 8080:80                    # Service -> localhost:8080
kubectl -n shop port-forward <pod> 9464:9464                         # one Pod's metrics port

kubectl -n shop debug -it <pod> --image=busybox:1.37 --target=shop-api -- sh      # ephemeral debug container
kubectl debug node/<node> -it --image=busybox:1.37 --profile=sysadmin           # shell on a node (host at /host)
```

`readOnlyRootFilesystem: true` means writes inside the app container fail except in mounted volumes. Debug containers have their own writable filesystem.

#### Resource Usage

```bash
kubectl top nodes
kubectl -n shop top pods --containers                     # per container (app vs proxy)
kubectl top pods -A --sort-by=memory | head -15           # heaviest Pods in cluster
kubectl describe node <node> | sed -n '/Allocated resources/,/Events/p'   # requests vs capacity
kubectl -n shop get pods -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[*].restartCount,NODE:.spec.nodeName
```

`top` shows current usage; requests decide scheduling. Nodes "full" while `top` looks low = requests too high (wasted money). Usage near limits = OOM kills ahead.

#### Rollouts And Releases

```bash
kubectl -n shop rollout status deploy/shop-api --timeout=5m   # wait for current rollout
kubectl -n shop rollout history deploy/shop-api                # ReplicaSet revisions
kubectl -n shop rollout restart deploy/shop-api                # new Pods, same spec (reload secrets, clear bad state)

helm -n shop list
helm -n shop status shop-api
helm -n shop history shop-api
helm -n shop get values shop-api --all                         # every value incl. defaults
helm -n shop get manifest shop-api | less
helm -n shop rollback shop-api <revision> --wait               # preferred rollback: keeps Helm and cluster in sync

# Preview an upgrade as a diff before running it (helm-diff plugin, signed release for Helm 4).
curl -sL https://github.com/databus23.gpg | gpg --import
# Asset per OS/CPU: helm-diff-macos-arm64.tgz, helm-diff-linux-amd64.tgz, ...
helm plugin install https://github.com/databus23/helm-diff/releases/latest/download/helm-diff-macos-arm64.tgz
helm diff upgrade shop-api chart/shop-api -n shop --set image.tag="$TAG"
```

Emergency-only (Helm does not know about these; the next `helm upgrade` overwrites them):

```bash
kubectl -n shop rollout undo deploy/shop-api                         # previous ReplicaSet
kubectl -n shop rollout undo deploy/shop-api --to-revision=7
kubectl -n shop rollout pause deploy/shop-api                        # freeze a bad rollout midway
kubectl -n shop rollout resume deploy/shop-api
kubectl -n shop set image deploy/shop-api shop-api="$IMAGE:<good-sha>"
```

After any emergency change, make the same change in Git and deploy normally.

#### Config And Secrets

```bash
kubectl -n shop get configmap shop-api -o yaml
kubectl -n shop get secret shop-api-secrets -o jsonpath='{.data}' | jq 'keys'     # key names only
kubectl -n shop get secret shop-api-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d   # value (careful: prints password)
kubectl -n shop describe externalsecret shop-api-secrets                          # last sync status
kubectl -n shop annotate externalsecret shop-api-secrets force-sync="$(date +%s)" --overwrite   # sync now
```

Env vars are read at container start. After a Secret or ConfigMap change, run `rollout restart` (the chart's checksum annotation does this automatically for ConfigMap changes made through Helm).

#### Pods, Jobs, Cleanup

```bash
kubectl -n shop delete pod <pod>                                    # Deployment replaces it (safe "turn it off and on")
kubectl -n shop delete pod <pod> --grace-period=0 --force           # stuck Terminating only; skips graceful shutdown
kubectl -n shop get jobs
kubectl -n shop logs job/shop-api-migrate -c migrate                # failed migration output (failed Jobs are kept)
kubectl -n shop delete job shop-api-migrate                         # after fixing, before re-deploying
kubectl delete pods -A --field-selector=status.phase=Failed         # clear evicted/failed Pods
kubectl -n shop wait --for=condition=available deploy/shop-api --timeout=5m
```

#### Permissions

```bash
kubectl auth can-i --list -n shop                                   # what can I do here?
kubectl auth can-i create deployments -n shop
kubectl auth can-i get secrets -n shop --as=system:serviceaccount:shop:shop-api   # what can a ServiceAccount do?
gcloud projects get-iam-policy acme-shop-prod --flatten='bindings[].members' \
  --filter="bindings.members:shop-api@" --format='table(bindings.role)'          # Google roles of the app GSA
```

#### Cloud Side Quick Checks

```bash
gcloud container operations list --region=asia-southeast1 --filter="status=RUNNING"   # upgrades/resizes in progress
gcloud container node-pools list --cluster=shop-gke --region=asia-southeast1
gcloud sql instances list
gcloud sql operations list --instance=shop-pg --limit=5             # backups, restarts, maintenance
gcloud artifacts docker tags list asia-southeast1-docker.pkg.dev/acme-shop-prod/shop/shop-api --limit=10
gcloud logging read 'resource.type="k8s_container" AND resource.labels.namespace_name="shop" AND severity>=ERROR' --freshness=30m --limit=20
```

### 16.2 Scaling

```txt
More Pods      HPA does it on CPU. Raise maxReplicas or lower the target if latency rises first.
Bigger Pods    Raise requests/limits in values; HPA percentages follow requests.
More nodes     Cluster autoscaler adds nodes when Pods are Pending for lack of capacity.
               Raise node pool max, or add a node pool with a bigger machine type.
Database       Vertical: gcloud sql instances patch shop-pg --tier=db-custom-4-15360 (brief restart).
               Reads: add read replicas. Connections: add PgBouncer before raising max_connections.
```

#### Pods

With HPA (production values):

```bash
kubectl -n shop get hpa shop-api                       # TARGETS cpu: current/target, MINPODS, MAXPODS, REPLICAS
kubectl -n shop describe hpa shop-api                  # scaling decisions and reasons in events
kubectl -n shop get hpa shop-api -w

# Incident: raise the floor/ceiling immediately.
kubectl -n shop patch hpa shop-api -p '{"spec":{"minReplicas":6,"maxReplicas":20}}'
```

`kubectl scale` on an HPA-managed Deployment is undone at the next HPA sync (about 15 seconds). Change the HPA instead. Then commit the same numbers to `values.yaml`; the next deploy would revert the patch otherwise.

Without HPA (staging values, `autoscaling.enabled: false`):

```bash
kubectl -n shop scale deploy/shop-api --replicas=3
kubectl -n shop scale deploy/shop-api --replicas=0     # stop the app, keep everything else (saves cost overnight)
kubectl -n shop scale deploy/shop-api --replicas=1     # start again
```

Scaling a Deployment that has an HPA to 0 disables that HPA until replicas are set above 0 again.

Durable change (all environments): edit `replicaCount` or `autoscaling.*` in values and deploy through CI.

Watch the effect:

```bash
kubectl -n shop get pods -w
kubectl -n shop rollout status deploy/shop-api
kubectl -n shop top pods --containers
```

#### Nodes

```bash
kubectl get nodes -L topology.kubernetes.io/zone,cloud.google.com/gke-nodepool   # zone and pool per node

# Change autoscaler limits (per zone; regional pool has 3 zones).
gcloud container node-pools update default-pool --cluster=shop-gke --region=asia-southeast1 \
  --enable-autoscaling --min-nodes=1 --max-nodes=5

# Fixed size, e.g. staging at night (autoscaler, if enabled, moves it back within min/max).
gcloud container clusters resize shop-gke --node-pool=default-pool --num-nodes=0 --region=asia-southeast1

# Bigger machines: new pool, move workloads, delete old pool. Zero downtime with PDBs.
gcloud container node-pools create pool-e2-std-8 --cluster=shop-gke --region=asia-southeast1 \
  --machine-type=e2-standard-8 --num-nodes=1 --enable-autoscaling --min-nodes=1 --max-nodes=3 \
  --service-account="$NODE_GSA" --workload-metadata=GKE_METADATA --shielded-secure-boot

for n in $(kubectl get nodes -l cloud.google.com/gke-nodepool=default-pool -o name); do
  kubectl cordon "$n"                                  # no new Pods
done
for n in $(kubectl get nodes -l cloud.google.com/gke-nodepool=default-pool -o name); do
  kubectl drain "$n" --ignore-daemonsets --delete-emptydir-data --timeout=10m   # evict, respecting PDBs
done
gcloud container node-pools delete default-pool --cluster=shop-gke --region=asia-southeast1

# Maintenance on one node by hand.
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
kubectl uncordon <node>                                # allow scheduling again
```

`drain` uses the eviction API, so PDBs hold: with `minAvailable: 1` and 2 replicas, drain waits until a replacement Pod is Ready elsewhere. A drain stuck forever usually means a PDB that can never be satisfied (for example `minAvailable` equal to replica count).

Spot node pool for interruptible work: add `--spot --node-taints=cloud.google.com/gke-spot=true:NoSchedule` to `node-pools create`; only Pods with a matching toleration land there.

#### Right-Sizing With Vertical Pod Autoscaler

Requests guessed at launch are usually wrong. VPA in recommendation mode watches real usage and suggests requests without changing anything:

```bash
gcloud container clusters update shop-gke --region=asia-southeast1 --enable-vertical-pod-autoscaling
```

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: shop-api
  namespace: shop
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: shop-api
  updatePolicy:
    # Recommend only. "Auto" would restart Pods to apply new requests, and fights a CPU-based HPA.
    updateMode: "Off"
```

```bash
kubectl -n shop describe vpa shop-api      # Recommendation: Target / Lower Bound / Upper Bound per container
```

Copy the `Target` values into `resources.requests` in `values.yaml` after a week of real traffic. Do not let VPA and HPA both act on CPU for the same Deployment. GKE Autopilot and the GKE cost optimization insights show similar recommendations.

#### Database

```bash
gcloud sql instances patch shop-pg --tier=db-custom-4-15360          # vertical; restarts instance (HA fails over)
gcloud sql instances create shop-pg-replica-1 --master-instance-name=shop-pg --region=asia-southeast1 \
  --tier=db-custom-2-7680 --network="projects/acme-shop-prod/global/networks/shop-vpc" --no-assign-ip   # read replica
```

### 16.3 Cluster Upgrades

The release channel upgrades the control plane and nodes automatically. Control timing and blast radius:

```bash
gcloud container get-server-config --region="$REGION" --format="yaml(channels)"   # versions per channel
gcloud container clusters get-upgrade-info "$CLUSTER" --region="$REGION"

# Maintenance window: upgrades only on weekends, 18:00-22:00 UTC.
gcloud container clusters update "$CLUSTER" --region="$REGION" \
  --maintenance-window-start=2026-01-03T18:00:00Z \
  --maintenance-window-end=2026-01-03T22:00:00Z \
  --maintenance-window-recurrence='FREQ=WEEKLY;BYDAY=SA,SU'
```

What keeps upgrades invisible to users: 2+ replicas, PDB, readiness probes, preStop + graceful shutdown, `maxSurge=1/maxUnavailable=0` on node upgrades. Staging on the `rapid` or same channel upgrades first and catches deprecated API usage (check GKE's deprecation insights before each minor version).

### 16.4 Database Backups And Restore

```bash
gcloud sql backups list --instance="$SQL_INSTANCE"
gcloud sql backups create --instance="$SQL_INSTANCE" --description="before risky migration"

# Point-in-time recovery: clone into a NEW instance at a timestamp, inspect, then cut over or copy data back.
gcloud sql instances clone "$SQL_INSTANCE" shop-pg-restore-20261014 \
  --point-in-time='2026-10-14T03:15:00Z'
```

A backup you never restored is a hope, not a backup. Restore into a scratch instance quarterly and time it: that time is your real recovery time objective.

Logical exports for long-term or cross-cloud copies:

```bash
gcloud sql export sql "$SQL_INSTANCE" "gs://${PROJECT_ID}-db-exports/shop-$(date +%F).sql.gz" --database="$DB_NAME"
```

The Cloud SQL service account needs `roles/storage.objectCreator` on that export bucket.

Cluster state backups: Git (chart, values, platform values files) plus Terraform can rebuild every Kubernetes object, so treat a lost cluster as "recreate and redeploy" and rehearse it. Back up the cluster only for state that is not in Git: PersistentVolumes, objects created by hand, and secrets that exist only in the cluster. Backup for GKE does that (enable the add-on with `gcloud container clusters update shop-gke --region=asia-southeast1 --update-addons=BackupRestore=ENABLED`, then create a backup plan in the console or with the Terraform `google_gke_backup_backup_plan` resource). Velero is the provider-neutral equivalent.

### 16.5 Ad-Hoc SQL Access

No public IP exists. Run a temporary client Pod inside the VPC, in a namespace without the `restricted` policy:

```bash
kubectl create namespace debug
SQL_IP=$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(ipAddresses[0].ipAddress)')

kubectl -n debug run psql --rm -it --restart=Never --image=postgres:17 -- \
  psql "host=$SQL_IP port=5432 dbname=$DB_NAME user=$DB_USER sslmode=require"
```

The password is in Secret Manager: `gcloud secrets versions access latest --secret=shop-api-db-password`. Prefer read-only users for humans, and audit who has `secretAccessor`.

### 16.6 Secret Rotation

```bash
NEW_PASSWORD=$(openssl rand -hex 32)

# 1. New secret version (ESO will pick it up).
printf '%s' "$NEW_PASSWORD" | gcloud secrets versions add shop-api-db-password --data-file=-

# 2. Change the database password.
gcloud sql users set-password "$DB_USER" --instance="$SQL_INSTANCE" --password="$NEW_PASSWORD"
unset NEW_PASSWORD

# 3. Force sync now instead of waiting for refreshInterval, then restart Pods to read the new env var.
kubectl -n shop annotate externalsecret shop-api-secrets force-sync="$(date +%s)" --overwrite
kubectl -n shop rollout restart deploy/shop-api

# 4. Disable the old version once everything is healthy.
gcloud secrets versions list shop-api-db-password
gcloud secrets versions disable <old-version> --secret=shop-api-db-password
```

Between steps 2 and 3, existing pooled connections keep working; only new connections need the new password. Rotate during low traffic, or use two database users and alternate between them for zero-error rotation. IAM database authentication removes this whole procedure.

### 16.7 Cost Control

```txt
Right-size requests from real usage (GKE cost optimization insights, kubectl top).
Staging: zonal cluster, ZONAL Cloud SQL, scale node pool to 0 at night (scheduled job or Terraform).
Spot VMs node pool for interruptible work (batch jobs, CI runners): large discount, can be reclaimed any time.
Committed use discounts once usage is steady.
Artifact Registry cleanup policies (section 6); log exclusions for noisy debug logs.
Egress: serve static assets through Cloud CDN; keep traffic in-region.
```

### 16.8 Tear Down

```bash
helm -n shop uninstall shop-api
helm -n external-dns uninstall external-dns
helm -n external-secrets uninstall external-secrets
helm -n cert-manager uninstall cert-manager
helm -n ingress-nginx uninstall ingress-nginx        # releases the load balancer

gcloud container clusters delete "$CLUSTER" --region="$REGION"

gcloud sql instances patch "$SQL_INSTANCE" --no-deletion-protection
gcloud sql instances delete "$SQL_INSTANCE"          # also deletes its automated backups

gcloud compute addresses delete shop-ingress-ip --region="$REGION"
gcloud storage rm --recursive "gs://$BUCKET"
gcloud artifacts repositories delete "$AR_REPO" --location="$REGION"

# Or remove everything billed in the project at once (30-day recovery window):
gcloud projects delete "$PROJECT_ID"
```

Read each target before deleting; production data is gone after the bucket and instance deletes.

## 17. Troubleshooting Runbook

Start with events; they explain most failures:

```bash
kubectl -n shop get events --sort-by=.lastTimestamp | tail -30
kubectl -n shop describe pod <pod>
```

### 17.1 Pod Status Problems

`ImagePullBackOff` / `ErrImagePull`:

```txt
Tag missing          gcloud artifacts docker images list ... --include-tags | grep <sha>
No permission        node GSA lacks roles/artifactregistry.reader on the repository
Wrong architecture   events say "exec format error" or "no matching manifest for linux/amd64": build --platform linux/amd64
Public registry      private nodes need Cloud NAT for docker.io, quay.io, ghcr.io
```

`CreateContainerConfigError`:

```txt
Secret shop-api-secrets not found -> ExternalSecret not synced:
  kubectl -n shop describe externalsecret shop-api-secrets
  kubectl -n shop describe secretstore gcp-secret-manager
Common causes: KSA annotation wrong, workloadIdentityUser binding missing, secretAccessor missing,
secret name typo, ESO not installed.
```

`CrashLoopBackOff`:

```bash
kubectl -n shop logs <pod> -c shop-api --previous
```

```txt
zod error at startup      missing/invalid env var (ConfigMap or Secret)
ECONNREFUSED 127.0.0.1:5432  proxy not running: check cloud-sql-proxy container logs
OOMKilled (describe pod: Last State Reason)  raise memory limit or fix leak (heap snapshot)
Liveness probe failed     event loop blocked or probe timeout too low
```

Cloud SQL Auth Proxy errors:

```txt
403 / permission denied on instance   GSA lacks roles/cloudsql.client, or Workload Identity binding/annotation wrong
Timeout dialing 10.x.x.x:3307         private path broken: Private Service Access peering missing or deleted
No private IP on instance             --private-ip needs an instance created with --network (private IP)
```

`Pending`:

```txt
"Insufficient cpu/memory"   node pool at max; raise --max-nodes or lower requests
"didn't match pod topology spread"  only with whenUnsatisfiable: DoNotSchedule
PVC unbound                 storage class/zone mismatch (this app uses no PVCs)
```

Pod Security rejection on `helm install`:

```txt
violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false ...
-> add the missing securityContext field named in the message
```

### 17.2 Workload Identity Check

```bash
kubectl -n shop run wi-test --rm -it --restart=Never \
  --overrides='{"spec":{"serviceAccountName":"shop-api"}}' \
  --image=google/cloud-sdk:slim -- gcloud auth list
# Active account must be shop-api@acme-shop-prod.iam.gserviceaccount.com
```

Pod Security `restricted` blocks this root image in namespace `shop`. Run it in a namespace without the policy and a same-named KSA bound the same way, or temporarily relax the label to `baseline`.

### 17.3 Ingress And Edge Problems

```txt
curl hangs / connection refused
  -> dig wrong IP? EXTERNAL-IP pending? Org policy blocking external LBs?
  -> kubectl -n ingress-nginx get svc,pods

404 from nginx ("default backend")
  -> Host header does not match any Ingress host, or ingressClassName is not "nginx"
  -> kubectl get ingress -A

502 Bad Gateway
  -> no ready Pods (endpointslices empty), app crashed mid-request, or keep-alive race
  -> app keepAliveTimeout must exceed nginx upstream keepalive timeout (3.10)

503 Service Temporarily Unavailable
  -> Service has zero ready endpoints: readiness failing (DB down?) or rate limit hit (limit-rps)

504 Gateway Timeout
  -> request exceeded proxy-read-timeout (60s); slow query or external call

413 Request Entity Too Large
  -> body bigger than proxy-body-size (1m); uploads must use signed URLs

"failed calling webhook validate.nginx.ingress.kubernetes.io"
  -> control plane cannot reach admission webhook: port/firewall (9.3)
```

ingress-nginx logs and generated config:

```bash
kubectl -n ingress-nginx logs deploy/ingress-nginx-controller --tail=100
kubectl -n ingress-nginx exec deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | grep -A20 'server_name api.example.com'
```

### 17.4 Certificate Problems

```bash
kubectl -n shop describe certificate shop-api-tls
kubectl -n shop describe challenge
kubectl -n cert-manager logs deploy/cert-manager --tail=100
```

```txt
Challenge pending, "connection refused/timeout"  DNS not pointing to INGRESS_IP yet, or port 80 blocked
Challenge 404                                     another Ingress catches the host; wrong ingressClassName
"too many certificates already issued"            Let's Encrypt prod rate limit; wait; use staging issuer for tests
Browser says untrusted                            still using letsencrypt-staging issuer
```

### 17.5 Debug Containers

Distroless or minimal images have no shell. Attach a temporary debug container that shares the Pod's process namespace:

```bash
kubectl -n shop debug -it <pod> --image=busybox:1.37 --target=shop-api -- sh
# inside: wget -qO- localhost:8080/healthz ; ps ; nslookup shop-api.shop.svc.cluster.local
```

From your laptop to an in-cluster Service or Pod:

```bash
kubectl -n shop port-forward svc/shop-api 8080:80
kubectl -n shop port-forward deploy/shop-api 9464:9464   # metrics port
```

### 17.6 Auth, CORS, Uploads

```txt
401 on every signed-in request
  -> decode the token (3.13) and compare: iss must equal OIDC_ISSUER exactly (trailing slash matters),
     aud must contain OIDC_AUDIENCE, exp in the future
  -> ID token sent where an access token is expected (or the reverse); providers differ
  -> JWKS URL unreachable: app logs show fetch errors; private nodes need Cloud NAT (5.4)
  -> node clock skew beyond 5s (rare on GKE)

Browser: "blocked by CORS policy" (curl works)
  -> page origin missing from CORS_ORIGINS (scheme + host + port must match exactly)
  -> preflight for a header not in allowedHeaders
  -> on the PUT to storage.googleapis.com: bucket CORS config (8.3), not the API

Upload PUT returns 403 SignatureDoesNotMatch
  -> client changed or dropped a signed header (Content-Type, x-goog-content-length-range)
  -> URL expired (15 minutes) or system clock far off

Upload PUT returns 400
  -> body larger than declared sizeBytes (x-goog-content-length-range)

POST /api/uploads returns 413
  -> sizeBytes above MAX_UPLOAD_BYTES; raise it in values env if intended

Download returns 404 from the API
  -> key belongs to another user, or was not issued by this API (strict key format)
```

## 18. Other Clouds: What Changes

The architecture stays identical. Only provider-specific edges change: identity, registry, managed database connection, object storage, load balancer annotations, DNS, and IaC providers.

### 18.1 Service Mapping

| Concern | Google Cloud (this guide) | AWS | Azure | Self-hosted / small cloud |
| --- | --- | --- | --- | --- |
| Kubernetes | GKE | EKS | AKS | k3s, DOKS, Linode LKE |
| Registry | Artifact Registry | ECR | ACR | GHCR, Harbor, DOCR |
| PostgreSQL | Cloud SQL | RDS / Aurora PostgreSQL | Azure Database for PostgreSQL Flexible Server | CloudNativePG operator, managed DB |
| DB connection | Cloud SQL Auth Proxy sidecar | Direct TLS (optional RDS Proxy, IAM auth) | Direct TLS over private endpoint / VNet | Direct TLS |
| Object storage | Cloud Storage | S3 | Blob Storage | S3-compatible (MinIO, R2, Spaces) |
| Upload URL | V4 signed URL | Presigned URL | User delegation SAS | Presigned URL (S3 API) |
| Secrets | Secret Manager | Secrets Manager / SSM Parameter Store | Key Vault | Vault, Sealed Secrets, SOPS |
| User sign-in (OIDC) | Identity Platform / Firebase Auth | Cognito | Entra ID / Entra External ID | Keycloak, ZITADEL, Auth0, Okta |
| Queue for background work | Pub/Sub, Cloud Tasks | SQS, SNS | Service Bus, Storage Queues | RabbitMQ, NATS, Redis (BullMQ) |
| Pod identity | Workload Identity | IRSA or EKS Pod Identity | Microsoft Entra Workload ID | none: scoped static credentials in Secrets |
| CI keyless auth | Workload Identity Federation | IAM OIDC provider + role | Federated credential on managed identity | deploy keys / kubeconfig in CI secrets |
| L4 load balancer | Passthrough Network LB | NLB (AWS Load Balancer Controller) | Azure Load Balancer | MetalLB, k3s ServiceLB, provider LB |
| Static IP | Regional address + `loadBalancerIP` | Elastic IPs per AZ (annotation) | Public IP resource (annotation) | VPS public IP |
| Outbound NAT | Cloud NAT | NAT Gateway | NAT Gateway | host networking |
| DNS | Cloud DNS | Route 53 | Azure DNS | Cloudflare, registrar DNS |
| Metrics | Managed Prometheus (`PodMonitoring`) | Amazon Managed Prometheus / CloudWatch | Azure Monitor managed Prometheus | kube-prometheus-stack (`ServiceMonitor`) |
| Logs | Cloud Logging | CloudWatch Logs (Fluent Bit) | Azure Monitor Logs | Loki + Grafana |
| Terraform provider | `hashicorp/google` | `hashicorp/aws` (+ `terraform-aws-modules/eks`) | `hashicorp/azurerm` | `digitalocean`, `linode`, or none |

Portable without changes: Dockerfile, app routes, Helm chart structure, ingress-nginx Ingress objects, cert-manager, External Secrets (provider block changes), HPA, PDB, NetworkPolicy (needs a policy-enforcing CNI), GitHub Actions structure.

### 18.2 App Code Changes

Only the storage adapter and config change. Routes and tests stay the same because they depend on `ObjectStorage`.

`src/config.ts`: widen the provider enum and add the Azure account:

```ts
  STORAGE_PROVIDER: z.enum(['gcs', 's3', 'azure']).default('gcs'),
  // Bucket (GCS/S3) or container (Azure) name.
  UPLOAD_BUCKET: z.string().min(1),
  AZURE_STORAGE_ACCOUNT: z.string().optional(),
```

AWS: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`, then `src/storage/s3.ts`:

```ts
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ObjectStorage, UploadTarget } from './types.js';

export class S3Storage implements ObjectStorage {
  // S3Client() uses the default AWS credential chain:
  // EKS Pod Identity / IRSA on EKS, `aws sso login` on a laptop. Region from AWS_REGION.
  constructor(
    private readonly bucket: string,
    private readonly client = new S3Client({}),
  ) {}

  async createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
    expiresInSeconds: number,
  ): Promise<UploadTarget> {
    // ContentLength is signed: S3 rejects a body of any other size.
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    return { url, headers: { 'Content-Type': contentType } };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}
```

Azure: `npm install @azure/storage-blob @azure/identity`, then `src/storage/azure.ts`:

```ts
import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
} from '@azure/storage-blob';
import type { ObjectStorage, UploadTarget } from './types.js';

export class AzureBlobStorage implements ObjectStorage {
  private readonly service: BlobServiceClient;

  // DefaultAzureCredential uses AKS Workload Identity in the cluster, `az login` on a laptop.
  constructor(
    private readonly accountName: string,
    private readonly containerName: string,
  ) {
    this.service = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new DefaultAzureCredential());
  }

  // SAS URLs cannot limit upload size. Enforce it after upload (Event Grid "BlobCreated" -> check size -> delete).
  async createUploadTarget(
    key: string,
    contentType: string,
    _sizeBytes: number,
    expiresInSeconds: number,
  ): Promise<UploadTarget> {
    const url = await this.signedUrl(key, 'cw', expiresInSeconds, contentType);
    // Azure requires x-ms-blob-type on PUT uploads.
    return { url, headers: { 'Content-Type': contentType, 'x-ms-blob-type': 'BlockBlob' } };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.signedUrl(key, 'r', expiresInSeconds);
  }

  // User delegation SAS: signed with the workload's Entra ID identity, no account key.
  private async signedUrl(key: string, permissions: string, expiresInSeconds: number, contentType?: string) {
    const startsOn = new Date(Date.now() - 60_000); // tolerate clock skew
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const delegationKey = await this.service.getUserDelegationKey(startsOn, expiresOn);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: key,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
        contentType,
      },
      delegationKey,
      this.accountName,
    ).toString();
    const blobUrl = this.service.getContainerClient(this.containerName).getBlockBlobClient(key).url;
    return `${blobUrl}?${sas}`;
  }
}
```

`src/storage/index.ts`:

```ts
import type { Config } from '../config.js';
import { AzureBlobStorage } from './azure.js';
import { GcsStorage } from './gcs.js';
import { S3Storage } from './s3.js';
import type { ObjectStorage } from './types.js';

export function createStorage(config: Config): ObjectStorage {
  switch (config.STORAGE_PROVIDER) {
    case 'gcs':
      return new GcsStorage(config.UPLOAD_BUCKET);
    case 's3':
      return new S3Storage(config.UPLOAD_BUCKET);
    case 'azure':
      if (!config.AZURE_STORAGE_ACCOUNT) throw new Error('AZURE_STORAGE_ACCOUNT is required for azure storage');
      return new AzureBlobStorage(config.AZURE_STORAGE_ACCOUNT, config.UPLOAD_BUCKET);
  }
}
```

This is why the API returns `headers` with each upload URL: Azure needs `x-ms-blob-type`, GCS needs its signed size header, S3 needs neither. Clients send whatever headers the API returns.

Upload size enforcement per provider:

```txt
GCS    x-goog-content-length-range signed into the URL: body larger than sizeBytes -> 400
S3     ContentLength signed into the URL: body of any other size -> 403
Azure  SAS cannot limit size. Check after upload: Event Grid BlobCreated event -> function/worker
       reads blob size -> deletes oversized blobs. Or upload through the API for small files.
```

Install only the SDK for the cloud you run on; unused adapters can be deleted.

Permissions the workload identity needs for uploads and downloads:

```txt
GCS    roles/storage.objectUser on bucket + roles/iam.serviceAccountTokenCreator on itself
S3     s3:PutObject + s3:GetObject on arn:aws:s3:::bucket/uploads/*
Azure  Storage Blob Data Contributor on the container + Storage Blob Delegator on the account
```

Bucket CORS must allow `PUT` and `GET` from the web origin on every provider, plus any custom request headers the provider needs.

Authentication (3.13) needs no change on other clouds: point `OIDC_*` at your provider (Cognito on AWS and Entra ID on Azure are the native choices; any OIDC provider works).

Logging: the `severity` mapping is Google-specific but harmless elsewhere. CloudWatch and Azure Monitor parse the same JSON lines.

Database TLS: Cloud SQL Auth Proxy handles TLS here. Connecting directly (RDS, Azure) means TLS in `DATABASE_URL`:

```txt
AWS RDS     ...?sslmode=verify-full&sslrootcert=/etc/ssl/rds/global-bundle.pem
            Download the RDS CA bundle into the image or a ConfigMap; Node's default CAs do not include it.
Azure       ...?sslmode=verify-full
            Azure Database for PostgreSQL uses public root CAs that Node already trusts.
```

### 18.3 Helm Chart Changes

ServiceAccount annotation (identity binding):

```yaml
# AWS IRSA
annotations:
  eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/shop-api

# Azure Workload ID (also add Pod label azure.workload.identity/use: "true" in the Deployment template)
annotations:
  azure.workload.identity/client-id: 00000000-0000-0000-0000-000000000000
```

Cloud SQL Auth Proxy: remove the native sidecar from the Deployment and migration Job, and point `DATABASE_URL` in the ExternalSecret template at the database host:

```yaml
DATABASE_URL: "postgres://shop_api:{{ "{{ .dbPassword }}" }}@shop-pg.abc123xyz.ap-southeast-1.rds.amazonaws.com:5432/shop?sslmode=verify-full&sslrootcert=/etc/ssl/rds/global-bundle.pem"
```

SecretStore provider block:

```yaml
# AWS Secrets Manager via IRSA
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-southeast-1
      auth:
        jwt:
          serviceAccountRef:
            name: shop-api

# Azure Key Vault via Workload ID
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: https://acme-shop-prod-kv.vault.azure.net
      serviceAccountRef:
        name: shop-api
```

Key Vault secret names allow only letters, numbers, and hyphens: `shop-api-db-password` works everywhere.

Metrics: replace `PodMonitoring` with the platform's scrape object, usually Prometheus Operator `ServiceMonitor`/`PodMonitor` (kube-prometheus-stack, Amazon Managed Prometheus collectors) or Azure Monitor's `PodMonitor` CRD.

NetworkPolicy: EKS needs the VPC CNI network policy feature enabled (or Calico/Cilium); AKS needs a network policy engine (Azure CNI powered by Cilium, or Calico) chosen at cluster creation. Update `metricsNamespace` to wherever collectors run.

Image repository in `values.yaml`:

```txt
AWS    123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/shop-api
Azure  acmeshopprod.azurecr.io/shop-api
```

### 18.4 ingress-nginx Service Changes

Only the controller Service (load balancer) changes; Ingress objects and annotations stay the same.

AWS (requires AWS Load Balancer Controller):

```yaml
controller:
  service:
    externalTrafficPolicy: Local
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: external
      service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
      service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
      # Optional fixed IPs: one Elastic IP allocation per public subnet/AZ.
      service.beta.kubernetes.io/aws-load-balancer-eip-allocations: eipalloc-0aaa,eipalloc-0bbb,eipalloc-0ccc
```

On AWS, `kubectl get svc` shows a hostname (`xxx.elb.ap-southeast-1.amazonaws.com`). Point DNS at it with a Route 53 alias record (or CNAME for subdomains), not an `A` record to an IP.

Azure:

```yaml
controller:
  service:
    externalTrafficPolicy: Local
    annotations:
      # Azure LB health probe must hit an HTTP path that returns 200.
      service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path: /healthz
      # Reserved public IP (created beforehand).
      service.beta.kubernetes.io/azure-load-balancer-ipv4: 20.0.0.10
      service.beta.kubernetes.io/azure-load-balancer-resource-group: rg-shop-network
```

The GKE-specific `admissionWebhooks.port: 10250` override is not needed on EKS/AKS with default security groups/NSGs; keep the default unless the webhook times out.

cert-manager: unchanged for HTTP-01. DNS-01 solvers: `route53` (AWS), `azureDNS` (Azure), `cloudflare`.

ExternalDNS: `provider.name: aws` or `azure`, with the same identity pattern (IRSA role with Route 53 permissions; Workload ID with DNS Zone Contributor).

### 18.5 CI Changes

AWS:

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v6
    with:
      role-to-assume: arn:aws:iam::123456789012:role/github-shop-api   # trust policy: token.actions.githubusercontent.com, repo:acme/shop-api:*
      aws-region: ap-southeast-1
  - uses: aws-actions/amazon-ecr-login@v2
  # build/scan/push as before, with the ECR image name
  - run: aws eks update-kubeconfig --name shop-eks --region ap-southeast-1
  # helm upgrade as before
```

EKS: map the CI role to Kubernetes permissions with an EKS access entry (`aws eks create-access-entry` + `associate-access-policy`).

Azure:

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: azure/login@v3
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}         # managed identity or app with a GitHub federated credential
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
  - run: az acr login --name acmeshopprod
  # build/scan/push as before, with the ACR image name
  - uses: azure/aks-set-context@v5
    with:
      resource-group: rg-shop-prod
      cluster-name: shop-aks
  # helm upgrade as before
```

### 18.6 Identity Setup Equivalents

Google Workload Identity (8.5) equivalents:

```bash
# AWS EKS IRSA: IAM role trusted by the cluster OIDC provider for system:serviceaccount:shop:shop-api
eksctl create iamserviceaccount --cluster shop-eks --namespace shop --name shop-api \
  --attach-policy-arn arn:aws:iam::123456789012:policy/shop-api --approve

# Azure AKS Workload ID: cluster needs --enable-oidc-issuer --enable-workload-identity
az identity create --name shop-api-id --resource-group rg-shop-prod
az identity federated-credential create --name shop-api \
  --identity-name shop-api-id --resource-group rg-shop-prod \
  --issuer "$(az aks show -n shop-aks -g rg-shop-prod --query oidcIssuerProfile.issuerUrl -o tsv)" \
  --subject system:serviceaccount:shop:shop-api \
  --audience api://AzureADTokenExchange
```

### 18.7 Self-Hosted Or Single VPS

Same chart on k3s (see `DevOps/ORACLE_VPS_BEST_USAGE.md`), with these swaps:

```txt
Load balancer   k3s ServiceLB binds 80/443 on the node; no static IP resource
Database        CloudNativePG operator (in-cluster Postgres with backups to S3-compatible storage)
Object storage  Cloudflare R2, Backblaze B2, or MinIO through the S3 adapter (set endpoint in S3Client)
Secrets         Sealed Secrets or SOPS-encrypted values; no cloud identity, so credentials are static and scoped
Metrics/logs    kube-prometheus-stack + Loki
CI deploy       kubeconfig for a namespaced ServiceAccount stored as a CI secret, or Argo CD pulling from Git
```

## 19. Beyond

Next steps once the basics run smoothly, roughly in order of value:

```txt
GitOps (Argo CD or Flux)
  Git holds desired state for every environment; the cluster pulls and self-heals drift.
  CI writes the new image tag to a config repo instead of running helm against clusters.

Gateway API (successor to Ingress)
  Role-oriented routing (Gateway owned by platform, HTTPRoute owned by app teams), traffic splitting,
  header matching. GKE Gateway controller provisions Google's global HTTP(S) load balancer with
  Google-managed certificates, Cloud Armor, and Cloud CDN. Planned replacement for retired ingress-nginx.
  Enable on GKE: gcloud container clusters update shop-gke --region=asia-southeast1 --gateway-api=standard

Progressive delivery
  Argo Rollouts or Flagger: canary 5% -> 25% -> 100% with automatic rollback on error-rate metrics.

Policy as code
  Kyverno or OPA Gatekeeper: require resource requests, block :latest tags, enforce labels, verify image signatures.

Supply chain
  cosign signatures + SLSA provenance from CI; Binary Authorization admits only signed images.

Resilience
  PgBouncer for connection pooling; Cloud SQL read replicas; Memorystore (Redis) for caching and rate limits.
  Multi-region: second cluster + global load balancer + cross-region replica; practice failover.

Background workers and queues
  Move slow or retryable work (emails, image processing, webhooks) out of the request path:
  API publishes a message -> queue -> worker Deployment consumes it (same image, different command, no Service/Ingress).
  Google: Pub/Sub (fan-out events) or Cloud Tasks (per-task rate limits, delays).
  Neutral: RabbitMQ, NATS, Redis with BullMQ, Kafka for event streams; SQS/Service Bus on AWS/Azure.
  Scale workers on queue depth with KEDA instead of CPU. Make handlers idempotent: every queue delivers at least once.

Load and chaos testing
  k6 load tests in CI against staging (find the knee of the latency curve before users do).
  Kill Pods and drain nodes in staging during load; verify zero errors.

Developer experience
  Skaffold or Tilt for inner-loop development against a dev namespace; preview environment per PR
  (namespace + ExternalDNS host pr-123.staging.example.com), deleted on merge.
```

## 20. Final Checklist

```txt
Code
[ ] Config validated at startup; logs JSON to stdout; /healthz, /readyz; SIGTERM handled; metrics on separate port
[ ] Writes require a verified OIDC token; authorization checks per route; CORS limited to known origins
[ ] Uploads/downloads via signed URLs with size limit and ownership checks
[ ] Statement timeout set; retries only for idempotent work
[ ] Scheduled jobs idempotent, bounded, non-overlapping
[ ] Tests and type checks pass in CI; chart tested on kind

Image
[ ] Multi-stage, non-root, exec-form CMD, .dockerignore correct
[ ] Tagged with git SHA; built for node architecture; scanned with no fixable HIGH/CRITICAL

Cloud
[ ] One project per environment; budget alert
[ ] Private nodes + Cloud NAT; authorized networks + DNS endpoint
[ ] Cloud SQL private IP, HA, backups, PITR, deletion protection; restore tested
[ ] Bucket private, versioned, CORS limited to your origin
[ ] Workload Identity everywhere; zero key files; least-privilege roles

Cluster
[ ] Namespace with Pod Security "restricted", ResourceQuota, LimitRange
[ ] ingress-nginx with reserved static IP; cert-manager issuers; External Secrets installed; versions pinned

App release
[ ] Deployment: 2+ replicas, probes, resources, preStop, PDB, HPA, topology spread
[ ] Migrations backward compatible; run as hook Job
[ ] NetworkPolicy; PodMonitoring

Internet
[ ] DNS A record -> static IP; TLS from Let's Encrypt production; HTTP redirects to HTTPS
[ ] curl -v through every hop (11.4) behaves as expected

Operations
[ ] CI/CD keyless; production behind approval; rollback rehearsed
[ ] Terraform owns infrastructure; state in versioned GCS bucket
[ ] Uptime check + alerts reach a human; dashboards for RED metrics
[ ] Runbook (section 17) known by everyone on call
```
