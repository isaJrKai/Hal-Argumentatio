import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Security primitives for HAL backend.
// Centralizes JWT signing/verification, password hashing and timing-safe
// comparisons so every route uses the same hardened implementations.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_TTL_SECONDS = 24 * 3600;

export interface TokenPayload {
  contractorId: string;
  email: string;
  role: 'admin' | 'user';
  exp: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    // Fail LOUD in production: a default secret would allow token forgery.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET environment variable must be set to a strong random value (>= 16 chars) in production.'
      );
    }
    console.warn(
      '[SECURITY WARNING] JWT_SECRET is not set. Using an ephemeral development secret. ' +
        'Set JWT_SECRET in your environment before deploying.'
    );
    // Ephemeral per-process secret in dev so tokens cannot be forged across restarts.
    return crypto.randomBytes(32).toString('hex');
  }
  return secret;
}

export function signToken(payload: { contractorId: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body = Buffer.from(
    JSON.stringify({
      contractorId: payload.contractorId,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
      exp,
    })
  ).toString('base64url');

  const signatureInput = `${header}.${body}`;
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Verify a JWT. Returns null on ANY failure (bad format, bad signature,
 * expired). NEVER returns a fallback identity — callers must treat null as
 * unauthenticated.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${body}`)
      .digest('base64url');

    // Constant-time signature comparison to prevent timing attacks.
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<TokenPayload>;
    if (!decoded || typeof decoded !== 'object') return null;
    if (!decoded.contractorId || !decoded.email) return null;

    // Enforce expiry.
    if (typeof decoded.exp !== 'number' || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      contractorId: String(decoded.contractorId),
      email: String(decoded.email),
      role: decoded.role === 'admin' ? 'admin' : 'user',
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

// ── Password hashing ─────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a password with a per-password random salt.
 * Format: pbkdf2$<iterations>$<saltHex>$<hashHex>
 */
export function hashPasswordSecure(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

/**
 * Verify a password against a stored hash. Supports both the new salted
 * format and the legacy unsalted format (`hashPassword` in db.ts) so existing
 * accounts keep working. Returns false instead of throwing on bad input.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash) return false;

    if (storedHash.startsWith('pbkdf2$')) {
      const [, iterStr, salt, hash] = storedHash.split('$');
      const iterations = parseInt(iterStr, 10);
      if (!iterations || !salt || !hash) return false;
      const candidate = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
      const expected = Buffer.from(hash, 'hex');
      return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
    }

    // Legacy format: pbkdf2Sync(password, 'salt-for-halbiz', 1000, 64, 'sha512')
    const legacy = crypto.pbkdf2Sync(password, 'salt-for-halbiz', 1000, 64, 'sha512').toString('hex');
    const legacyBuf = Buffer.from(legacy);
    const storedBuf = Buffer.from(storedHash);
    return legacyBuf.length === storedBuf.length && crypto.timingSafeEqual(legacyBuf, storedBuf);
  } catch {
    return false;
  }
}

/** True when a stored hash uses the legacy unsalted scheme and should be upgraded. */
export function needsPasswordRehash(storedHash: string): boolean {
  return !!storedHash && !storedHash.startsWith('pbkdf2$');
}

// ── Misc helpers ─────────────────────────────────────────────────────────────

/** Timing-safe string comparison for webhook secrets / tokens. */
export function safeSecretEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare against itself to keep timing roughly constant.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Extract a bearer token from an Authorization header, or null. */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}
