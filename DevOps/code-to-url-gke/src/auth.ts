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
