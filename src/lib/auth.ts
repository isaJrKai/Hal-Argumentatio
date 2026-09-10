import crypto from 'crypto';

export interface DecodedToken {
  contractorId: string;
  email: string;
  role: 'admin' | 'user';
  exp: number;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is required in production.');
    }
    return 'halbiz-ultra-secure-sign-key';
  }
  return secret;
}

/**
 * Signs an HMAC-SHA256 JWT with 24-hour expiration.
 */
export function signToken(
  payload: { contractorId: string; email: string; role: 'admin' | 'user' },
  secretOverride?: string,
  expiresInSeconds: number = 24 * 3600
): string {
  const secret = secretOverride || getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signatureInput = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');
  
  return `${signatureInput}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 JWT.
 * STRICT FAIL-CLOSED:
 * - Requires exact 3-part header.payload.signature structure
 * - Constant-time signature verification via crypto.timingSafeEqual
 * - Enforces exp expiration check
 * - Requires non-empty contractorId and role
 * - NEVER falls back to default contractor, default user, or admin
 * - Returns null on ANY failure or invalid input
 */
export function verifyToken(token: string, secretOverride?: string): DecodedToken | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, body, signature] = parts;
    if (!header || !body || !signature) {
      return null;
    }

    const secret = secretOverride || getJwtSecret();
    const signatureInput = `${header}.${body}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as DecodedToken;
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    if (!decoded.contractorId || typeof decoded.contractorId !== 'string' || decoded.contractorId.trim() === '') {
      return null;
    }

    if (decoded.role !== 'admin' && decoded.role !== 'user') {
      return null;
    }

    // Mandatory numeric expiration check
    if (typeof decoded.exp !== 'number' || Number.isNaN(decoded.exp) || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (err) {
    // Fail-closed on any parse error, buffer mismatch, or exception
    return null;
  }
}
