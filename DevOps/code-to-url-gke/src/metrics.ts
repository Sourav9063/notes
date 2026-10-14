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
