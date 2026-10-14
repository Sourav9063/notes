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
