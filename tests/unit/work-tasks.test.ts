import { describe, expect, it } from 'vitest';
import { canTransitionWorkTask, listWorkTasks, requiresWorkTaskApproval } from '../../src/lib/workTasks';

describe('HAL work task state machine', () => {
  it('requires approval for consequential task descriptions', () => {
    expect(requiresWorkTaskApproval('outreach', 'Send email to prospect')).toBe(true);
    expect(requiresWorkTaskApproval('contract', 'Sign agreement')).toBe(true);
    expect(requiresWorkTaskApproval('records', 'Archive client record')).toBe(true);
    expect(requiresWorkTaskApproval('billing', 'Transfer funds')).toBe(true);
    expect(requiresWorkTaskApproval('research', 'Find competitor pricing')).toBe(false);
    expect(requiresWorkTaskApproval('lead_follow_up', 'Review and follow up')).toBe(false);
  });

  it('allows queued work to start, request approval, or be cancelled', () => {
    expect(canTransitionWorkTask('queued', 'running')).toBe(true);
    expect(canTransitionWorkTask('queued', 'awaiting_approval')).toBe(true);
    expect(canTransitionWorkTask('queued', 'cancelled')).toBe(true);
  });

  it('requires approval to return to the queue before execution', () => {
    expect(canTransitionWorkTask('awaiting_approval', 'queued')).toBe(true);
    expect(canTransitionWorkTask('awaiting_approval', 'running')).toBe(false);
  });

  it('keeps completed and cancelled tasks terminal', () => {
    expect(canTransitionWorkTask('completed', 'queued')).toBe(false);
    expect(canTransitionWorkTask('cancelled', 'running')).toBe(false);
  });

  it('allows bounded recovery from a failed task', () => {
    expect(canTransitionWorkTask('failed', 'queued')).toBe(true);
    expect(canTransitionWorkTask('failed', 'cancelled')).toBe(true);
    expect(canTransitionWorkTask('failed', 'completed')).toBe(false);
  });


  it('returns a bounded task summary without exposing raw input/output payloads', async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select };

    await listWorkTasks(db, 'tenant_1', 500);

    const projection = select.mock.calls[0][0];
    expect(projection).toHaveProperty('title');
    expect(projection).toHaveProperty('assignedWorker');
    expect(projection).not.toHaveProperty('input');
    expect(projection).not.toHaveProperty('output');
    expect(limit).toHaveBeenCalledWith(100);
  });

  it('rejects unknown statuses and invalid transitions', () => {
    expect(canTransitionWorkTask('queued', 'completed')).toBe(false);
    expect(canTransitionWorkTask('unknown', 'running')).toBe(false);
  });
});
