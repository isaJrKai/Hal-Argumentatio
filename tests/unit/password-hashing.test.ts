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
});
