import { describe, expect, it } from 'vitest';
import { analyzeCampaignPerformance } from '../../src/lib/campaignAnomaly';

describe('evidence-based campaign comparison', () => {
  it('compares adjacent observed 30-day windows rather than inventing a baseline', () => {
    const result = analyzeCampaignPerformance([
      { campaignName: 'North', date: '2026-09-10T00:00:00.000Z', cost: 200, clicks: 100, conversions: 10 },
      { campaignName: 'North', date: '2026-10-10T00:00:00.000Z', cost: 250, clicks: 100, conversions: 5 }
    ], 20);

    expect(result.anomalies).toHaveLength(2);
    expect(result.anomalies.map(item => item.metric)).toEqual(['conversion_rate', 'cost_per_conversion']);
    expect(result.anomalies[0].percentageDelta).toBe(-50);
    expect(result.anomalies[1].percentageDelta).toBe(150);
    expect(result.window).not.toBeNull();
  });

  it('returns a screening signal without inventing a comparison when no prior conversions exist', () => {
    const result = analyzeCampaignPerformance([
      { campaignName: 'East', date: '2026-10-10T00:00:00.000Z', cost: 650, clicks: 120, conversions: 0 }
    ]);

    expect(result.anomalies).toHaveLength(0);
    expect(result.screeningSignals).toHaveLength(1);
    expect(result.screeningSignals[0].signal).toBe('spend_without_recorded_conversions');
    expect(result.screeningSignals[0].interpretation).toContain('not proof');
  });

  it('returns an empty result when no campaign rows are recorded', () => {
    expect(analyzeCampaignPerformance([])).toEqual({ anomalies: [], screeningSignals: [], window: null });
  });
});
