import crypto from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { getPostgresPool } from './postgres';
import type { StructuredLedgerEntry } from './db';

const ZERO_HASH = '0'.repeat(64);
// A fixed, application-wide advisory-lock key. Every HAL instance must use the
// same pair so sequence allocation is serialized across processes and tenants.
const LEDGER_LOCK_CLASS = 1212501076;
const LEDGER_LOCK_ID = 1;

type LedgerInput = {
  contractorId: string;
  eventType: StructuredLedgerEntry['eventType'];
  entityType: string;
  entityId: string;
  actor: string;
  details?: string;
  metadata?: Record<string, any>;
};

type LedgerRow = {
  id: string;
  contractor_id: string;
  sequence_number: string | number;
  event_type: StructuredLedgerEntry['eventType'];
  entity_type: string;
  entity_id: string;
  actor: string;
  payload_json: string;
  payload_hash: string;
  prev_hash: string;
  entry_hash: string;
  details: string | null;
  metadata: Record<string, any> | null;
  created_at: Date | string;
};

function getPool(override?: Pool): Pool {
  const pool = override || getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL is not configured; structured ledger entry was not persisted.');
  }
  return pool;
}

function asEntry(row: LedgerRow): StructuredLedgerEntry {
  const sequenceNumber = Number(row.sequence_number);
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error('Structured ledger contains a sequence number outside JavaScript safe integer range.');
  }
  const createdAt = row.created_at instanceof Date
    ? row.created_at.toISOString()
    : new Date(row.created_at).toISOString();
  return {
    id: row.id,
    contractorId: row.contractor_id,
    sequenceNumber,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actor: row.actor,
    payloadHash: row.payload_hash,
    prevHash: row.prev_hash,
    entryHash: row.entry_hash,
    ...(row.details === null ? {} : { details: row.details }),
    ...(row.metadata === null ? {} : { metadata: row.metadata }),
    createdAt,
  };
}

function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function payloadFor(input: LedgerInput): string {
  // Preserve the exact property order and fallback semantics of the original
  // synchronous JSON ledger. Store this serialized payload as TEXT: JSONB does
  // not preserve object key order and therefore cannot reproduce its hash.
  return JSON.stringify({
    contractorId: input.contractorId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details || '',
    metadata: input.metadata || {},
  });
}

async function withClient<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await operation(client);
  } finally {
    client.release();
  }
}

/**
 * Append to the one global HAL hash chain. Tenant IDs scope reads, not sequence
 * allocation: the legacy ledger has one sequence and one prevHash chain.
 */
export async function appendStructuredLedgerEntry(
  input: LedgerInput,
  poolOverride?: Pool,
): Promise<StructuredLedgerEntry> {
  if (!input.contractorId || !input.eventType || !input.entityType || !input.entityId || !input.actor) {
    throw new Error('Structured ledger entries require contractor, event, entity, and actor identifiers.');
  }
  const pool = getPool(poolOverride);
  const payloadJson = payloadFor(input);
  const payloadHash = hash(payloadJson);

  return withClient(pool, async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('SELECT pg_advisory_xact_lock($1, $2)', [LEDGER_LOCK_CLASS, LEDGER_LOCK_ID]);
      const latest = await client.query<{ sequence_number: string; entry_hash: string }>(
        'SELECT sequence_number, entry_hash FROM structured_ledger_entries ORDER BY sequence_number DESC LIMIT 1',
      );
      const previousSequence = latest.rows[0] ? Number(latest.rows[0].sequence_number) : 0;
      if (!Number.isSafeInteger(previousSequence) || previousSequence < 0 || previousSequence >= Number.MAX_SAFE_INTEGER) {
        throw new Error('Structured ledger sequence is invalid or exhausted.');
      }
      const sequenceNumber = previousSequence + 1;
      const prevHash = latest.rows[0]?.entry_hash || ZERO_HASH;
      const createdAt = new Date().toISOString();
      const id = 'led_' + crypto.randomBytes(8).toString('hex');
      const entryHash = hash(`${sequenceNumber}:${prevHash}:${payloadHash}:${input.actor}:${createdAt}`);

      const inserted = await client.query<LedgerRow>(
        `INSERT INTO structured_ledger_entries
          (id, contractor_id, sequence_number, event_type, entity_type, entity_id, actor,
           payload_json, payload_hash, prev_hash, entry_hash, details, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::timestamptz)
         RETURNING id, contractor_id, sequence_number, event_type, entity_type, entity_id, actor,
           payload_json, payload_hash, prev_hash, entry_hash, details, metadata, created_at`,
        [
          id, input.contractorId, sequenceNumber, input.eventType, input.entityType, input.entityId,
          input.actor, payloadJson, payloadHash, prevHash, entryHash, input.details ?? null,
          JSON.stringify(input.metadata ?? null), createdAt,
        ],
      );
      await client.query('COMMIT');
      return asEntry(inserted.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
  });
}

