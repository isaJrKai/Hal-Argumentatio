import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  appendStructuredLedgerEntry,
  appendStructuredLedgerEntryInTransaction,
  getStructuredLedgerEntries,
  verifyStructuredLedgerIntegrity,
  importLegacyStructuredLedgerEntries,
} from '../../src/db/structuredLedger';

const databaseUrl = process.env.HAL_LEDGER_TEST_DATABASE_URL || (process.env.CI === 'true' ? process.env.DATABASE_URL : undefined);
const suite = databaseUrl ? describe : describe.skip;

suite('PostgreSQL global structured ledger', () => {
  const schema = `ledger_test_${randomUUID().replace(/-/g, '')}`;
  let adminPool: Pool;
  let writerA: Pool;
  let writerB: Pool;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    const options = `-c search_path=${schema}`;
    writerA = new Pool({ connectionString: databaseUrl, options, max: 2 });
    writerB = new Pool({ connectionString: databaseUrl, options, max: 2 });
    await writerA.query(`
      CREATE TABLE structured_ledger_entries (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        sequence_number BIGINT NOT NULL UNIQUE CHECK (sequence_number > 0),
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        prev_hash TEXT NOT NULL,
        entry_hash TEXT NOT NULL UNIQUE,
        details TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
    await writerA.query(`
      CREATE FUNCTION prevent_structured_ledger_mutation() RETURNS trigger AS $ledger$
      BEGIN
        RAISE EXCEPTION 'structured_ledger_entries is append-only' USING ERRCODE = '55000';
        RETURN OLD;
      END;
      $ledger$ LANGUAGE plpgsql;
      CREATE TRIGGER structured_ledger_no_mutation
        BEFORE UPDATE OR DELETE ON structured_ledger_entries
        FOR EACH ROW EXECUTE FUNCTION prevent_structured_ledger_mutation();
      CREATE TRIGGER structured_ledger_no_truncate
        BEFORE TRUNCATE ON structured_ledger_entries
        FOR EACH STATEMENT EXECUTE FUNCTION prevent_structured_ledger_mutation();
    `);
  }, 20000);

  afterAll(async () => {
    await Promise.all([writerA?.end(), writerB?.end()]);
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await adminPool.end();
    }
  }, 20000);

  it('serializes concurrent writes from independent pools into one global chain', async () => {
    await appendStructuredLedgerEntry({
      contractorId: 'system_genesis',
      eventType: 'genesis_block',
      entityType: 'system',
      entityId: 'genesis',
      actor: 'test',
    }, writerA);

    const writes = Array.from({ length: 24 }, (_, index) =>
      appendStructuredLedgerEntry({
        contractorId: index % 2 === 0 ? 'tenant-a' : 'tenant-b',
        eventType: 'security_event',
        entityType: 'test',
        entityId: `event-${index}`,
        actor: 'concurrency-test',
        details: `concurrent event ${index}`,
        metadata: { index, nested: { source: 'integration-test' } },
      }, index % 2 === 0 ? writerA : writerB),
    );
    const entries = await Promise.all(writes);
    expect(new Set(entries.map(entry => entry.sequenceNumber)).size).toBe(24);
    expect(entries.map(entry => entry.sequenceNumber).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 24 }, (_, index) => index + 2));

    const integrity = await verifyStructuredLedgerIntegrity('tenant-a', writerB);
    expect(integrity.valid).toBe(true);
    expect(integrity.totalEntries).toBe(25);

    const tenantA = await getStructuredLedgerEntries('tenant-a', 100, writerA);
    expect(tenantA.every(entry => entry.contractorId === 'tenant-a' || entry.contractorId === 'system_genesis')).toBe(true);
    expect(tenantA).toHaveLength(13);
  }, 30000);

  it('rolls back the ledger append when the surrounding business transaction fails', async () => {
    const transactionDb = drizzle(writerA);
    const before = await getStructuredLedgerEntries(undefined, 100, writerA);
    await expect(transactionDb.transaction(async tx => {
      await appendStructuredLedgerEntryInTransaction(tx as any, {
        contractorId: 'tenant-atomic-rollback',
        eventType: 'security_event',
        entityType: 'test',
        entityId: 'must-rollback',
        actor: 'transaction-test',
      });
      throw new Error('simulate business transaction failure');
    })).rejects.toThrow('simulate business transaction failure');

    const afterRollback = await getStructuredLedgerEntries(undefined, 100, writerB);
    expect(afterRollback).toHaveLength(before.length);
    expect(afterRollback.some(entry => entry.entityId === 'must-rollback')).toBe(false);

    await transactionDb.transaction(async tx => {
      await appendStructuredLedgerEntryInTransaction(tx as any, {
        contractorId: 'tenant-atomic-commit',
        eventType: 'security_event',
        entityType: 'test',
        entityId: 'committed-with-business-write',
        actor: 'transaction-test',
      });
    });
    const afterCommit = await getStructuredLedgerEntries(undefined, 100, writerB);
    expect(afterCommit.some(entry => entry.entityId === 'committed-with-business-write')).toBe(true);
    expect((await verifyStructuredLedgerIntegrity(undefined, writerB)).valid).toBe(true);
  }, 20000);

  it('reconciles an already-imported legacy prefix idempotently', async () => {
    const source = (await getStructuredLedgerEntries(undefined, 100, writerA)).reverse();
    const reconciliation = await importLegacyStructuredLedgerEntries(source, writerB);
    expect(reconciliation.imported).toBe(0);
    expect(reconciliation.alreadyPresent).toBe(source.length);
    expect(reconciliation.total).toBe(source.length);
  });

  it('refuses a valid but divergent legacy history without changing PostgreSQL rows', async () => {
    const source = (await getStructuredLedgerEntries(undefined, 100, writerA)).reverse();
    const divergent = structuredClone(source);
    divergent[0] = { ...divergent[0], id: `${divergent[0].id}_different_source` };

    await expect(importLegacyStructuredLedgerEntries(divergent, writerB))
      .rejects.toThrow(/diverges from the verified legacy chain/);

    const integrity = await verifyStructuredLedgerIntegrity(undefined, writerA);
    expect(integrity.valid).toBe(true);
    expect(integrity.totalEntries).toBe(source.length);
  });

  it('blocks destructive truncate operations', async () => {
    await expect(writerA.query('TRUNCATE TABLE structured_ledger_entries'))
      .rejects.toMatchObject({ code: '55000' });
    const integrity = await verifyStructuredLedgerIntegrity(undefined, writerB);
    expect(integrity.valid).toBe(true);
  });

  it('detects tampering with the exact serialized payload', async () => {
    const tamperedEntry = await appendStructuredLedgerEntry({
      contractorId: 'tenant-tamper',
      eventType: 'security_event',
      entityType: 'test',
      entityId: 'tamper-me',
      actor: 'tamper-test',
      details: 'original',
      metadata: { immutable: true },
    }, writerA);

    const changedPayload = JSON.stringify({ contractorId: 'tenant-tamper', eventType: 'security_event' });
    await expect(writerA.query(
      'UPDATE structured_ledger_entries SET payload_json = $1 WHERE contractor_id = $2',
      [changedPayload, 'tenant-tamper'],
    )).rejects.toMatchObject({ code: '55000' });

    // Simulate a privileged operator bypassing the append-only trigger. The
    // cryptographic verifier must still identify the modified payload.
    await writerA.query('ALTER TABLE structured_ledger_entries DISABLE TRIGGER structured_ledger_no_mutation');
    await writerA.query(
      'UPDATE structured_ledger_entries SET payload_json = $1 WHERE contractor_id = $2',
      [changedPayload, 'tenant-tamper'],
    );
    await writerA.query('ALTER TABLE structured_ledger_entries ENABLE TRIGGER structured_ledger_no_mutation');

    const integrity = await verifyStructuredLedgerIntegrity(undefined, writerB);
    expect(integrity.valid).toBe(false);
    expect(integrity.brokenAtSequence).toBe(tamperedEntry.sequenceNumber);
    expect(integrity.auditMessage).toContain('Payload hash mismatch');
  }, 20000);
});
