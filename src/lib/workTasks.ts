import { and, desc, eq, inArray } from 'drizzle-orm';
import { workEvents, workTasks } from '../db/schema';

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

export function requiresWorkTaskApproval(taskType: string, title: string, description?: string | null, input?: unknown): boolean {
  let inputText = '';
  try { inputText = input === undefined ? '' : JSON.stringify(input); } catch { inputText = '[unserializable task input]'; }
  const actionPattern = /\b(send|sending|dispatch|publish|publishing|spend|purchase|charge|refund|sign|signing|execute\s+contract|delete|deletion|archive|revoke|transfer\s+funds|bulk\s+outreach|email\s+blast|cold\s+email|email\s+outreach|sms\s+campaign|whatsapp\s+campaign|launch\s+campaign)\b/i;
  return actionPattern.test(`${taskType} ${title} ${description || ''} ${inputText}`);
}

export function canHumanUpdateWorkTask(assignedWorker: string, nextStatus: string): boolean {
  // Agent work can only be started/completed/failed by its registered executor receipt path.
  // Human operators may still approve or cancel agent-assigned work.
  if (assignedWorker !== 'human' && ['running', 'completed', 'failed'].includes(nextStatus)) return false;
  return true;
}

export function canTransitionWorkTask(from: string, to: string): boolean {
  return WORK_TASK_STATUSES.includes(from as WorkTaskStatus) &&
    WORK_TASK_STATUSES.includes(to as WorkTaskStatus) &&
    ALLOWED_TRANSITIONS[from as WorkTaskStatus].includes(to as WorkTaskStatus);
}

export function canExecutorClaimWorkTask(task: { status: string; requiresApproval: boolean; approvedAt?: Date | string | null }): boolean {
  if (task.status !== 'queued') return false;
  return !task.requiresApproval || Boolean(task.approvedAt);
}

export async function ensureLeadReviewTask(
  db: any,
  contractorId: string,
  lead: { id: string; businessName: string; verificationStatus?: string | null },
  sourceModule: string
): Promise<{ taskId: string; created: boolean }> {
  if (!contractorId || !lead?.id || !lead?.businessName) {
    throw new Error('Tenant and lead identifiers are required to create a review task.');
  }
  const [activeTask] = await db.select({ id: workTasks.id }).from(workTasks).where(and(
    eq(workTasks.contractorId, contractorId),
    eq(workTasks.taskType, 'lead_follow_up'),
    eq(workTasks.entityType, 'lead'),
    eq(workTasks.entityId, lead.id),
    eq(workTasks.assignedWorker, 'human'),
    inArray(workTasks.status, ['queued', 'running', 'awaiting_approval'])
  )).limit(1);
  if (activeTask) return { taskId: activeTask.id, created: false };

  const now = new Date();
  const taskId = 'task_' + crypto.randomUUID();
  const correlationId = taskId;
  await db.insert(workTasks).values({
    id: taskId,
    contractorId,
    taskType: 'lead_follow_up',
    title: `Review and qualify: ${lead.businessName}`,
    description: 'Review this lead, confirm its business details and verification evidence, then record the next step. Do not contact the prospect until required outreach verification checks pass.',
    status: 'queued',
    priority: 'normal',
    assignedWorker: 'human',
    entityType: 'lead',
    entityId: lead.id,
    correlationId,
    input: { source: sourceModule, verificationStatus: lead.verificationStatus || 'UNVERIFIED_STAGING' },
    requiresApproval: false,
    createdAt: now,
    updatedAt: now
  });
  await db.insert(workEvents).values({
    id: 'evt_' + crypto.randomUUID(),
    contractorId,
    eventType: 'task.created',
    entityType: 'work_task',
    entityId: taskId,
    actorType: 'system',
    actorId: sourceModule,
    sourceModule,
    correlationId,
    summary: `Created human review task for ${lead.businessName}.`,
    payload: { taskType: 'lead_follow_up', assignedWorker: 'human', priority: 'normal', status: 'queued', leadId: lead.id }
  });
  await db.insert(workEvents).values({
    id: 'evt_' + crypto.randomUUID(),
    contractorId,
    eventType: 'lead.queued_for_review',
    entityType: 'lead',
    entityId: lead.id,
    actorType: 'system',
    actorId: sourceModule,
    sourceModule,
    correlationId,
    summary: `${lead.businessName} was added to the human review queue.`,
    payload: { taskId, verificationStatus: lead.verificationStatus || 'UNVERIFIED_STAGING' }
  });
  return { taskId, created: true };
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
    output: workTasks.output,
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
