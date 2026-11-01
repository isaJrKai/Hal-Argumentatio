import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildPasswordResetResponse } from '../../src/lib/passwordResetResponse';

describe('password reset response security', () => {
  it('returns a generic response without reset credentials or account state', () => {
    const response = buildPasswordResetResponse();
    expect(response).toEqual({
      success: true,
      message: 'If an account exists with this email address, password reset instructions will be sent.'
    });
    expect(JSON.stringify(response)).not.toMatch(/resetUrl|debugToken|rawToken|emailDispatched|emailProviderConfigured/i);
  });

  it('does not expose a raw reset token or URL from the HTTP route', () => {
    const source = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const start = source.indexOf("app.post('/api/auth/forgot-password'");
    const end = source.indexOf("app.post('/api/auth/reset-password'", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const route = source.slice(start, end);
    expect(route).toContain('buildPasswordResetResponse()');
    expect(route).not.toMatch(/debugToken|resetUrl|rawToken|emailDispatched|emailProviderConfigured/);
  });
});
