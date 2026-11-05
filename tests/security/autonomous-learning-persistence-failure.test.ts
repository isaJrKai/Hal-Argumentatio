import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  databaseAvailable: true,
  insert: vi.fn(),
  values: vi.fn(),
  onConflictDoUpdate: vi.fn()
}));

vi.mock('../../src/db/postgres', () => ({
  getDrizzleDb: () => mocks.databaseAvailable ? { insert: mocks.insert } : null
}));

import { AutonomousLearningEngine, getTenantAutonomousLearning } from '../../src/lib/autonomousLearning';

describe('autonomous learning persistence failure handling', () => {
  beforeEach(() => {
    mocks.databaseAvailable = true;
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
  });

  it('persists independent learning rows for separate contractor tenants', async () => {
    const tenantA = getTenantAutonomousLearning('contractor-a');
    const tenantB = getTenantAutonomousLearning('contractor-b');

    expect(tenantA).not.toBe(tenantB);
    await tenantA.saveState();
    await tenantB.saveState();

    expect(mocks.values.mock.calls[0][0].id).toBe('tenant:contractor-a');
    expect(mocks.values.mock.calls[1][0].id).toBe('tenant:contractor-b');
  });

  it('does not retain an in-memory outcome when PostgreSQL rejects the write', async () => {
    const engine = new AutonomousLearningEngine();
    const before = structuredClone(engine.getState());
    mocks.onConflictDoUpdate.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(engine.digestBusinessOutcome({
      niche: 'roofing',
      outcome: 'won',
      closedValueUsd: 1200
    })).rejects.toThrow('database unavailable');

    expect(engine.getState()).toEqual(before);
  });

  it('does not change offline mode when PostgreSQL rejects the write', async () => {
    const engine = new AutonomousLearningEngine();
    const before = structuredClone(engine.getState());
    mocks.onConflictDoUpdate.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(engine.setOfflineMode(true)).rejects.toThrow('database unavailable');

    expect(engine.getState()).toEqual(before);
  });

  it('rejects persistence when no PostgreSQL connection is configured', async () => {
    const engine = new AutonomousLearningEngine();
    mocks.databaseAvailable = false;

    await expect(engine.saveState()).rejects.toThrow(
      'PostgreSQL is not configured; learning state was not persisted.'
    );
  });
});
