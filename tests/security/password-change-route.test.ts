import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync('server.ts', 'utf8');

describe('Authenticated password change route', () => {
  const start = serverSource.indexOf("app.post('/api/auth/change-password'");
  const end = serverSource.indexOf("app.post('/api/auth/register'", start);
  const route = serverSource.slice(start, end);

  it('requires an authenticated account and verifies the current password', () => {
    expect(route).toContain('authenticate');
    expect(route).toContain('verifyPassword(currentPassword');
    expect(route).toContain('checkRateLimit(req, res, account.email)');
    expect(route).toContain('recordAuthFailure(req, account.email)');
    expect(route).toContain('hashPassword(newPassword)');
  });

  it('enforces password length and updates only the matching account hash', () => {
    expect(route).toContain('newPassword.length < 12');
    expect(route).toContain('eq(contractors.id, contractorId)');
    expect(route).toContain('eq(contractors.passwordHash, account.passwordHash)');
    expect(route).toContain('PASSWORD_CHANGED');
  });

  it('does not claim that other sessions were revoked', () => {
    expect(route).toContain('other devices may remain signed in');
    expect(route).not.toContain('invalidates all active sessions');
  });
});
