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
