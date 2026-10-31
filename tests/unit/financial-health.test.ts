import { describe, expect, it } from 'vitest';
import { buildFinancialHealthReport } from '../../src/lib/financialHealth';

describe('MCP financial health report', () => {
  it('uses Google Ads conversion value for platform ROAS and keeps recorded revenue separate', () => {
    const report = buildFinancialHealthReport([
      { campaignId: 'c1', campaignName: 'Search', cost: 100, conversions: 4, conversionValue: 500 },
      { campaignId: 'c1', campaignName: 'Search', cost: 50, conversions: 2, conversionValue: 200 },
      { campaignId: 'c2', campaignName: 'Display', cost: 50, conversions: 1, conversionValue: 0 }
    ], [
      { amountUsd: 900 },
      { amountUsd: 100 }
    ], [
      { status: 'converted' }
    ]);

    expect(report.totalAdSpendUsd).toBe(200);
    expect(report.googleAdsReportedConversionValueUsd).toBe(700);
    expect(report.recordedRevenueUsd).toBe(1000);
    expect(report.googleAdsReportedRoas).toBe(3.5);
    expect(report.campaignBreakdown.find(item => item.campaignId === 'c1')).toMatchObject({
      spend: 150,
      revenue: 700,
      googleAdsReportedRoas: Number((700 / 150).toFixed(2)),
      conversionsCount: 6,
      wonDealsCount: null
    });
  });

  it('does not invent LTV, CAC, payback, attribution health, or zero-spend ROAS', () => {
    const report = buildFinancialHealthReport([], [], []);
    expect(report.googleAdsReportedRoas).toBeNull();
    expect(report.costPerLeadUsd).toBeNull();
    expect(report.costPerAcquisitionUsd).toBeNull();
    expect(report.customerLifetimeValueUsd).toBeNull();
    expect(report.paybackPeriodMonths).toBeNull();
    expect(report.attributionHealthScore).toBeNull();
    expect(report.campaignBreakdown).toEqual([]);
  });
});
