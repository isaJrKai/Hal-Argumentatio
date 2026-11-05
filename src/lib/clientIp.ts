import { isIP } from 'node:net';

/**
 * Render public web-service traffic is routed through Cloudflare. Cloudflare
 * provides CF-Connecting-IP as a single origin-side client address. Do not use
 * X-Forwarded-For for security limits: Render appends to it, so its leftmost
 * value can be supplied by the caller.
 */
export function getClientIp(request: {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = request.headers?.['cf-connecting-ip'];
  if (typeof forwarded === 'string') {
    const candidate = forwarded.trim();
    if (isIP(candidate)) return candidate;
  }

  const expressIp = request.ip?.trim();
  if (expressIp) return expressIp;
  return request.socket?.remoteAddress?.trim() || 'unknown-ip';
}
