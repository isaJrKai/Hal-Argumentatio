import { desc, eq, and } from 'drizzle-orm';
import { workEvents } from '../db/schema';

export type WorkEventInput = {
  contractorId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  actorType: 'human' | 'agent' | 'system' | 'integration';
  actorId?: string | null;
  sourceModule: string;
  correlationId?: string | null;
  summary: string;
  payload?: Record<string, unknown> | null;
  occurredAt?: Date;
};

/** Append factual operational history. Never put secrets or plaintext contact details in payload. */
export async function recordWorkEvent(db: any, event: WorkEventInput) {
  if (!event.contractorId || !event.eventType || !event.entityType || !event.sourceModule || !event.summary) {
    throw new Error('Tenant, event type, entity type, source module and summary are required.');
  }
  const [saved] = await db.insert(workEvents).values({
    id: 'evt_' + crypto.randomUUID(),
    contractorId: event.contractorId,
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId || null,
    actorType: event.actorType,
    actorId: event.actorId || null,
    sourceModule: event.sourceModule,
    correlationId: event.correlationId || null,
    summary: event.summary,
    payload: event.payload || null,
    occurredAt: event.occurredAt || new Date(),
  }).returning();
  return saved;
}

export async function getRecentWorkEvents(db: any, contractorId: string, limit = 40) {
  if (!contractorId) throw new Error('Tenant ID is required.');
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return db.select().from(workEvents).where(eq(workEvents.contractorId, contractorId))
    .orderBy(desc(workEvents.occurredAt)).limit(safeLimit);
}

export async function getEntityWorkEvents(db: any, contractorId: string, entityType: string, entityId: string, limit = 50) {
  if (!contractorId || !entityType || !entityId) throw new Error('Tenant and entity identifiers are required.');
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return db.select().from(workEvents)
    .where(and(eq(workEvents.contractorId, contractorId), eq(workEvents.entityType, entityType), eq(workEvents.entityId, entityId)))
    .orderBy(desc(workEvents.occurredAt)).limit(safeLimit);
}
