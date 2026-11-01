export interface AdsPerformanceInput {
  campaignId?: string | null;
  campaignName: string;
  cost?: number | string | null;
  conversions?: number | string | null;
  conversionValue?: number | string | null;
}

export interface RecordedRevenueInput {
  amountUsd?: number | string | null;
}

export interface LeadLifecycleInput {
  status?: string | null;
}

function amount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Build the MCP financial-health response using only fields with a clear
 * provenance. Google Ads conversion value is kept separate from recorded
 * revenue. CAC, LTV, payback, and attribution quality remain unavailable
 * because the current schema cannot reliably join those measurements.
 */
export function buildFinancialHealthReport(
  adsRecords: readonly AdsPerformanceInput[],
  revenueRecords: readonly RecordedRevenueInput[],
  _leads: readonly LeadLifecycleInput[]
) {
  const totalAdSpendUsd = adsRecords.reduce((sum, record) => sum + amount(record.cost), 0);
  const googleAdsReportedConversionValueUsd = adsRecords.reduce(
    (sum, record) => sum + amount(record.conversionValue),
    0
  );
  const recordedRevenueUsd = revenueRecords.reduce((sum, record) => sum + amount(record.amountUsd), 0);

  const campaignMap = new Map<string, {
    campaignId: string;
    campaignName: string;
    spend: number;
    conversions: number;
    conversionValue: number;
  }>();

  for (const record of adsRecords) {
    const campaignName = record.campaignName || 'Unclassified campaign';
    const campaignId = record.campaignId || campaignName.toLowerCase().replace(/\s+/g, '_');
    const current = campaignMap.get(campaignId) || {
      campaignId,
      campaignName,
      spend: 0,
      conversions: 0,
      conversionValue: 0
    };
    current.spend += amount(record.cost);
    current.conversions += amount(record.conversions);
    current.conversionValue += amount(record.conversionValue);
    campaignMap.set(campaignId, current);
  }

  const campaignBreakdown = Array.from(campaignMap.values()).map(campaign => ({
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    spend: Number(campaign.spend.toFixed(2)),
    revenue: Number(campaign.conversionValue.toFixed(2)),
    googleAdsReportedRoas: campaign.spend > 0
      ? Number((campaign.conversionValue / campaign.spend).toFixed(2))
      : null,
    conversionsCount: Number(campaign.conversions.toFixed(2)),
    wonDealsCount: null
  }));

  return {
    totalAdSpendUsd: Number(totalAdSpendUsd.toFixed(2)),
    googleAdsReportedConversionValueUsd: Number(googleAdsReportedConversionValueUsd.toFixed(2)),
    recordedRevenueUsd: Number(recordedRevenueUsd.toFixed(2)),
    googleAdsReportedRoas: totalAdSpendUsd > 0
      ? Number((googleAdsReportedConversionValueUsd / totalAdSpendUsd).toFixed(2))
      : null,
    costPerLeadUsd: null,
    costPerAcquisitionUsd: null,
    customerLifetimeValueUsd: null,
    paybackPeriodMonths: null,
    attributionHealthScore: null,
    campaignBreakdown,
    dataQuality: {
      googleAdsConversionValue: 'Platform-reported conversion value; it is not verified collected revenue.',
      recordedRevenue: 'Recorded revenue is shown separately because the current schema does not link it to ad campaigns.',
      costPerLead: 'Unavailable: ad conversions are not yet verified as unique leads.',
      costPerAcquisition: 'Unavailable: won customers cannot yet be attributed to individual campaigns.',
      lifetimeValue: 'Unavailable: historical contract duration and customer-level revenue cohorts are not available.',
      payback: 'Unavailable: reliable acquisition cost and lifetime value are not both available.',
      attributionHealth: 'Unavailable: no validated attribution-completeness scoring model exists.'
    }
  };
}
