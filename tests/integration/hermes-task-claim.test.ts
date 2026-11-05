import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { claimHermesWorkTask, heartbeatHermesWorkTask, failExpiredHermesWorkTask } from '../../src/lib/hermesTaskClaim';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});
const db = drizzle(pool);
const testTasks = pgTable('hermes_task_claim_test', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  assignedWorker: text('assigned_worker').notNull(),
  status: text('status').notNull(),
  startedAt: timestamp('started_at'),
  attemptCount: integer('attempt_count').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  errorMessage: text('error_message'),
  requiresApproval: boolean('requires_approval').notNull(),
  approvedAt: timestamp('approved_at'),
  updatedAt: timestamp('updated_at').notNull(),
  completedAt: timestamp('completed_at'),
  output: jsonb('output')
});

let dbAvailable = false;

beforeAll(async () => {
  try {
    const client = await pool.connect();
    client.release();
    dbAvailable = true;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hermes_task_claim_test (
        id text PRIMARY KEY,
        contractor_id text NOT NULL,
        assigned_worker text NOT NULL DEFAULT 'human',
        status text NOT NULL DEFAULT 'queued',
        started_at timestamp,
        attempt_count integer NOT NULL DEFAULT 0,
        max_attempts integer NOT NULL DEFAULT 3,
        error_message text,
        requires_approval boolean NOT NULL DEFAULT false,
        approved_at timestamp,
        updated_at timestamp NOT NULL DEFAULT NOW(),
        completed_at timestamp,
        output jsonb
      )
    `);
  } catch {
    dbAvailable = false;
  }
});

afterEach(async () => {
  if (!dbAvailable) return;
  await pool.query('TRUNCATE TABLE hermes_task_claim_test');
});

afterAll(async () => {
  if (dbAvailable) {
    await pool.query('DROP TABLE IF EXISTS hermes_task_claim_test');
  }
  await pool.end().catch(() => {});
});

async function insertTask(overrides: Record<string, unknown> = {}) {
  if (!dbAvailable) return;
  const values = {
    id: 'task-hermes-1',
    contractor_id: 'tenant-a',
    assigned_worker: 'hermes',
    status: 'queued',
    attempt_count: 0,
    max_attempts: 3,
    requires_approval: false,
    ...overrides
  };
  await pool.query(
    `INSERT INTO hermes_task_claim_test
      (id, contractor_id, assigned_worker, status, attempt_count, max_attempts, requires_approval, approved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [values.id, values.contractor_id, values.assigned_worker, values.status, values.attempt_count,
      values.max_attempts, values.requires_approval, values.approved_at ?? null]
  );
}

describe('Hermes PostgreSQL task claim', () => {
  it('allows exactly one winner when two workers race for the same task', async () => {
    if (!dbAvailable) return;
    await insertTask();
    const claims = await Promise.all([
      claimHermesWorkTask(db, 'task-hermes-1', 'tenant-a', testTasks),
      claimHermesWorkTask(db, 'task-hermes-1', 'tenant-a', testTasks)
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    const { rows } = await pool.query(
      'SELECT status, attempt_count FROM hermes_task_claim_test WHERE id = $1',
      ['task-hermes-1']
    );
    expect(rows[0]).toMatchObject({ status: 'running', attempt_count: 1 });
  });

  it('does not allow another tenant to claim the task', async () => {
    if (!dbAvailable) return;
    await insertTask();
    await expect(claimHermesWorkTask(db, 'task-hermes-1', 'tenant-b', testTasks)).resolves.toBeNull();
    const { rows } = await pool.query('SELECT status, attempt_count FROM hermes_task_claim_test WHERE id = $1', ['task-hermes-1']);
    expect(rows[0]).toMatchObject({ status: 'queued', attempt_count: 0 });
  });

  it('does not claim approval-blocked or exhausted tasks', async () => {
    if (!dbAvailable) return;
    await insertTask({ requires_approval: true });
    await expect(claimHermesWorkTask(db, 'task-hermes-1', 'tenant-a', testTasks)).resolves.toBeNull();

    await pool.query('TRUNCATE TABLE hermes_task_claim_test');
    await insertTask({ attempt_count: 3, max_attempts: 3 });
    await expect(claimHermesWorkTask(db, 'task-hermes-1', 'tenant-a', testTasks)).resolves.toBeNull();
  });

  it('claims an approved task and increments attempts in PostgreSQL', async () => {
    if (!dbAvailable) return;
    await insertTask({ requires_approval: true, approved_at: new Date() });
    const claimed = await claimHermesWorkTask(db, 'task-hermes-1', 'tenant-a', testTasks);
    expect(claimed).toMatchObject({ status: 'running', attemptCount: 1, contractorId: 'tenant-a' });
  });

  it('refreshes only the current tenant-owned attempt heartbeat', async () => {
    if (!dbAvailable) return;
    await insertTask();
    const first = await pool.query('SELECT updated_at FROM hermes_task_claim_test WHERE id = $1', ['task-hermes-1']);
    await expect(heartbeatHermesWorkTask(db, 'task-hermes-1', 'tenant-b', 1, testTasks)).resolves.toBe(false);
    const alive = await heartbeatHermesWorkTask(db, 'task-hermes-1', 'tenant-a', 1, testTasks);
    expect(alive).toBe(true);
    const after = await pool.query('SELECT updated_at FROM hermes_task_claim_test WHERE id = $1', ['task-hermes-1']);
    expect(new Date(after.rows[0].updated_at).getTime()).toBeGreaterThanOrEqual(new Date(first.rows[0].updated_at).getTime());

    await pool.query('UPDATE hermes_task_claim_test SET status = $1, attempt_count = $2 WHERE id = $3', ['running', 2, 'task-hermes-1']);
    await expect(heartbeatHermesWorkTask(db, 'task-hermes-1', 'tenant-a', 1, testTasks)).resolves.toBe(false);
  });

  it('turns an expired running lease into a persisted failure receipt, without crossing tenants', async () => {
    if (!dbAvailable) return;
    await insertTask({ status: 'running', attempt_count: 1 });
    await pool.query("UPDATE hermes_task_claim_test SET updated_at = NOW() - INTERVAL '5 minutes' WHERE id = $1", ['task-hermes-1']);
    const wrongTenant = await failExpiredHermesWorkTask(db, 'task-hermes-1', 'tenant-b', new Date(), 120_000, testTasks);
    expect(wrongTenant).toBeNull();

    const recovered = await failExpiredHermesWorkTask(db, 'task-hermes-1', 'tenant-a', new Date(), 120_000, testTasks);
    expect(recovered).toMatchObject({ status: 'failed', attemptCount: 1 });
    expect(recovered.output).toMatchObject({ outcome: 'lease_expired', success: false, worker: 'hermes', taskId: 'task-hermes-1', attempt: 1 });
    expect(recovered.errorMessage).toContain('lease expired');
  });

});
