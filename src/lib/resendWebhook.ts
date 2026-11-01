import crypto from 'crypto';

export interface SvixWebhookHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

/**
 * Verify Svix-compatible webhook signatures (used by Resend).
 * The caller must pass the exact raw request body bytes.
 */
export function verifySvixWebhookSignature(
  rawBody: Buffer,
  headers: SvixWebhookHeaders,
  secret: string,
  nowMs: number = Date.now(),
  toleranceSeconds: number = 300
): boolean {
  if (!secret.startsWith('whsec_') || !headers.id || !headers.timestamp || !headers.signature) return false;
  const timestampSeconds = Number(headers.timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(nowMs / 1000 - timestampSeconds) > toleranceSeconds) return false;

  try {
    const secretBytes = Buffer.from(secret.slice('whsec_'.length), 'base64');
    if (!secretBytes.length) return false;
    const signedContent = headers.id + '.' + headers.timestamp + '.' + rawBody.toString('utf8');
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    return headers.signature.split(' ').some(part => {
      if (!part.startsWith('v1,')) return false;
      const supplied = Buffer.from(part.slice(3));
      const expectedBytes = Buffer.from(expected);
      return supplied.length === expectedBytes.length && crypto.timingSafeEqual(supplied, expectedBytes);
    });
  } catch {
    return false;
  }
}
