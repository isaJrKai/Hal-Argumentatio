import { describe, expect, it, vi } from 'vitest';
import { canExecutorClaimWorkTask, canHumanUpdateWorkTask, canTransitionWorkTask, listWorkTasks, requiresWorkTaskApproval } from '../../src/lib/workTasks';

describe('HAL work task state machine', () => {
  it('requires approval for consequential task descriptions', () => {
    expect(requiresWorkTaskApproval('outreach', 'Send email to prospect')).toBe(true);
    expect(requiresWorkTaskApproval('contract', 'Sign agreement')).toBe(true);
    expect(requiresWorkTaskApproval('records', 'Archive client record')).toBe(true);
    expect(requiresWorkTaskApproval('billing', 'Transfer funds')).toBe(true);
    expect(requiresWorkTaskApproval('outreach', 'Cold email outreach to 40 prospects')).toBe(true);
    expect(requiresWorkTaskApproval('campaign', 'Launch campaign to selected leads')).toBe(true);
    expect(requiresWorkTaskApproval('research', 'Draft an email for human review')).toBe(false);
    expect(requiresWorkTaskApproval('research', 'Find competitor pricing')).toBe(false);
    expect(requiresWorkTaskApproval('lead_follow_up', 'Review and follow up')).toBe(false);
    expect(requiresWorkTaskApproval('hermes_agent_task', 'Prepare task', undefined, { message: 'Send the campaign to all prospects' })).toBe(true);
    expect(requiresWorkTaskApproval('hermes_agent_task', 'Prepare task', undefined, { message: 'Review the campaign draft only' })).toBe(false);
  });

  it('prevents humans from marking agent-assigned tasks as executed', () => {
    expect(canHumanUpdateWorkTask('hermes', 'running')).toBe(false);
    expect(canHumanUpdateWorkTask('gemini', 'completed')).toBe(false);
    expect(canHumanUpdateWorkTask('hermes', 'cancelled')).toBe(true);
    expect(canHumanUpdateWorkTask('human', 'running')).toBe(true);
    expect(canHumanUpdateWorkTask('human', 'completed')).toBe(true);
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

  it('allows an approved agent task to be claimed but blocks unapproved tasks', () => {
    expect(canExecutorClaimWorkTask({ status: 'awaiting_approval', requiresApproval: true, approvedAt: null })).toBe(false);
    expect(canExecutorClaimWorkTask({ status: 'queued', requiresApproval: true, approvedAt: null })).toBe(false);
    expect(canExecutorClaimWorkTask({ status: 'queued', requiresApproval: true, approvedAt: new Date() })).toBe(true);
    expect(canExecutorClaimWorkTask({ status: 'queued', requiresApproval: false, approvedAt: null })).toBe(true);
    expect(canExecutorClaimWorkTask({ status: 'running', requiresApproval: false })).toBe(false);
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


  it('returns a bounded task summary without exposing raw input payloads', async () => {
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
    expect(projection).toHaveProperty('output');
    expect(limit).toHaveBeenCalledWith(100);
  });

  it('rejects unknown statuses and invalid transitions', () => {
    expect(canTransitionWorkTask('queued', 'completed')).toBe(false);
    expect(canTransitionWorkTask('unknown', 'running')).toBe(false);
  });
});
