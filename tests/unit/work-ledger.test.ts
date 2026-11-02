import { describe, expect, it, vi } from 'vitest';
import { getEntityWorkEvents, getRecentWorkEvents, recordWorkEvent } from '../../src/lib/workLedger';

describe('HAL shared work ledger', () => {
  it('rejects events without a tenant or required event metadata', async () => {
    const db = { insert: vi.fn() };
    await expect(recordWorkEvent(db, {
      contractorId: '',
      eventType: 'lead.created',
      entityType: 'lead',
      actorType: 'human',
      sourceModule: 'crm',
      summary: 'Created a lead'
    })).rejects.toThrow('Tenant, event type, entity type, source module and summary are required.');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('appends a tenant-scoped event with generated identity and safe defaults', async () => {
    const saved = { id: 'evt_test', contractorId: 'tenant_1', eventType: 'lead.created' };
    const returning = vi.fn().mockResolvedValue([saved]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    const db = { insert };

    const result = await recordWorkEvent(db, {
      contractorId: 'tenant_1',
      eventType: 'lead.created',
      entityType: 'lead',
      entityId: 'lead_1',
      actorType: 'human',
      actorId: 'user_1',
      sourceModule: 'crm',
      summary: 'Created a lead'
    });

    expect(result).toEqual(saved);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      contractorId: 'tenant_1',
      eventType: 'lead.created',
      entityType: 'lead',
      entityId: 'lead_1',
      actorType: 'human',
      sourceModule: 'crm',
      summary: 'Created a lead',
      payload: null
    }));
    expect(values.mock.calls[0][0].id).toMatch(/^evt_/);
  });

  it('clamps recent-history limits and always filters by tenant', async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select };

    await getRecentWorkEvents(db, 'tenant_1', 500);
    expect(where).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(100);
  });

  it('requires tenant and canonical entity identity for entity history', async () => {
    const db = { select: vi.fn() };
    await expect(getEntityWorkEvents(db, '', 'lead', 'lead_1')).rejects.toThrow('Tenant and entity identifiers are required.');
    expect(db.select).not.toHaveBeenCalled();
  });
});
