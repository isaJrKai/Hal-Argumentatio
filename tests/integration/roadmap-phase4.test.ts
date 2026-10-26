import { describe, it, expect } from 'vitest';
import { db } from '../../src/db/db';
import {
  getDefaultNeuralGraphNodes,
  getDefaultConsensusHistory,
  getDefaultArbitrageOpportunities,
  verifyPhase4Pillars,
  calculateConsensusAlignment,
  extractContractFromPerspective,
  verifyStructuredContracts,
  evaluateAutonomousStrategyArbitrage,
  auditArbitrageGuardrails,
  calculateNetMonthlyLift
} from '../../src/lib/phase4-multi-agent';

/**
 * HAL ROADMAP PHASE 4 (MULTI-AGENT) SPECIFICATION INTEGRATION TESTS
 * Validates the 3 Non-Negotiable Pillars of Phase 4:
 * 1. Dual-Drive Parallel Engine Consensus (Gemini 2.5 + Nemotron 70B & Structured Contract Verification)
 * 2. Neural Graph Agent Routing & Adaptive Bayesian Weight Recalibration
 * 3. Autonomous Closed-Loop Strategy & Spend Arbitrage with Strict Financial Guardrails
 * 4. Cryptographic SHA-256 Ledger Audit Trail
 */

describe('HAL Roadmap Phase 4: Multi-Agent Consensus & Neural Graph Architecture', () => {
  const testContractorId = 'con_test_phase4_' + Date.now();

  describe('Pillar 1: Dual-Drive Parallel Engine Consensus & Contract Verification', () => {
    it('achieves >= 90% semantic alignment between Gemini 2.5 and Nemotron 70B perspectives', () => {
      const topic = 'Emergency Furnace Repair Lead Prioritization for Calgary Commercial HVAC';
      const geminiPerspective = 'Target high-intent emergency boiler failures; propose $3,000/mo retainer with guaranteed 15-min dispatch SLA; minimum 4.0x ROAS.';
      const nemotronPerspective = 'Verify emergency licensing compliance; enforce $3,000/mo retainer floor; validate 4.0x ROAS benchmark under local commercial HVAC density.';

      const alignment = calculateConsensusAlignment(geminiPerspective, nemotronPerspective, topic);

      expect(alignment.alignmentScore).toBeGreaterThanOrEqual(90);
      expect(alignment.passedPolicy).toBe(true);
      expect(alignment.verdict).toBe('CONTRACT_VERIFIED_UNANIMOUS');
      expect(alignment.invariants.every(inv => inv.passed)).toBe(true);
    });

    it('extracts structured numeric contracts and flags arithmetic contradictions', () => {
      const perspectiveA = 'Propose $2,500/mo retainer with ad spend of $1,200/mo and 3.5x ROAS floor.';
      const perspectiveContradicting = 'Propose $5,000/mo retainer with ad spend of $3,500/mo and 1.8x ROAS floor.';

      const contractA = extractContractFromPerspective(perspectiveA, 'gemini-2.5-flash', 'HVAC Retainer');
      const contractB = extractContractFromPerspective(perspectiveContradicting, 'nemotron-70b', 'HVAC Retainer');

      expect(contractA.bounds.monthlyRetainerUsd).toBe(2500);
      expect(contractB.bounds.monthlyRetainerUsd).toBe(5000);

      const verification = verifyStructuredContracts(contractA, contractB, 'HVAC Retainer');
      // Delta between 2500 and 5000 is 100%, exceeding the 20% tolerance
      expect(verification.passedPolicy).toBe(false);
      expect(verification.verdict).toBe('CRITICAL_INVARIANT_BREACH');
    });

    it('records consensus decisions immutably onto the cryptographic ledger', () => {
      const targetConsensus = {
        id: 'test-consensus-record',
        verdict: 'CONTRACT_VERIFIED_UNANIMOUS',
        alignmentScore: 90,
        policyValidationPassed: true
      };

      const block = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'phase4_consensus_synthesized',
        entityType: 'dual_drive_decision',
        entityId: targetConsensus.id,
        actor: 'Dual-Drive Consensus Arbitrator',
        details: `Synthesized Structured Contract Consensus: [${targetConsensus.verdict}] ${targetConsensus.alignmentScore}% formal alignment.`,
        metadata: {
          consensusId: targetConsensus.id,
          alignmentScore: targetConsensus.alignmentScore,
          policyValidationPassed: targetConsensus.policyValidationPassed,
          verdict: targetConsensus.verdict
        }
      });

      expect(block.sequenceNumber).toBeGreaterThan(0);
      expect(block.entryHash).toHaveLength(64);
      expect(block.prevHash).toBeDefined();

      const integrity = db.verifyLedgerIntegrity(testContractorId);
      expect(integrity.valid).toBe(true);
    });
  });

  describe('Pillar 2: Neural Graph Routing & Bayesian Weight Recalibration', () => {
    it('does not invent active node telemetry when no runtime measurements are stored', () => {
      expect(getDefaultNeuralGraphNodes()).toEqual([]);
    });

    it('records a ledger event without inventing node telemetry', () => {
      const nodes = getDefaultNeuralGraphNodes();
      const updatedNodes = nodes.map(n => ({
        ...n,
        avgLatencyMs: Math.max(120, Math.round(n.avgLatencyMs * 0.95)),
        confidenceScore: Math.min(0.99, Number((n.confidenceScore + 0.01).toFixed(2))),
        tasksProcessed: n.tasksProcessed + 42
      }));

      const block = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'phase4_weights_recalibrated',
        entityType: 'neural_network_weights',
        entityId: 'epoch_15',
        actor: 'HAL Bayesian Weight Recalibrator',
        details: `Completed Bayesian weight optimization Epoch #15 across ${updatedNodes.length} neural nodes.`,
        metadata: {
          epoch: 15,
          nodeCount: updatedNodes.length,
          avgLatencyReductionPct: 5.0
        }
      });

      expect(updatedNodes).toEqual([]);
      expect(block.sequenceNumber).toBeGreaterThan(1);
      expect(block.entryHash).toHaveLength(64);

      const integrity = db.verifyLedgerIntegrity(testContractorId);
      expect(integrity.valid).toBe(true);
    });
  });

  describe('Pillar 3: Autonomous Strategy & Spend Arbitrage', () => {
    it('enforces financial invariants INV_08 (30% cap) and INV_09 ($500 liquidity floor & 1.25x ROAS hurdle)', () => {
      const sourceBudget = 2500;
      const validShift = 700; // <= 30% of 2500 (750), leaves 1800 >= 500
      const excessiveShift = 900; // > 30% of 2500

      const validAudit = auditArbitrageGuardrails(sourceBudget, validShift, 1.8, 3.8);
      expect(validAudit.isCompliant).toBe(true);
      expect(validAudit.maxShiftCompliant).toBe(true);
      expect(validAudit.roasHurdleCompliant).toBe(true);
      expect(validAudit.liquidityFloorCompliant).toBe(true);

      const excessiveAudit = auditArbitrageGuardrails(sourceBudget, excessiveShift, 1.8, 3.8);
      expect(excessiveAudit.isCompliant).toBe(false);
      expect(excessiveAudit.maxShiftCompliant).toBe(false);
    });

    it('accurately computes deterministic net monthly lift with zero drift', () => {
      const shiftUsd = 1200;
      const sourceRoas = 1.5;
      const targetRoas = 4.2;

      // Net lift = 1200 * (4.2 - 1.5) = 3240
      const netLift = calculateNetMonthlyLift(shiftUsd, sourceRoas, targetRoas);
      expect(netLift).toBe(3240);
    });

    it('evaluates dynamic strategy arbitrage opportunities from campaign telemetry', () => {
      const campaigns = [
        { id: 'c_broad', name: 'Google Ads Broad Match HVAC', budgetUsd: 3500 },
        { id: 'c_lsa', name: 'Google Local Services Ads HVAC', budgetUsd: 1800 }
      ];

      const adRecords = [
        { campaignId: 'c_broad', cost: 1600, conversions: 6, conversionValue: 2200, clicks: 180, impressions: 3500 },
        { campaignId: 'c_lsa', cost: 900, conversions: 24, conversionValue: 4500, clicks: 90, impressions: 1100 }
      ];

      const result = evaluateAutonomousStrategyArbitrage(campaigns, adRecords);
      expect(result.opportunities.length).toBeGreaterThanOrEqual(1);

      const opp = result.opportunities[0];
      expect(opp.guardrailCompliant).toBe(true);
      expect(opp.proposedReallocationUsd).toBeLessThanOrEqual(3500 * 0.30);
      expect(opp.expectedNetMonthlyLiftUsd).toBeGreaterThan(0);

      // Record closed-loop arbitrage execution
      const block = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'phase4_arbitrage_executed',
        entityType: 'spend_arbitrage_action',
        entityId: opp.id,
        actor: 'HAL Strategy Arbitrageur',
        details: `Executed closed-loop spend shift of $${opp.proposedReallocationUsd.toLocaleString()} from ${opp.sourceChannel} to ${opp.targetChannel}. Expected Net Lift: +$${opp.expectedNetMonthlyLiftUsd.toLocaleString()}/mo.`,
        metadata: {
          arbitrageId: opp.id,
          sourceChannel: opp.sourceChannel,
          targetChannel: opp.targetChannel,
          amountShiftedUsd: opp.proposedReallocationUsd,
          expectedMonthlyLiftUsd: opp.expectedNetMonthlyLiftUsd,
          guardrailCompliant: true
        }
      });

      expect(block.sequenceNumber).toBeGreaterThan(2);
      const integrity = db.verifyLedgerIntegrity(testContractorId);
      expect(integrity.valid).toBe(true);
    });
  });

  describe('Full Phase 4 Pillar Invariant Verification', () => {
    it('fails closed while verified consensus, node telemetry, and arbitrage records are unavailable', () => {
      const verification = verifyPhase4Pillars(
        getDefaultConsensusHistory(),
        getDefaultNeuralGraphNodes(),
        getDefaultArbitrageOpportunities()
      );

      expect(verification.allPassed).toBe(false);
      expect(verification.totalScore).toBe(0);
      expect(verification.pillar1.passed).toBe(false);
      expect(verification.pillar2.passed).toBe(false);
      expect(verification.pillar3.passed).toBe(false);
    });
  });
});
