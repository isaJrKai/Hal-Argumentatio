import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/db/db';

const testContractorId = 'credential-vault-regression-test';
let saveSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  (db as any).data.connectorCredentials[testContractorId] = {};
  saveSpy = vi.spyOn(db, 'save').mockImplementation(() => undefined);
});

afterEach(() => {
  (db as any).data.connectorCredentials[testContractorId] = {};
  vi.restoreAllMocks();
});

describe('connector credential vault', () => {
  it('encrypts credentials before persisting them and decrypts only server-side reads', () => {
    const secret = 'test-secret-do-not-store-in-plaintext';
    db.saveConnectorCredential(testContractorId, 'stripe', secret);

    const storedValue = (db as any).data.connectorCredentials[testContractorId].stripe;
    expect(saveSpy).toHaveBeenCalled();
    expect(storedValue).not.toBe(secret);
    expect(storedValue).toMatch(/^[a-f0-9]{24}:[a-f0-9]+:[a-f0-9]{32}$/i);
    expect(db.getConnectorCredentials(testContractorId).stripe).toBe(secret);
  });

  it('migrates legacy plaintext credentials to encrypted storage on server-side read', () => {
    (db as any).data.connectorCredentials[testContractorId] = {
      legacyProvider: 'legacy-plaintext-secret'
    };

    const credentials = db.getConnectorCredentials(testContractorId);
    const storedValue = (db as any).data.connectorCredentials[testContractorId].legacyProvider;

    expect(credentials.legacyProvider).toBe('legacy-plaintext-secret');
    expect(saveSpy).toHaveBeenCalled();
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
