import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../../src/db/db';

const testContractorId = 'credential-vault-regression-test';

afterEach(() => {
  db.saveConnectorCredential(testContractorId, 'stripe', '');
});

describe('connector credential vault', () => {
  it('encrypts credentials before persisting them and decrypts only server-side reads', () => {
    const secret = 'test-secret-do-not-store-in-plaintext';
    db.saveConnectorCredential(testContractorId, 'stripe', secret);

    const persisted = JSON.parse(readFileSync(join(process.cwd(), 'data', 'db.json'), 'utf8'));
    const storedValue = persisted.connectorCredentials[testContractorId].stripe;

    expect(storedValue).not.toBe(secret);
    expect(storedValue).toMatch(/^[a-f0-9]{24}:[a-f0-9]+:[a-f0-9]{32}$/i);
    expect(db.getConnectorCredentials(testContractorId).stripe).toBe(secret);
  });

  it('migrates legacy plaintext credentials to encrypted storage on server-side read', () => {
    (db as any).data.connectorCredentials[testContractorId] = {
      legacyProvider: 'legacy-plaintext-secret'
    };

    const credentials = db.getConnectorCredentials(testContractorId);
    const persisted = JSON.parse(readFileSync(join(process.cwd(), 'data', 'db.json'), 'utf8'));
    const storedValue = persisted.connectorCredentials[testContractorId].legacyProvider;

    expect(credentials.legacyProvider).toBe('legacy-plaintext-secret');
    expect(storedValue).not.toBe('legacy-plaintext-secret');
    expect(storedValue).toMatch(/^[a-f0-9]{24}:[a-f0-9]+:[a-f0-9]{32}$/i);
  });

  it('fails closed when stored ciphertext cannot be decrypted', () => {
    (db as any).data.connectorCredentials[testContractorId] = {
      stripe: `${'a'.repeat(24)}:${'b'.repeat(64)}:${'c'.repeat(32)}`
    };

    const credentials = db.getConnectorCredentials(testContractorId);
    expect(credentials.stripe).toBeUndefined();
  });
});
