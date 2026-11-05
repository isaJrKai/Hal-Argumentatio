import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import {
  appendStructuredLedgerEntry,
  getStructuredLedgerEntries,
  verifyStructuredLedgerIntegrity,
} from '../../src/db/structuredLedger';

const databaseUrl = process.env.HAL_LEDGER_TEST_DATABASE_URL;
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

  it('detects tampering with the exact serialized payload', async () => {
    await appendStructuredLedgerEntry({
      contractorId: 'tenant-tamper',
      eventType: 'security_event',
      entityType: 'test',
      entityId: 'tamper-me',
      actor: 'tamper-test',
      details: 'original',
      metadata: { immutable: true },
    }, writerA);

    await writerA.query(
      'UPDATE structured_ledger_entries SET payload_json = $1 WHERE contractor_id = $2',
      [JSON.stringify({ contractorId: 'tenant-tamper', eventType: 'security_event' }), 'tenant-tamper'],
    ).catch((error) => {
      // Production bootstrap installs an append-only trigger. A trigger rejection
      // is itself proof that ordinary UPDATE is blocked; integrity is checked
      // below only when the isolated test schema intentionally has no trigger.
      if (error?.code !== '55000') throw error;
    });

    const integrity = await verifyStructuredLedgerIntegrity(undefined, writerB);
    if (integrity.valid) {
      // This test schema intentionally omits the production immutability trigger;
      // the verifier must catch changed payload bytes even if an operator bypasses it.
      expect(integrity.valid).toBe(false);
      expect(integrity.auditMessage).toContain('Payload hash mismatch');
    } else {
      expect(integrity.auditMessage).toMatch(/Payload hash mismatch|Hash chain break|Entry hash mismatch/);
    }
  }, 20000);
});
