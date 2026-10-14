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
