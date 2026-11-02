import { describe, expect, it } from 'vitest';
import { getRevenueAmountUsd } from '../../src/lib/revenueAmounts';

describe('revenue record amount contract', () => {
  it('reads the canonical amountUsd field used by PostgreSQL records', () => {
    expect(getRevenueAmountUsd({ amountUsd: 1250 })).toBe(1250);
  });

  it('does not treat a missing, non-finite or negative amount as revenue', () => {
    expect(getRevenueAmountUsd({})).toBe(0);
    expect(getRevenueAmountUsd({ amountUsd: Number.NaN })).toBe(0);
    expect(getRevenueAmountUsd({ amountUsd: -10 })).toBe(0);
    expect(getRevenueAmountUsd(null)).toBe(0);
  });
});
