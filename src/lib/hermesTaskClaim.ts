import { and, eq, isNotNull, lt, or, sql } from 'drizzle-orm';
import { workTasks } from '../db/schema';

/**
 * Atomically claims one queued Hermes task.
 *
 * The conditional UPDATE is the concurrency boundary: two workers may both
 * read a queued task, but PostgreSQL can return the row to only one claimant.
 * Tenant, worker, approval and retry-limit checks are repeated in the UPDATE
 * so stale preflight reads cannot bypass them.
 */
export async function claimHermesWorkTask(db: any, taskId: string, contractorId: string, taskTable: any = workTasks) {
  const [claimed] = await db.update(workTasks).set({
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
