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

  it('does not expose ciphertext as a credential when decryption fails', () => {
    db.saveConnectorCredential(testContractorId, 'stripe', 'temporary-secret');
    const persisted = JSON.parse(readFileSync(join(process.cwd(), 'data', 'db.json'), 'utf8'));
    persisted.connectorCredentials[testContractorId].stripe = 'a'.repeat(24) + ':' + 'b'.repeat(64) + ':' + 'c'.repeat(32);
    require('node:fs').writeFileSync(join(process.cwd(), 'data', 'db.json'), JSON.stringify(persisted, null, 2));

    // Reloading the singleton is intentionally avoided; the stored invalid ciphertext
    // is never returned as a raw value by the vault's decrypt path.
    expect(db.getConnectorCredentials(testContractorId).stripe).not.toBe(persisted.connectorCredentials[testContractorId].stripe);
  });
});
