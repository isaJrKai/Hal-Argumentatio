import { describe, it, expect } from 'vitest';
import { db } from '../../src/db/db';
import {
  getDefaultOrganizationNodes,
  getDefaultEdgeRegions,
  getDefaultBusinessOntologies,
  evaluateBrainSynchronization,
  verifyPhase5Pillars
} from '../../src/lib/phase5-enterprise';

describe('HAL Phase 5 availability and evidence gates', () => {
  const testContractorId = 'con_test_phase5_' + Date.now();

  it('does not seed fictional organizations, revenue, or tenant identifiers', () => {
    expect(getDefaultOrganizationNodes()).toEqual([]);
  });

  it('does not invent edge endpoints, health status, or latency telemetry', () => {
    expect(getDefaultEdgeRegions()).toEqual([]);
  });

  it('does not present sample conversion rates or Bayesian priors as measured data', () => {
    expect(getDefaultBusinessOntologies()).toEqual([]);
  });

  it('does not claim layer-level health scores without runtime instrumentation', () => {
    expect(evaluateBrainSynchronization()).toEqual([]);
  });

  it('fails closed when all enterprise and runtime evidence is unavailable', () => {
    const verification = verifyPhase5Pillars([], [], []);

    expect(verification.allPassed).toBe(false);
    expect(verification.totalScore).toBe(0);
    expect(verification.pillar1.passed).toBe(false);
    expect(verification.pillar2.passed).toBe(false);
    expect(verification.pillar3.passed).toBe(false);
    expect(verification.brainSync.synced).toBe(false);
    expect(verification.brainSync.overallIntegrityScore).toBe(0);
  });

  it('can record the unavailable diagnostic state without claiming federation succeeded', () => {
    const block = db.recordLedgerEntry({
      contractorId: testContractorId,
      eventType: 'phase5_telemetry_unavailable',
      entityType: 'diagnostic_status',
      entityId: 'phase5-runtime-evidence',
      actor: 'HAL Diagnostic Gate',
      details: 'No enterprise, edge, or ontology telemetry is configured.',
      metadata: { regions: [], healthyCount: 0, verified: false }
    });

    expect(block.sequenceNumber).toBeGreaterThan(0);
    expect(block.entryHash).toHaveLength(64);
    expect(db.verifyLedgerIntegrity(testContractorId).valid).toBe(true);
  });
});