/** Tenant-filtered retrieval; system genesis remains visible as in the legacy API. */
export async function getStructuredLedgerEntries(
  contractorId?: string,
  limit = 10000,
  poolOverride?: Pool,
): Promise<StructuredLedgerEntry[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
    throw new Error('Structured ledger limit must be an integer between 1 and 10000.');
  }
  const pool = getPool(poolOverride);
  const result = contractorId
    ? await pool.query<LedgerRow>(
        `SELECT id, contractor_id, sequence_number, event_type, entity_type, entity_id, actor,
          payload_json, payload_hash, prev_hash, entry_hash, details, metadata, created_at
         FROM structured_ledger_entries
         WHERE contractor_id = $1 OR contractor_id = 'system_genesis'
         ORDER BY sequence_number DESC LIMIT $2`,
        [contractorId, limit],
      )
    : await pool.query<LedgerRow>(
        `SELECT id, contractor_id, sequence_number, event_type, entity_type, entity_id, actor,
          payload_json, payload_hash, prev_hash, entry_hash, details, metadata, created_at
         FROM structured_ledger_entries ORDER BY sequence_number DESC LIMIT $1`,
        [limit],
      );
  return result.rows.map(asEntry);
}

/**
 * Verify the entire global chain, even when a contractorId is supplied. A
 * tenant-filtered subset cannot be verified because it omits other tenants'
 * hashes and would produce false integrity failures or false confidence.
 */
export async function verifyStructuredLedgerIntegrity(
  _contractorId?: string,
  poolOverride?: Pool,
): Promise<{
  valid: boolean;
  totalEntries: number;
  latestHash: string;
  brokenAtSequence?: number;
  auditMessage: string;
}> {
  const pool = getPool(poolOverride);
  const result = await pool.query<LedgerRow>(
    `SELECT id, contractor_id, sequence_number, event_type, entity_type, entity_id, actor,
      payload_json, payload_hash, prev_hash, entry_hash, details, metadata, created_at
     FROM structured_ledger_entries ORDER BY sequence_number ASC`,
  );
  let expectedPrevHash = ZERO_HASH;
  for (let index = 0; index < result.rows.length; index += 1) {
    const row = result.rows[index];
    const sequenceNumber = Number(row.sequence_number);
    const expectedSequence = index + 1;
    const latestHash = result.rows[result.rows.length - 1]?.entry_hash || ZERO_HASH;
    if (sequenceNumber !== expectedSequence) {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: expectedSequence,
        auditMessage: `Sequence mismatch at index ${index}: expected ${expectedSequence}, found ${row.sequence_number}`,
      };
    }
    if (row.prev_hash !== expectedPrevHash) {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: sequenceNumber,
        auditMessage: `Hash chain break at sequence ${sequenceNumber}: previous hash does not match`,
      };
    }
    if (hash(row.payload_json) !== row.payload_hash) {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: sequenceNumber,
        auditMessage: `Payload hash mismatch at sequence ${sequenceNumber}`,
      };
    }
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: sequenceNumber,
        auditMessage: `Payload JSON is invalid at sequence ${sequenceNumber}`,
      };
    }
    if (
      payload.contractorId !== row.contractor_id ||
      payload.eventType !== row.event_type ||
      payload.entityType !== row.entity_type ||
      payload.entityId !== row.entity_id
    ) {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: sequenceNumber,
        auditMessage: `Payload columns do not match the hashed payload at sequence ${sequenceNumber}`,
      };
    }
    const createdAt = row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();
    const expectedEntryHash = hash(
      `${sequenceNumber}:${row.prev_hash}:${row.payload_hash}:${row.actor}:${createdAt}`,
    );
    if (expectedEntryHash !== row.entry_hash) {
      return {
        valid: false, totalEntries: result.rows.length, latestHash,
        brokenAtSequence: sequenceNumber,
        auditMessage: `Entry hash mismatch at sequence ${sequenceNumber}`,
      };
    }
    expectedPrevHash = row.entry_hash;
  }
  const latestHash = result.rows[result.rows.length - 1]?.entry_hash || ZERO_HASH;
  return {
    valid: true,
    totalEntries: result.rows.length,
    latestHash,
    auditMessage: `Cryptographic SHA-256 global hash chain intact across all ${result.rows.length} sequenced ledger entries.`,
  };
}
