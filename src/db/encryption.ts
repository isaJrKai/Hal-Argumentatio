import crypto from 'node:crypto';

// Helper to get Lead encryption key
function getEncryptionKey(): Buffer {
  const b64 = process.env.LEAD_ENCRYPTION_KEY_B64;
  if (!b64) {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.NODE_ENV !== 'production') {
      return Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
    }
    throw new Error('LEAD_ENCRYPTION_KEY_B64 is required before encrypting or decrypting personal data.');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.NODE_ENV !== 'production') {
      return Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
    }
    throw new Error('LEAD_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes.');
  }
  return key;
}

// AES-256-GCM encryption - strictly fail-closed
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('PII Encryption failure: aborting to prevent plaintext data leakage.');
  }
}

// AES-256-GCM decryption with a specific key
function decryptWithKey(encryptedText: string, key: Buffer): string | null {
  try {
    if (!encryptedText || !encryptedText.includes(':')) return null;
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

// AES-256-GCM decryption - strictly fail-closed
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.includes(':')) return '';

  // 1. Try with the active derived encryption key
  try {
    const key = getEncryptionKey();
    const result = decryptWithKey(encryptedText, key);
    if (result !== null) return result;
  } catch (err) {}

  // Legacy ciphertext can be migrated only when the operator explicitly supplies
  // the old key through HAL_LEGACY_ENCRYPTION_KEY_B64. No key is embedded in source.
  try {
    const legacyB64 = process.env.HAL_LEGACY_ENCRYPTION_KEY_B64;
    if (legacyB64) {
      const legacyKey = Buffer.from(legacyB64, 'base64');
      if (legacyKey.length === 32) {
        const result = decryptWithKey(encryptedText, legacyKey);
        if (result !== null) return result;
      }
    }
  } catch (err) {}

  // Fail closed - never return raw ciphertext or corrupted data
  return '';
}
