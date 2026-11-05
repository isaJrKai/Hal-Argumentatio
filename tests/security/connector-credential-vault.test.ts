import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  getConnectorCredentials,
  importConnectorCredentialIfAbsent,
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

  it('imports a legacy credential only when no newer PostgreSQL value exists', async () => {
    const contractorId = newTenant();

    await expect(importConnectorCredentialIfAbsent(contractorId, 'stripe', 'legacy-secret', pool))
      .resolves.toBe(true);
    await expect(importConnectorCredentialIfAbsent(contractorId, 'stripe', 'stale-legacy-secret', pool))
      .resolves.toBe(false);
    await expect(getConnectorCredentials(contractorId, pool))
      .resolves.toEqual({ stripe: 'legacy-secret' });

    await saveConnectorCredential(contractorId, 'stripe', 'new-postgres-secret', pool);
    await expect(importConnectorCredentialIfAbsent(contractorId, 'stripe', 'older-json-secret', pool))
      .resolves.toBe(false);
    await expect(getConnectorCredentials(contractorId, pool))
      .resolves.toEqual({ stripe: 'new-postgres-secret' });
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

  it('survives a fresh database pool after the original writer is gone', async () => {
    const contractorId = newTenant();
    await saveConnectorCredential(contractorId, 'stripe', 'durable-secret', pool);

    const freshPool = new Pool({ connectionString: databaseUrl });
    try {
      await expect(getConnectorCredentials(contractorId, freshPool))
        .resolves.toEqual({ stripe: 'durable-secret' });
    } finally {
      await freshPool.end();
    }
  });

  it('does not report a successful write when PostgreSQL is unavailable', async () => {
    const contractorId = newTenant();
    const unavailablePool = new Pool({
      host: '127.0.0.1',
      port: 1,
      user: 'invalid',
      password: 'invalid',
      database: 'invalid',
      connectionTimeoutMillis: 150,
      max: 1,
    });

    try {
      await expect(saveConnectorCredential(contractorId, 'stripe', 'must-not-persist', unavailablePool))
        .rejects.toThrow();
    } finally {
      await unavailablePool.end();
    }

    const rows = await pool.query(
      'SELECT id FROM connector_credentials WHERE contractor_id = $1 AND service = $2',
      [contractorId, 'stripe']
    );
    expect(rows.rows).toHaveLength(0);
  });

});
