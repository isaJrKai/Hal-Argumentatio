import { describe, it, expect } from 'vitest';
import { calculateAttributionWeights, Touchpoint } from '../../src/lib/attribution';

describe('Unit: Multi-Touch Attribution Mathematics', () => {
  const sampleTouches: Touchpoint[] = [
    { id: 't1', timestamp: '2026-08-01T10:00:00Z', channel: 'google_ads', campaign: 'Roofing_Calgary_Search' },
    { id: 't2', timestamp: '2026-08-05T14:30:00Z', channel: 'organic_seo', campaign: 'Local_Map_Pack' },
    { id: 't3', timestamp: '2026-08-10T09:15:00Z', channel: 'retargeting', campaign: 'Display_Hail_Storm' },
    { id: 't4', timestamp: '2026-08-15T16:00:00Z', channel: 'direct_call', campaign: 'Estimate_Booking' }
  ];

  it('handles zero touchpoints gracefully', () => {
    expect(calculateAttributionWeights([], 'linear', 5000)).toEqual([]);
  });

  it('allocates 100% of weight and revenue to a single touchpoint', () => {
    const single = [sampleTouches[0]];
    const result = calculateAttributionWeights(single, 'linear', 5000);
    expect(result.length).toBe(1);
    expect(result[0].weight).toBe(1.0);
    expect(result[0].allocatedRevenueUsd).toBe(5000);
  });

  it('guarantees linear attribution weights sum to exactly 1.0', () => {
    const result = calculateAttributionWeights(sampleTouches, 'linear', 10000);
    expect(result.length).toBe(4);

    const sumWeights = result.reduce((acc, t) => acc + t.weight, 0);
    expect(sumWeights).toBeCloseTo(1.0, 5);

    const sumRevenue = result.reduce((acc, t) => acc + t.allocatedRevenueUsd, 0);
    expect(sumRevenue).toBe(10000);
  });

  it('applies first-touch attribution with 100% to earliest event', () => {
    const result = calculateAttributionWeights(sampleTouches, 'first_touch', 8000);
    expect(result[0].weight).toBe(1.0);
    expect(result[0].allocatedRevenueUsd).toBe(8000);
    expect(result[1].weight).toBe(0.0);
    expect(result[2].weight).toBe(0.0);
    expect(result[3].weight).toBe(0.0);
  });

  it('applies last-touch attribution with 100% to final conversion event', () => {
    const result = calculateAttributionWeights(sampleTouches, 'last_touch', 8000);
    expect(result[0].weight).toBe(0.0);
    expect(result[1].weight).toBe(0.0);
    expect(result[2].weight).toBe(0.0);
    expect(result[3].weight).toBe(1.0);
    expect(result[3].allocatedRevenueUsd).toBe(8000);
  });

  it('applies position-based 40-40-20 attribution correctly', () => {
    const result = calculateAttributionWeights(sampleTouches, 'position_based_40_40_20', 10000);
    // 40% first, 40% last, 20% split between t2 and t3 (10% each)
    expect(result[0].weight).toBe(0.4);
    expect(result[0].allocatedRevenueUsd).toBe(4000);

    expect(result[1].weight).toBe(0.1);
    expect(result[1].allocatedRevenueUsd).toBe(1000);

    expect(result[2].weight).toBe(0.1);
    expect(result[2].allocatedRevenueUsd).toBe(1000);

    expect(result[3].weight).toBe(0.4);
    expect(result[3].allocatedRevenueUsd).toBe(4000);

    const totalWeight = result.reduce((acc, t) => acc + t.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });

  it('deduplicates duplicate touchpoints without inflating weights', () => {
    const duplicates = [...sampleTouches, { ...sampleTouches[0] }];
    const result = calculateAttributionWeights(duplicates, 'linear', 10000);
    expect(result.length).toBe(4); // Deduplicated t1
  });
});
