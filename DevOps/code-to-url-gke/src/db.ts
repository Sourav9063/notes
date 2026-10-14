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
