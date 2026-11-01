import { describe, expect, it } from 'vitest';
import { isMeasuredRating, isMeasuredScore, summarizeKnownLeadValue } from '../../src/lib/boardMetrics';

describe('board metrics use recorded evidence only', () => {
  it('sums recorded lead values without inventing values for missing leads', () => {
    expect(summarizeKnownLeadValue([
      { status: 'new', predictedLtvUsd: 1200 },
      { status: 'contacted' },
      { status: 'dead', predictedLtvUsd: 9000 },
      { status: 'converted', predictedLtvUsd: 0 }
    ])).toEqual({ totalUsd: 1200, measuredCount: 2, unmeasuredCount: 1 });
  });

  it('reports an unmeasured value when no lead has a recorded valuation', () => {
    expect(summarizeKnownLeadValue([
      { status: 'new' },
      { status: 'contacted', predictedLtvUsd: null }
    ])).toEqual({ totalUsd: 0, measuredCount: 0, unmeasuredCount: 2 });
  });

  it('accepts only finite scores in the 0–100 range', () => {
    expect(isMeasuredScore(0)).toBe(true);
    expect(isMeasuredScore(85)).toBe(true);
    expect(isMeasuredScore(undefined)).toBe(false);
    expect(isMeasuredScore(Number.NaN)).toBe(false);
    expect(isMeasuredScore(101)).toBe(false);
  });

  it('accepts only finite ratings in the 0–5 range', () => {
    expect(isMeasuredRating(0)).toBe(true);
    expect(isMeasuredRating(4.7)).toBe(true);
    expect(isMeasuredRating(undefined)).toBe(false);
    expect(isMeasuredRating(5.1)).toBe(false);
  });
});
