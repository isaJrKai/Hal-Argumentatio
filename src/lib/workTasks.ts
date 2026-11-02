import { and, desc, eq } from 'drizzle-orm';
import { workTasks } from '../db/schema';

export const WORK_TASK_STATUSES = ['queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled'] as const;
export type WorkTaskStatus = typeof WORK_TASK_STATUSES[number];
export const WORK_TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type WorkTaskPriority = typeof WORK_TASK_PRIORITIES[number];

const ALLOWED_TRANSITIONS: Record<WorkTaskStatus, WorkTaskStatus[]> = {
  queued: ['running', 'awaiting_approval', 'cancelled'],
  running: ['awaiting_approval', 'completed', 'failed', 'cancelled'],
  awaiting_approval: ['queued', 'cancelled'],
  completed: [],
  failed: ['queued', 'cancelled'],
  cancelled: []
};

export function requiresWorkTaskApproval(taskType: string, title: string, description?: string | null): boolean {
  return /(^|[._\s-])(send|dispatch|publish|spend|purchase|charge|refund|sign|execute[_\s]contract|delete|archive|revoke|transfer[_\s]funds|bulk[_\s]outreach)([._\s-]|$)/i.test(`${taskType} ${title} ${description || ''}`);
}

export function canTransitionWorkTask(from: string, to: string): boolean {
  return WORK_TASK_STATUSES.includes(from as WorkTaskStatus) &&
    WORK_TASK_STATUSES.includes(to as WorkTaskStatus) &&
    ALLOWED_TRANSITIONS[from as WorkTaskStatus].includes(to as WorkTaskStatus);
}

export async function listWorkTasks(db: any, contractorId: string, limit = 50) {
  if (!contractorId) throw new Error('Tenant ID is required.');
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return db.select({
    id: workTasks.id,
    contractorId: workTasks.contractorId,
    taskType: workTasks.taskType,
    title: workTasks.title,
    description: workTasks.description,
    status: workTasks.status,
    priority: workTasks.priority,
    assignedWorker: workTasks.assignedWorker,
    entityType: workTasks.entityType,
    entityId: workTasks.entityId,
    correlationId: workTasks.correlationId,
    attemptCount: workTasks.attemptCount,
    maxAttempts: workTasks.maxAttempts,
    errorMessage: workTasks.errorMessage,
    requiresApproval: workTasks.requiresApproval,
    approvedBy: workTasks.approvedBy,
    approvedAt: workTasks.approvedAt,
    startedAt: workTasks.startedAt,
    completedAt: workTasks.completedAt,
    createdAt: workTasks.createdAt,
    updatedAt: workTasks.updatedAt
  }).from(workTasks)
    .where(eq(workTasks.contractorId, contractorId))
    .orderBy(desc(workTasks.createdAt))
    .limit(safeLimit);
}

export async function getWorkTask(db: any, contractorId: string, taskId: string) {
  if (!contractorId || !taskId) throw new Error('Tenant and task identifiers are required.');
  const [task] = await db.select().from(workTasks)
    .where(and(eq(workTasks.contractorId, contractorId), eq(workTasks.id, taskId)))
    .limit(1);
  return task || null;
}
