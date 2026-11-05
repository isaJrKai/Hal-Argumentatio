import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { getPostgresPool } from './postgres';
import { decrypt, encrypt } from './encryption';

function requirePool(pool?: Pool): Pool {
  const resolved = pool ?? getPostgresPool();
  if (!resolved) throw new Error('PostgreSQL is not configured for connector credential storage.');
  return resolved;
}

/** Return only successfully decrypted credentials for the requested tenant. */
export async function getConnectorCredentials(contractorId: string, pool?: Pool): Promise<Record<string, string>> {
  if (!contractorId) throw new Error('A contractor ID is required.');
  const result = await requirePool(pool).query<{ service: string; encrypted_value: string }>(
    'SELECT service, encrypted_value FROM connector_credentials WHERE contractor_id = $1',
    [contractorId]
  );

  const credentials: Record<string, string> = {};
  for (const row of result.rows) {
    const value = decrypt(row.encrypted_value);
    if (value) credentials[row.service] = value;
  }
  return credentials;
}

/**
 * Persist one tenant/service credential transactionally.
 * A transaction-scoped advisory lock serializes writes even before a unique
 * constraint can safely be added to an existing table with unknown row state.
 * Duplicate historical rows are surfaced, never silently overwritten.
 */
export async function saveConnectorCredential(contractorId: string, service: string, secret: string, pool?: Pool): Promise<void> {
  if (!contractorId.trim() || !service.trim()) throw new Error('Contractor ID and service are required.');
  if (typeof secret !== 'string') throw new Error('Credential value must be a string.');

  const client = await requirePool(pool).connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [contractorId, service]);
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM connector_credentials WHERE contractor_id = $1 AND service = $2 FOR UPDATE',
      [contractorId, service]
    );
    if (existing.rows.length > 1) {
      throw new Error('Duplicate connector credential records exist for this tenant and service; reconcile them before writing.');
    }

    if (secret.length === 0) {
      if (existing.rows.length === 1) {
        await client.query('DELETE FROM connector_credentials WHERE id = $1', [existing.rows[0].id]);
      }
    } else {
      const encryptedValue = encrypt(secret);
      if (existing.rows.length === 1) {
        await client.query(
          'UPDATE connector_credentials SET encrypted_value = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [existing.rows[0].id, encryptedValue]
        );
      } else {
        await client.query(
          'INSERT INTO connector_credentials (id, contractor_id, service, encrypted_value, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
          [randomUUID(), contractorId, service, encryptedValue]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
