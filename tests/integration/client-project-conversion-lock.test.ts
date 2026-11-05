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
  } catch {
    dbAvailable = false;
  }
});

afterEach(async () => {
  if (dbAvailable) await pool.query('TRUNCATE TABLE client_project_conversion_lock_test');
});

afterAll(async () => {
  if (dbAvailable) await pool.query('DROP TABLE IF EXISTS client_project_conversion_lock_test');
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
