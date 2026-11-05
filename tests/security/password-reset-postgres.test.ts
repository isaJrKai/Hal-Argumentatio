import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync('server.ts', 'utf8');

function routeBetween(startMarker: string, endMarker: string): string {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate route markers: ${startMarker}`);
  return serverSource.slice(start, end);
}

describe('PostgreSQL password reset persistence', () => {
  const forgotRoute = routeBetween(
    "app.post('/api/auth/forgot-password'",
    "app.post('/api/auth/reset-password'"
  );
  const resetRoute = routeBetween(
    "app.post('/api/auth/reset-password'",
    "// ─── PERSISTED TENANT NOTIFICATIONS"
  );

  it('stores only hashed reset tokens in PostgreSQL and invalidates previous links atomically', () => {
    expect(forgotRoute).toContain('crypto.createHash(\'sha256\')');
    expect(forgotRoute).toContain('pgDb.transaction');
    expect(forgotRoute).toContain('FOR UPDATE');
    expect(forgotRoute).toContain('tx.insert(passwordResetTokens)');
    expect(forgotRoute).not.toContain('db.createPasswordReset');
  });

  it('sends reset links only through the shared Resend adapter and trusted APP_URL origin', () => {
    expect(forgotRoute).toContain('new URL(process.env.APP_URL || \'\')');
    expect(forgotRoute).toContain('sendResendEmail({');
    expect(forgotRoute).toContain('apiKey: resendApiKey');
    expect(forgotRoute).not.toContain('req.headers.origin');
    expect(forgotRoute).not.toContain('x-forwarded-host');
    expect(forgotRoute).not.toContain('getConnectorCredentials');
    expect(forgotRoute).toContain('.set({ usedAt: new Date() })');
  });

  it('consumes the reset token and updates the PostgreSQL password in one transaction', () => {
    expect(resetRoute).toContain('pgDb.transaction');
    expect(resetRoute).toContain('eq(passwordResetTokens.tokenHash, tokenHash)');
    expect(resetRoute).toContain('isNull(passwordResetTokens.usedAt)');
    expect(resetRoute).toContain('gt(passwordResetTokens.expiresAt');
    expect(resetRoute).toContain('tx.update(contractors)');
    expect(resetRoute).not.toContain('db.verifyAndConsumePasswordReset');
    expect(resetRoute).not.toContain('db.restorePasswordReset');
  });
});
