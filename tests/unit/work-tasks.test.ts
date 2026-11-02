import { describe, expect, it } from 'vitest';
import { canTransitionWorkTask } from '../../src/lib/workTasks';

describe('HAL work task state machine', () => {
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

  it('rejects unknown statuses and invalid transitions', () => {
    expect(canTransitionWorkTask('queued', 'completed')).toBe(false);
    expect(canTransitionWorkTask('unknown', 'running')).toBe(false);
  });
});
