import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../src/lib/auth';

describe('JWT session lifetime', () => {
  it('uses a 24-hour expiration by default', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signToken(
      { contractorId: 'tenant-test', email: 'operator@example.test', role: 'admin' },
      'test-secret-with-at-least-32-characters'
    );
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    expect(payload.exp - before).toBeGreaterThanOrEqual(24 * 60 * 60 - 1);
    expect(payload.exp - before).toBeLessThanOrEqual(24 * 60 * 60 + 1);
    expect(verifyToken(token, 'test-secret-with-at-least-32-characters')?.contractorId).toBe('tenant-test');
  });

  it('continues to honour an explicit shorter expiration', () => {
    const token = signToken(
      { contractorId: 'tenant-test', email: 'operator@example.test', role: 'user' },
      'test-secret-with-at-least-32-characters',
      60
    );
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    expect(payload.exp - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(60);
  });
});
