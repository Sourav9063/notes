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
