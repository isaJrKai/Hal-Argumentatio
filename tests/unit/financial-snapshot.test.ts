import { describe, expect, it } from 'vitest';
import { buildFinancialSnapshotCore } from '../../src/lib/financialSnapshot';

describe('financial snapshot truthfulness', () => {
  it('calculates contract MRR and annualized run-rate from active projects only', () => {
    const snapshot = buildFinancialSnapshotCore([
      { status: 'active', monthlyRetainerUsd: 1200, packageTier: 'Growth', leadId: 'lead-shared' },
      { status: 'in_progress', monthlyRetainerUsd: '800', packageTier: 'Growth', leadId: 'lead-shared' },
      { status: 'completed', monthlyRetainerUsd: 5000, packageTier: 'Enterprise' },
      { status: 'cancelled', monthlyRetainerUsd: 700, packageTier: 'Dominance' }
    ]);

    expect(snapshot.currentMrrUsd).toBe(2000);
    expect(snapshot.arrUsd).toBe(24000);
    expect(snapshot.activeClientCount).toBe(1);
    expect(snapshot.tierDistribution.find(item => item.tier === 'Growth')).toEqual({
      tier: 'Growth',
      count: 2,
      totalRevenue: 2000
    });
  });

  it('does not invent CAC, LTV, churn, cash runway, projections, or historical MRR', () => {
    const snapshot = buildFinancialSnapshotCore([
      { status: 'active', monthlyRetainerUsd: 1000, packageTier: 'Growth' }
    ]);

    expect(snapshot.averageContractLengthMonths).toBeNull();
    expect(snapshot.averageLtvUsd).toBeNull();
    expect(snapshot.blendedCacUsd).toBeNull();
    expect(snapshot.ltvToCacRatio).toBeNull();
    expect(snapshot.churnRatePercent).toBeNull();
    expect(snapshot.cashRunwayMonths).toBeNull();
    expect(snapshot.projectedMrr6Months).toBeNull();
    expect(snapshot.projectedMrr12Months).toBeNull();
    expect(snapshot.mrrHistory).toEqual([]);
  });

  it('handles missing, invalid, and negative retainer values without creating revenue', () => {
    const snapshot = buildFinancialSnapshotCore([
      { id: 'project-null', status: 'active', monthlyRetainerUsd: null, packageTier: 'Growth' },
      { id: 'project-invalid', status: 'active', monthlyRetainerUsd: 'not-a-number', packageTier: 'Enterprise' },
      { id: 'project-negative', status: 'active', monthlyRetainerUsd: -500, packageTier: 'Other Tier' }
    ]);

    expect(snapshot.currentMrrUsd).toBe(0);
    expect(snapshot.arrUsd).toBe(0);
    expect(snapshot.activeClientCount).toBe(3);
    expect(snapshot.tierDistribution.find(item => item.tier === 'Other Tier')?.totalRevenue).toBe(0);
  });
});
