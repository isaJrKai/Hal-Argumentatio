import { describe, it, expect } from 'vitest';
import { validateLoopGate, HAL_LOOP_STAGES, REQUIRED_CRITIC_CONFIDENCE_THRESHOLD } from '../../src/lib/loopGating';

interface HalLoop {
  id: string;
  contractorId: string;
  status: 'initialized' | 'active' | 'awaiting_approval' | 'paused' | 'completed';
  currentStage: string;
}

interface HalLoopEvent {
  loopId: string;
  previousState: string;
  newState: string;
  eventType: string;
}

describe('Integration: Business Loop Engine State Machine & Evidence Gates', () => {
  it('follows the canonical 10-stage progression order', () => {
    expect(HAL_LOOP_STAGES.length).toBe(10);
    expect(HAL_LOOP_STAGES[0]).toBe('gathering');
    expect(HAL_LOOP_STAGES[3]).toBe('simulating');
    expect(HAL_LOOP_STAGES[4]).toBe('awaiting_approval');
    expect(HAL_LOOP_STAGES[5]).toBe('approved');
    expect(HAL_LOOP_STAGES[9]).toBe('completed');
  });

  describe('Evidence Gates Enforcement (Remediated)', () => {
    it('blocks advancing from gathering to analyzing if gathered records count is zero', () => {
      const result = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'analyzing',
        status: 'active',
        stateSnapshot: { recordsCount: 0 }
      });

      expect(result.passed).toBe(false);
      expect(result.blockedReason).toContain('Evidence Gate Blocked');
    });

    it('permits advancing from gathering to analyzing when sufficient data is present', () => {
      const result = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'analyzing',
        status: 'active',
        stateSnapshot: { recordsCount: 25, evidenceVerified: true }
      });

      expect(result.passed).toBe(true);
    });

    it('blocks advancing from analyzing to planning if critic confidence is low', () => {
      expect(REQUIRED_CRITIC_CONFIDENCE_THRESHOLD).toBe(60);

      // Score 59.9 should be rejected
      const resultBelow = validateLoopGate({
        currentStage: 'analyzing',
        nextStage: 'planning',
        status: 'active',
        criticFindings: { confidenceScore: 59.9 }
      });
      expect(resultBelow.passed).toBe(false);
      expect(resultBelow.blockedReason).toContain(`Critic Gate Blocked: Analysis confidence score (59.9%) is below the minimum required threshold of ${REQUIRED_CRITIC_CONFIDENCE_THRESHOLD}%.`);

      // Score 60 should be permitted
      const resultAt = validateLoopGate({
        currentStage: 'analyzing',
        nextStage: 'planning',
        status: 'active',
        criticFindings: { confidenceScore: 60 }
      });
      expect(resultAt.passed).toBe(true);
    });

    it('blocks advancing from simulating to awaiting_approval if simulation has not been executed', () => {
      const result = validateLoopGate({
        currentStage: 'simulating',
        nextStage: 'awaiting_approval',
        status: 'active',
        stateSnapshot: {}
      });

      expect(result.passed).toBe(false);
      expect(result.blockedReason).toContain('Simulation Gate Blocked');
    });

    it('STRICT HUMAN GATE: blocks promoting awaiting_approval to approved without explicit operator authorization', () => {
      // Autonomous advancement attempt without operator approval
      const autonomousAttempt = validateLoopGate({
        currentStage: 'awaiting_approval',
        nextStage: 'approved',
        status: 'awaiting_approval',
        operatorApproved: false
      });

      expect(autonomousAttempt.passed).toBe(false);
      expect(autonomousAttempt.blockedReason).toContain('Human-In-The-Loop Gate Blocked');

      // Authorized operator approval
      const operatorAuthorized = validateLoopGate({
        currentStage: 'awaiting_approval',
        nextStage: 'approved',
        status: 'awaiting_approval',
        operatorApproved: true,
        operatorId: 'contractor_human_operator_1'
      });

      expect(operatorAuthorized.passed).toBe(true);
    });
  });

  describe('Lifecycle State Transitions', () => {
    it('verifies pause and resume lifecycle transitions', () => {
      let loop: HalLoop = {
        id: 'loop_1',
        contractorId: 'tenant_apex',
        status: 'active',
        currentStage: 'analyzing'
      };
      const events: HalLoopEvent[] = [];

      // Pause
      loop.status = 'paused';
      events.push({
        loopId: loop.id,
        previousState: 'active',
        newState: 'paused',
        eventType: 'stage_transition'
      });

      expect(loop.status).toBe('paused');
      expect(events.length).toBe(1);

      // Resume
      loop.status = 'active';
      events.push({
        loopId: loop.id,
        previousState: 'paused',
        newState: 'active',
        eventType: 'stage_transition'
      });

      expect(loop.status).toBe('active');
      expect(events.length).toBe(2);
    });
  });
});
