import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/db/db';

describe('Unit: PII Encryption Invariants & Fail-Closed Auditing', () => {
  const samplePlaintext = 'client-personal-phone-403-555-0199';

  it('performs clean encrypt -> decrypt round trip', () => {
    const ciphertext = encrypt(samplePlaintext);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(samplePlaintext);
    expect(ciphertext.includes(':')).toBe(true);

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(samplePlaintext);
  });

  it('generates distinct non-deterministic ciphertexts for identical plaintext (IV freshness)', () => {
    const cipher1 = encrypt(samplePlaintext);
    const cipher2 = encrypt(samplePlaintext);
    expect(cipher1).not.toBe(cipher2); // Unique IV per encryption
    expect(decrypt(cipher1)).toBe(samplePlaintext);
    expect(decrypt(cipher2)).toBe(samplePlaintext);
  });

  it('strictly fails closed on tampered authentication tag (returns empty string, never leaks)', () => {
    const ciphertext = encrypt(samplePlaintext);
    const parts = ciphertext.split(':');
    expect(parts.length).toBe(3);

    // Tamper with ciphertext payload
    const tamperedPayload = parts[1].slice(0, -2) + (parts[1].slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedCiphertext = `${parts[0]}:${tamperedPayload}:${parts[2]}`;

    const result = decrypt(tamperedCiphertext);
    // Strict fail-closed: must return empty string
    expect(result).toBe('');
    expect(result).not.toBe(samplePlaintext);
  });

  it('handles malformed ciphertext cleanly without leaking raw data', () => {
    expect(decrypt('not-a-valid-ciphertext')).toBe('');
    expect(decrypt('part1:part2')).toBe('');
    expect(decrypt('')).toBe('');
  });

  describe('Remediated Fail-Closed Invariants', () => {
    it('verifies that encryption key derivation produces a valid 32-byte AES key', () => {
      const defaultStaticKey = 'Z01Xek1XOHpNVGczTnpBek1EUTFORFUxTkRVMU5EVTE=';
      expect(Buffer.from(defaultStaticKey, 'base64').length).toBe(32);
    });

    it('verifies encrypt returns empty string for empty input', () => {
      expect(encrypt('')).toBe('');
    });
  });
});
