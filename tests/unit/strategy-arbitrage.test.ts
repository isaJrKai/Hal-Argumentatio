import { describe, it, expect } from 'vitest';
import {
  auditArbitrageGuardrails,
  calculateNetMonthlyLift,
  aggregateCampaignMetrics,
  evaluateAutonomousStrategyArbitrage,
  DEFAULT_ARBITRAGE_GUARDRAILS
} from '../../src/lib/strategyArbitrage';

describe('Priority 3: Autonomous Strategy & Spend Arbitrage Engine', () => {
  it('enforces 30% capital shift cap on source campaign budget', () => {
    const sourceBudget = 2000;
    
    // 30% of 2000 is 600
    const compliantShift = 600;
    const excessiveShift = 700;

    const passingAudit = auditArbitrageGuardrails(sourceBudget, compliantShift, 1.2, 3.5);
    expect(passingAudit.maxShiftCompliant).toBe(true);

    const failingAudit = auditArbitrageGuardrails(sourceBudget, excessiveShift, 1.2, 3.5);
    expect(failingAudit.maxShiftCompliant).toBe(false);
    expect(failingAudit.isCompliant).toBe(false);
    expect(failingAudit.reasons.some(r => r.includes('exceeds 30% cap'))).toBe(true);
  });

  it('enforces 1.25x ROAS hurdle multiplier over source channel performance', () => {
    const sourceBudget = 3000;
    const shift = 500;
    const sourceRoas = 2.0;

    // 1.25x hurdle requires target ROAS >= 2.50
    const subHurdleTargetRoas = 2.3; // Only 1.15x
    const meetingHurdleTargetRoas = 2.6; // 1.30x

    const failingAudit = auditArbitrageGuardrails(sourceBudget, shift, sourceRoas, subHurdleTargetRoas);
    expect(failingAudit.roasHurdleCompliant).toBe(false);
    expect(failingAudit.isCompliant).toBe(false);

    const passingAudit = auditArbitrageGuardrails(sourceBudget, shift, sourceRoas, meetingHurdleTargetRoas);
    expect(passingAudit.roasHurdleCompliant).toBe(true);
  });

  it('enforces $500 minimum operational liquidity floor on source campaign', () => {
    const sourceBudget = 600;
    // 30% of 600 is 180, but 600 - 180 = 420, which violates the $500 floor
    const shift = 150;

    const audit = auditArbitrageGuardrails(sourceBudget, shift, 1.0, 3.0);
    expect(audit.liquidityFloorCompliant).toBe(false);
    expect(audit.isCompliant).toBe(false);
    expect(audit.reasons.some(r => r.includes('falls below $500'))).toBe(true);
  });

  it('accurately computes deterministic net monthly revenue lift with zero drift', () => {
    // Reallocation of $1,000 from 1.5x ROAS to 4.0x ROAS
    // Lift = 1000 * (4.0 - 1.5) = 2500
    const lift1 = calculateNetMonthlyLift(1000, 1.5, 4.0);
    expect(lift1).toBe(2500);

    // Negative or zero delta yields 0
    const lift2 = calculateNetMonthlyLift(1000, 3.0, 2.5);
    expect(lift2).toBe(0);

    const lift3 = calculateNetMonthlyLift(0, 1.0, 3.0);
    expect(lift3).toBe(0);
  });

  it('aggregates live campaign telemetry and categorizes efficiency tiers', () => {
    const campaigns = [
      { id: 'camp_alpha', name: 'Google LSA Verified HVAC', budgetUsd: 4000 },
      { id: 'camp_drag', name: 'Google Display Network In-App', budgetUsd: 2500 }
    ];

    const adRecords = [
      // Alpha performer: spend 1000, convValue 4500 (ROAS 4.5), 15 conversions
      {
        campaignId: 'camp_alpha',
        cost: 1000,
        conversions: 15,
        conversionValue: 4500,
        clicks: 80,
        impressions: 1200
      },
      // Capital drag: spend 900, convValue 600 (ROAS 0.67), 2 conversions
      {
        campaignId: 'camp_drag',
        cost: 900,
        conversions: 2,
        conversionValue: 600,
        clicks: 120,
        impressions: 4000
      }
    ];

    const metrics = aggregateCampaignMetrics(campaigns, adRecords);
    expect(metrics.length).toBe(2);

    const alphaMetric = metrics.find(m => m.campaignId === 'camp_alpha')!;
    const dragMetric = metrics.find(m => m.campaignId === 'camp_drag')!;

    expect(alphaMetric.roas).toBe(4.5);
    expect(alphaMetric.efficiencyTier).toBe('ALPHA_GENERATOR');

    expect(dragMetric.roas).toBe(0.67);
    expect(dragMetric.efficiencyTier).toBe('CAPITAL_DRAG');
  });

  it('evaluates autonomous strategy arbitrage opportunities between live campaigns', () => {
    const campaigns = [
      { id: 'camp_search_broad', name: 'Broad Match Search', budgetUsd: 3000 },
      { id: 'camp_lsa_high_intent', name: 'Local Services Ads Direct', budgetUsd: 2000 }
    ];

    const adRecords = [
      {
        campaignId: 'camp_search_broad',
        cost: 1500,
        conversions: 5,
        conversionValue: 1800, // ROAS 1.2
        clicks: 150,
        impressions: 3000
      },
      {
        campaignId: 'camp_lsa_high_intent',
        cost: 1000,
        conversions: 20,
        conversionValue: 4200, // ROAS 4.2
        clicks: 100,
        impressions: 1500
      }
    ];

    const evalResult = evaluateAutonomousStrategyArbitrage(campaigns, adRecords);
    expect(evalResult.opportunities.length).toBeGreaterThanOrEqual(1);

    const topOpp = evalResult.opportunities[0];
    expect(topOpp.guardrailCompliant).toBe(true);
    expect(topOpp.sourceCampaignId).toBe('camp_search_broad');
    expect(topOpp.targetCampaignId).toBe('camp_lsa_high_intent');

    // 30% cap on 3000 is 900
    expect(topOpp.proposedReallocationUsd).toBeLessThanOrEqual(900);
    // Remaining budget: 3000 - proposedShift >= 500
    expect(3000 - topOpp.proposedReallocationUsd).toBeGreaterThanOrEqual(500);

    // Expected lift calculation matches
    const expectedLift = calculateNetMonthlyLift(
      topOpp.proposedReallocationUsd,
      topOpp.currentSourceRoas,
      topOpp.projectedTargetRoas
    );
    expect(topOpp.expectedNetMonthlyLiftUsd).toBe(expectedLift);

    // Verify invariants audit pass
    expect(evalResult.invariantsAudit.every(a => a.passed)).toBe(true);
  });
});
