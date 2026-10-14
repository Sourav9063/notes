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
