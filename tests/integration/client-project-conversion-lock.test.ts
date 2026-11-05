import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});

let dbAvailable = false;

beforeAll(async () => {
  try {
    const client = await pool.connect();
    client.release();
    dbAvailable = true;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_project_conversion_lock_test (
        id text PRIMARY KEY,
        contractor_id text NOT NULL,
        lead_id text NOT NULL,
        created_at timestamp NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_project_optimistic_update_test (
        id text PRIMARY KEY,
        contractor_id text NOT NULL,
        status text NOT NULL,
        updated_at timestamptz NOT NULL
      )
    `);
  } catch {
    dbAvailable = false;
  }
});

afterEach(async () => {
  if (dbAvailable) await pool.query('TRUNCATE TABLE client_project_conversion_lock_test, client_project_optimistic_update_test');
});

afterAll(async () => {
  if (dbAvailable) await pool.query('DROP TABLE IF EXISTS client_project_optimistic_update_test, client_project_conversion_lock_test');
  await pool.end().catch(() => {});
});

async function createProjectUnderLeadLock(contractorId: string, leadId: string, projectId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
      [contractorId, leadId]
    );

    const existing = await client.query(
      'SELECT id FROM client_project_conversion_lock_test WHERE contractor_id = $1 AND lead_id = $2 LIMIT 1',
      [contractorId, leadId]
    );
    if (existing.rows[0]) {
      await client.query('COMMIT');
      return { created: false, id: existing.rows[0].id as string };
    }

    await client.query(
      'INSERT INTO client_project_conversion_lock_test (id, contractor_id, lead_id) VALUES ($1, $2, $3)',
      [projectId, contractorId, leadId]
    );
    await client.query('COMMIT');
    return { created: true, id: projectId };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

describe('client project conversion advisory lock', () => {
  it('serializes concurrent conversion attempts for the same tenant lead', async (ctx) => {
    if (!dbAvailable) {
      if (process.env.CI) throw new Error('PostgreSQL is required for this integration test in CI.');
      ctx.skip();
      return;
    }

    const results = await Promise.all([
      createProjectUnderLeadLock('tenant-a', 'lead-won-1', 'project-a'),
      createProjectUnderLeadLock('tenant-a', 'lead-won-1', 'project-b')
    ]);

    expect(results.filter(result => result.created)).toHaveLength(1);
    const rows = await pool.query(
      'SELECT id FROM client_project_conversion_lock_test WHERE contractor_id = $1 AND lead_id = $2',
      ['tenant-a', 'lead-won-1']
    );
    expect(rows.rows).toHaveLength(1);
  });

  it('rejects a stale update after a concurrent terminal-status change', async (ctx) => {
    if (!dbAvailable) {
      if (process.env.CI) throw new Error('PostgreSQL is required for this integration test in CI.');
      ctx.skip();
      return;
    }

    const originalUpdatedAt = new Date('2026-11-05T08:00:00.000Z');
    await pool.query(
      'INSERT INTO client_project_optimistic_update_test (id, contractor_id, status, updated_at) VALUES ($1, $2, $3, $4)',
      ['project-race', 'tenant-a', 'active_delivery', originalUpdatedAt]
    );

    // A concurrent request cancels the project after the first request read it.
    await pool.query(
      'UPDATE client_project_optimistic_update_test SET status = $1, updated_at = NOW() WHERE id = $2 AND contractor_id = $3',
      ['cancelled', 'project-race', 'tenant-a']
    );

    // This is the same optimistic predicate used by the production update:
    // the stale status and timestamp must no longer match.
    const staleUpdate = await pool.query(
      `UPDATE client_project_optimistic_update_test
       SET status = $1
       WHERE id = $2 AND contractor_id = $3 AND status = $4 AND updated_at = $5
       RETURNING id`,
      ['active_delivery', 'project-race', 'tenant-a', 'active_delivery', originalUpdatedAt]
    );
    expect(staleUpdate.rows).toHaveLength(0);

    const [current] = (await pool.query(
      'SELECT status FROM client_project_optimistic_update_test WHERE id = $1 AND contractor_id = $2',
      ['project-race', 'tenant-a']
    )).rows;
    expect(current.status).toBe('cancelled');
  });

  it('keeps project lookup tenant-scoped', async (ctx) => {
    if (!dbAvailable) {
      if (process.env.CI) throw new Error('PostgreSQL is required for this integration test in CI.');
      ctx.skip();
      return;
    }

    await createProjectUnderLeadLock('tenant-a', 'lead-a', 'project-a');
    await createProjectUnderLeadLock('tenant-b', 'lead-b', 'project-b');

    const tenantA = await pool.query(
      'SELECT id FROM client_project_conversion_lock_test WHERE contractor_id = $1',
      ['tenant-a']
    );
    const tenantB = await pool.query(
      'SELECT id FROM client_project_conversion_lock_test WHERE contractor_id = $1',
      ['tenant-b']
    );

    expect(tenantA.rows.map(row => row.id)).toEqual(['project-a']);
    expect(tenantB.rows.map(row => row.id)).toEqual(['project-b']);
  });
});
