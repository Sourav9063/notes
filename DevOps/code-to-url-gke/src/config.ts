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
