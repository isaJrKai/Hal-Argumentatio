/**
 * Resolve the client address using Express's already-trusted request metadata.
 *
 * Express req.ip uses the socket peer unless the application explicitly enables
 * trust proxy. Do not fall back to X-Forwarded-For: clients can forge that header
 * unless a known proxy is configured and Express is told exactly which proxies
 * to trust.
 */
export function getClientIp(request: {
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const expressIp = request.ip?.trim();
  if (expressIp) return expressIp;

  const socketIp = request.socket?.remoteAddress?.trim();
  return socketIp || 'unknown-ip';
}
