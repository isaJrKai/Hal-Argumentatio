import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../../src/db/db';

describe('Password hashing', () => {
  it('uses a salted bcrypt hash for newly stored passwords', () => {
    const password = 'a-long-test-password-42';
    const stored = hashPassword(password);
    expect(stored).toMatch(/^\$2[aby]\$/);
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('verifies legacy PBKDF2 hashes so successful logins can migrate them', () => {
    const password = 'legacy-test-password';
    const legacyHash = crypto.pbkdf2Sync(password, 'salt-for-halbiz', 1000, 64, 'sha512').toString('hex');
    expect(verifyPassword(password, legacyHash)).toBe(true);
    expect(verifyPassword('incorrect', legacyHash)).toBe(false);
  });

  describe('Password Reset Engine', () => {
    it('creates single-use hashed reset tokens and consumes them safely', async () => {
      const { db } = await import('../../src/db/db');
      const testEmail = 'reset-test@example.com';
      const rawToken = 'test-token-' + crypto.randomBytes(16).toString('hex');

      const record = db.createPasswordReset(testEmail, rawToken, 3600 * 1000);
      expect(record.email).toBe(testEmail);
      expect(record.used).toBe(false);

      // Verify and consume the token
      const result = db.verifyAndConsumePasswordReset(rawToken);
      expect(result.valid).toBe(true);
      expect(result.email).toBe(testEmail);

      // Second attempt to use the same token must fail (single-use guarantee)
      const secondAttempt = db.verifyAndConsumePasswordReset(rawToken);
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.error).toContain('already used');
    });

    it('rejects expired password reset tokens', async () => {
      const { db } = await import('../../src/db/db');
      const testEmail = 'expired-test@example.com';
      const rawToken = 'expired-token-' + crypto.randomBytes(16).toString('hex');

      // Create token with -1000 ms TTL (already expired)
      db.createPasswordReset(testEmail, rawToken, -1000);

      const result = db.verifyAndConsumePasswordReset(rawToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });
});
