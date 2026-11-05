import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  getConnectorCredentials,
  saveConnectorCredential,
} from '../../src/db/connectorCredentials';

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const contractorIds: string[] = [];
let pool: Pool;

suite('Neon connector credential vault', () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS connector_credentials (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        service TEXT NOT NULL,
        encrypted_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await pool.query(
      'CREATE INDEX IF NOT EXISTS connector_credentials_tenant_idx ON connector_credentials (contractor_id, service)'
    );
  });

  afterEach(async () => {
    if (contractorIds.length) {
      await pool.query('DELETE FROM connector_credentials WHERE contractor_id = ANY($1::text[])', [contractorIds]);
      contractorIds.length = 0;
    }
  });

  afterAll(async () => {
    await pool?.end();
  });

  function newTenant(): string {
    const id = `credential-vault-test-${randomUUID()}`;
    contractorIds.push(id);
    return id;
  }

  it('encrypts at rest and decrypts only for the owning tenant', async () => {
    const contractorId = newTenant();
    const otherContractorId = newTenant();
    const secret = 'test-secret-do-not-store-in-plaintext';

    await saveConnectorCredential(contractorId, 'stripe', secret, pool);

    const persisted = await pool.query(
      'SELECT encrypted_value FROM connector_credentials WHERE contractor_id = $1 AND service = $2',
      [contractorId, 'stripe']
    );
    expect(persisted.rows).toHaveLength(1);
    expect(persisted.rows[0].encrypted_value).not.toBe(secret);
    expect(persisted.rows[0].encrypted_value).toMatch(/^[a-f0-9]{24}:[a-f0-9]+:[a-f0-9]{32}$/i);

    await expect(getConnectorCredentials(contractorId, pool)).resolves.toEqual({ stripe: secret });
    await expect(getConnectorCredentials(otherContractorId, pool)).resolves.toEqual({});
  });

  it('updates an existing tenant/service record without creating duplicates', async () => {
    const contractorId = newTenant();
    await saveConnectorCredential(contractorId, 'stripe', 'first-secret', pool);
    await saveConnectorCredential(contractorId, 'stripe', 'rotated-secret', pool);

    const rows = await pool.query(
      'SELECT id FROM connector_credentials WHERE contractor_id = $1 AND service = $2',
      [contractorId, 'stripe']
    );
    expect(rows.rows).toHaveLength(1);
    await expect(getConnectorCredentials(contractorId, pool)).resolves.toEqual({ stripe: 'rotated-secret' });
  });

  it('deletes a credential when an empty value is saved', async () => {
    const contractorId = newTenant();
    await saveConnectorCredential(contractorId, 'stripe', 'temporary-secret', pool);
    await saveConnectorCredential(contractorId, 'stripe', '', pool);
    await expect(getConnectorCredentials(contractorId, pool)).resolves.toEqual({});
  });

  it('fails closed on corrupt ciphertext', async () => {
    const contractorId = newTenant();
    await pool.query(
      'INSERT INTO connector_credentials (id, contractor_id, service, encrypted_value) VALUES ($1, $2, $3, $4)',
      [randomUUID(), contractorId, 'stripe', 'not-valid-ciphertext']
    );
    await expect(getConnectorCredentials(contractorId, pool)).resolves.toEqual({});
  });

  it('refuses to overwrite ambiguous duplicate legacy rows', async () => {
    const contractorId = newTenant();
    await pool.query(
      'INSERT INTO connector_credentials (id, contractor_id, service, encrypted_value) VALUES ($1, $2, $3, $4), ($5, $2, $3, $6)',
      [randomUUID(), contractorId, 'stripe', 'ciphertext-one', randomUUID(), 'ciphertext-two']
    );

    await expect(saveConnectorCredential(contractorId, 'stripe', 'replacement-secret', pool))
      .rejects.toThrow(/Duplicate connector credential records/);
  });
  it('refuses to return an ambiguous duplicate credential set', async () => {
    const contractorId = newTenant();
    await pool.query(
      'INSERT INTO connector_credentials (id, contractor_id, service, encrypted_value) VALUES ($1, $2, $3, $4), ($5, $2, $3, $6)',
      [randomUUID(), contractorId, 'stripe', 'ciphertext-one', randomUUID(), 'ciphertext-two']
    );

    await expect(getConnectorCredentials(contractorId, pool))
      .rejects.toThrow(/Duplicate connector credential records/);
  });

});
