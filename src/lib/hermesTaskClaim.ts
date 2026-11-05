import { and, eq, isNotNull, lt, or, sql } from 'drizzle-orm';
import { workTasks } from '../db/schema';

export const HERMES_TASK_LEASE_MS = 120_000;

/**
 * Atomically claims one queued Hermes task. attemptCount is also the fencing
 * token: every heartbeat and terminal write must match the claimed attempt.
 */
export async function claimHermesWorkTask(db: any, taskId: string, contractorId: string, taskTable: any = workTasks) {
  const [claimed] = await db.update(taskTable).set({
    status: 'running',
    startedAt: sql`COALESCE(${taskTable.startedAt}, NOW())`,
    attemptCount: sql`${taskTable.attemptCount} + 1`,
    errorMessage: null,
    updatedAt: new Date()
  }).where(and(
    eq(taskTable.id, taskId),
    eq(taskTable.contractorId, contractorId),
    eq(taskTable.assignedWorker, 'hermes'),
    eq(taskTable.status, 'queued'),
    lt(taskTable.attemptCount, taskTable.maxAttempts),
    or(eq(taskTable.requiresApproval, false), isNotNull(taskTable.approvedAt))
  )).returning();
  return claimed || null;
}

/**
 * Refreshes the task lease only while this exact attempt still owns the task.
 * A late heartbeat from an expired attempt cannot refresh a newer attempt.
 */
export async function heartbeatHermesWorkTask(
  db: any,
  taskId: string,
  contractorId: string,
  attempt: number,
  taskTable: any = workTasks
) {
  const [updated] = await db.update(taskTable).set({ updatedAt: new Date() }).where(and(
    eq(taskTable.id, taskId),
    eq(taskTable.contractorId, contractorId),
    eq(taskTable.assignedWorker, 'hermes'),
    eq(taskTable.status, 'running'),
    eq(taskTable.attemptCount, attempt)
  )).returning({ id: taskTable.id });
  return Boolean(updated);
}

/**
 * Converts an abandoned running attempt into a truthful failed receipt. It
 * never requeues automatically: an operator must explicitly request a retry,
 * and the existing attempt limit remains authoritative.
 */
export async function failExpiredHermesWorkTask(
  db: any,
  taskId: string,
  contractorId: string,
  now = new Date(),
  leaseMs = HERMES_TASK_LEASE_MS,
  taskTable: any = workTasks
) {
  const expiredBefore = new Date(now.getTime() - leaseMs);
  const [failed] = await db.update(taskTable).set({
    status: 'failed',
    errorMessage: 'Hermes execution lease expired before a terminal receipt was recorded.',
    output: sql`jsonb_build_object(
      'schemaVersion', 1,
      'outcome', 'lease_expired',
      'success', false,
      'worker', 'hermes',
      'taskId', ${taskId}::text,
      'attempt', ${taskTable.attemptCount},
      'recordedAt', ${now.toISOString()}::text,
      'message', 'The executor stopped heartbeating. No successful completion was recorded; operator review is required before retry.'
    )`,
    completedAt: now,
    updatedAt: now
  }).where(and(
    eq(taskTable.id, taskId),
    eq(taskTable.contractorId, contractorId),
    eq(taskTable.assignedWorker, 'hermes'),
    eq(taskTable.status, 'running'),
    lt(taskTable.updatedAt, expiredBefore)
  )).returning();
  return failed || null;
}
