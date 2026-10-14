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
