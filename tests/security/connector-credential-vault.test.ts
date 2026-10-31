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
});
