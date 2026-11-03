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
export async function claimHermesWorkTask(db: any, taskId: string, contractorId: string) {
  const [claimed] = await db.update(workTasks).set({
    status: 'running',
    startedAt: sql`COALESCE(${workTasks.startedAt}, NOW())`,
    attemptCount: sql`${workTasks.attemptCount} + 1`,
    errorMessage: null,
    updatedAt: new Date()
  }).where(and(
    eq(workTasks.id, taskId),
    eq(workTasks.contractorId, contractorId),
    eq(workTasks.assignedWorker, 'hermes'),
    eq(workTasks.status, 'queued'),
    lt(workTasks.attemptCount, workTasks.maxAttempts),
    or(eq(workTasks.requiresApproval, false), isNotNull(workTasks.approvedAt))
  )).returning();
  return claimed || null;
}
