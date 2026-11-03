/**
 * Google OAuth access tokens are short-lived. HAL deliberately expires the
 * cached token before Google's usual one-hour lifetime so expired credentials
 * are never reported as a connected Workspace session.
 */
export const GOOGLE_WORKSPACE_TOKEN_TTL_MS = 50 * 60 * 1000;

export function getGoogleWorkspaceTokenExpiry(issuedAt = Date.now()): number {
  return issuedAt + GOOGLE_WORKSPACE_TOKEN_TTL_MS;
}

export function isGoogleWorkspaceAccessTokenFresh(expiresAt: unknown, now = Date.now()): boolean {
  const expiry = typeof expiresAt === 'number' ? expiresAt : Number(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}
