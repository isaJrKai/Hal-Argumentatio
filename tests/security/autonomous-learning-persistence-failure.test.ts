import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  databaseAvailable: true,
  insert: vi.fn(),
  values: vi.fn(),
  onConflictDoNothing: vi.fn(),
  insertReturning: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  updateReturning: vi.fn()
}));

vi.mock('../../src/db/postgres', () => ({
  getDrizzleDb: () => mocks.databaseAvailable ? { insert: mocks.insert, update: mocks.update } : null
}));

import { AutonomousLearningEngine, getTenantAutonomousLearning } from '../../src/lib/autonomousLearning';

describe('autonomous learning persistence failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.databaseAvailable = true;
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.values.mockReturnValue({ onConflictDoNothing: mocks.onConflictDoNothing });
    mocks.onConflictDoNothing.mockReturnValue({ returning: mocks.insertReturning });
    mocks.insertReturning.mockResolvedValue([{ updatedAt: new Date('2026-01-01T00:00:00.000Z') }]);
    mocks.update.mockReturnValue({ set: mocks.set });
    mocks.set.mockReturnValue({ where: mocks.where });
    mocks.where.mockReturnValue({ returning: mocks.updateReturning });
    mocks.updateReturning.mockResolvedValue([{ updatedAt: new Date('2026-01-01T00:00:01.000Z') }]);
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
    mocks.insertReturning.mockRejectedValueOnce(new Error('database unavailable'));

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
    mocks.insertReturning.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(engine.setOfflineMode(true)).rejects.toThrow('database unavailable');

    expect(engine.getState()).toEqual(before);
  });

  it('keeps mutable calibration defaults isolated between tenant engines', () => {
    const tenantA = getTenantAutonomousLearning('defaults-a');
    const tenantB = getTenantAutonomousLearning('defaults-b');
    const stateA = tenantA.getState();
    const stateB = tenantB.getState();

    stateA.nicheMap.roofing.sampleCount = 99;
    stateA.objections[0].triggerKeywords.push('tenant-a-only');

    expect(stateB.nicheMap.roofing.sampleCount).not.toBe(99);
    expect(stateB.objections[0].triggerKeywords).not.toContain('tenant-a-only');
  });

  it('serializes concurrent outcome mutations for one tenant', async () => {
    const engine = new AutonomousLearningEngine('tenant:serialized');
    const [first, second] = await Promise.all([
      engine.digestBusinessOutcome({ niche: 'roofing', outcome: 'won', closedValueUsd: 1000 }),
      engine.digestBusinessOutcome({ niche: 'roofing', outcome: 'lost' })
    ]);

    expect(first.newEpoch).toBe(1);
    expect(second.newEpoch).toBe(2);
    expect(engine.getState().nicheMap.roofing.sampleCount).toBe(2);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('rejects a stale write from another application instance', async () => {
    const engine = new AutonomousLearningEngine('tenant:stale');
    await engine.saveState();
    const before = structuredClone(engine.getState());
    mocks.updateReturning.mockResolvedValueOnce([]);

    await expect(engine.digestBusinessOutcome({ niche: 'roofing', outcome: 'won' }))
      .rejects.toThrow('Learning state changed in another application instance');
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
