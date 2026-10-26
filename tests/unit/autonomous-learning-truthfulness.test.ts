import { describe, it, expect } from 'vitest';
import { autonomousLearning } from '../../src/lib/autonomousLearning';

describe('Security and truthfulness: untrained offline learning defaults', () => {
  it('does not report seeded outcomes, conversions, win rates, or readiness on a fresh state', () => {
    const state = autonomousLearning.getState();
    expect(state.totalOutcomesDigested).toBe(0);
    expect(state.calibrationEpoch).toBe(0);
    expect(state.autonomyReadinessScore).toBe(0);
    for (const profile of Object.values(state.nicheMap)) {
      expect(profile.calibrationSource).not.toBe('measured_outcomes');
      expect(profile.sampleCount).toBe(0);
      expect(profile.winCount).toBe(0);
      expect(profile.lossCount).toBe(0);
      expect(profile.conversionRate).toBe(0);
      expect(profile.confidenceScore).toBe(0);
    }
    for (const rule of state.objections) {
      expect(rule.successRate).toBe(0);
      expect(rule.timesApplied).toBe(0);
    }
  });

  it('does not invent audit findings, lost revenue, performance benchmarks, or uplift in outreach copy', () => {
    const pitch = autonomousLearning.generateOfflinePitch({
      businessName: 'Example Business',
      city: 'Kampala',
      niche: 'roofing',
      sslStatus: 'missing',
      performanceScore: 5,
      predictedMonthlyLostRevenueUsd: 9500
    }, 'email');

    expect(pitch.body).toContain('I have not confirmed a current technical issue');
    expect(pitch.body).not.toMatch(/53%|35-45%|\$9,500|lost inbound calls|we ran an audit|verified quote requests/i);
    expect(pitch.recommendedRetainerUsd).toBe(0);
    expect(pitch.confidence).toBe(0);
    expect(pitch.engine).toContain('unavailable until outcomes are recorded');
  });

  it('does not report a measured objection success rate before outcomes are recorded', () => {
    const result = autonomousLearning.solveOfflineObjection('That is too expensive', 'roofing');
    expect(result.successRate).toBe(0);
  });
});
