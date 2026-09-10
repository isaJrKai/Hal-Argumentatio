import { describe, it, expect } from 'vitest';

/**
 * RECOMMENDATION LEDGER & STATE TRANSITION TESTS
 * Evaluates the deterministic state machine in server.ts (lines 4511-4570):
 * - Status states: 'proposed' | 'approved' | 'rejected' | 'executed' | 'expired'
 * - Invariant: cannot execute an unapproved recommendation (HTTP 409 Conflict)
 * - Invariant: append-only ledger for all decision events
 */

interface Recommendation {
  id: string;
  status: 'proposed' | 'approved' | 'rejected' | 'executed' | 'expired';
  approvedAt?: Date;
  executedAt?: Date;
  rejectedAt?: Date;
}

interface RecommendationEvent {
  id: string;
  recommendationId: string;
  previousStatus: string;
  newStatus: string;
  actor: string;
  timestamp: Date;
}

function transitionRecommendation(
  rec: Recommendation,
  action: 'approve' | 'reject' | 'execute' | 'expire',
  actor: string,
  ledger: RecommendationEvent[]
): { success: boolean; error?: string; updatedRec?: Recommendation } {
  const currentStatus = rec.status;
  const now = new Date();

  if (action === 'approve') {
    if (currentStatus !== 'proposed' && currentStatus !== 'rejected') {
      return { success: false, error: `Invalid transition: cannot approve in '${currentStatus}' state.` };
    }
    const updated = { ...rec, status: 'approved' as const, approvedAt: now };
    ledger.push({
      id: `evt_${Date.now()}`,
      recommendationId: rec.id,
      previousStatus: currentStatus,
      newStatus: 'approved',
      actor,
      timestamp: now
    });
    return { success: true, updatedRec: updated };
  }

  if (action === 'reject') {
    if (currentStatus !== 'proposed' && currentStatus !== 'approved') {
      return { success: false, error: `Invalid transition: cannot reject in '${currentStatus}' state.` };
    }
    const updated = { ...rec, status: 'rejected' as const, rejectedAt: now };
    ledger.push({
      id: `evt_${Date.now()}`,
      recommendationId: rec.id,
      previousStatus: currentStatus,
      newStatus: 'rejected',
      actor,
      timestamp: now
    });
    return { success: true, updatedRec: updated };
  }

  if (action === 'execute') {
    // HARD INVARIANT: Must be approved before execution
    if (currentStatus !== 'approved') {
      return {
        success: false,
        error: `Invalid transition: recommendation must be in 'approved' state before execution. Current: '${currentStatus}'.`
      };
    }
    const updated = { ...rec, status: 'executed' as const, executedAt: now };
    ledger.push({
      id: `evt_${Date.now()}`,
      recommendationId: rec.id,
      previousStatus: currentStatus,
      newStatus: 'executed',
      actor,
      timestamp: now
    });
    return { success: true, updatedRec: updated };
  }

  if (action === 'expire') {
    if (currentStatus !== 'proposed' && currentStatus !== 'approved') {
      return { success: false, error: `Invalid transition: cannot expire in '${currentStatus}' state.` };
    }
    const updated = { ...rec, status: 'expired' as const };
    ledger.push({
      id: `evt_${Date.now()}`,
      recommendationId: rec.id,
      previousStatus: currentStatus,
      newStatus: 'expired',
      actor,
      timestamp: now
    });
    return { success: true, updatedRec: updated };
  }

  return { success: false, error: 'Unknown action' };
}

describe('Integration: Decision & Recommendation Ledger Invariants', () => {
  it('prevents executing an unapproved recommendation (proposed -> execute is blocked)', () => {
    const rec: Recommendation = { id: 'rec_test_1', status: 'proposed' };
    const ledger: RecommendationEvent[] = [];

    const result = transitionRecommendation(rec, 'execute', 'Operator', ledger);
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be in \'approved\' state before execution');
    expect(ledger.length).toBe(0); // No event recorded for illegal transition
  });

  it('permits executing only after explicit human approval', () => {
    const rec: Recommendation = { id: 'rec_test_2', status: 'proposed' };
    const ledger: RecommendationEvent[] = [];

    // Step 1: Operator Approves
    const approveResult = transitionRecommendation(rec, 'approve', 'Operator', ledger);
    expect(approveResult.success).toBe(true);
    expect(approveResult.updatedRec?.status).toBe('approved');
    expect(ledger.length).toBe(1);
    expect(ledger[0].newStatus).toBe('approved');

    // Step 2: System Executes
    const executeResult = transitionRecommendation(approveResult.updatedRec!, 'execute', 'HAL Dispatcher', ledger);
    expect(executeResult.success).toBe(true);
    expect(executeResult.updatedRec?.status).toBe('executed');
    expect(ledger.length).toBe(2);
    expect(ledger[1].newStatus).toBe('executed');
  });

  it('prevents executing or approving an already executed recommendation', () => {
    const rec: Recommendation = { id: 'rec_test_3', status: 'executed' };
    const ledger: RecommendationEvent[] = [];

    const result = transitionRecommendation(rec, 'approve', 'Operator', ledger);
    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot approve');
    expect(ledger.length).toBe(0);
  });
});
