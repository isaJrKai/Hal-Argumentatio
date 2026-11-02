export interface CampaignDailyRecord {
  campaignName: string;
  date: Date | string;
  cost: number | string;
  clicks: number | string;
  conversions: number | string;
}

interface CampaignTotals {
  spend: number;
  clicks: number;
  conversions: number;
}

export function analyzeCampaignPerformance(records: CampaignDailyRecord[], thresholdDropPct = 20) {
  const valid = records.map(record => ({
    ...record,
    dateValue: new Date(record.date).getTime(),
    costValue: Number(record.cost) || 0,
    clickValue: Number(record.clicks) || 0,
    conversionValue: Number(record.conversions) || 0
  })).filter(record => Number.isFinite(record.dateValue));

  if (!valid.length) return { anomalies: [], screeningSignals: [], window: null };

  const anchor = Math.max(...valid.map(record => record.dateValue));
  const currentStart = anchor - 30 * 86400000;
  const previousStart = anchor - 60 * 86400000;
  const current: Record<string, CampaignTotals> = {};
  const previous: Record<string, CampaignTotals> = {};

  const add = (bucket: Record<string, CampaignTotals>, record: typeof valid[number]) => {
    const totals = bucket[record.campaignName] ||= { spend: 0, clicks: 0, conversions: 0 };
    totals.spend += record.costValue;
    totals.clicks += record.clickValue;
    totals.conversions += record.conversionValue;
  };

  for (const record of valid) {
    if (record.dateValue > currentStart && record.dateValue <= anchor) add(current, record);
    else if (record.dateValue > previousStart && record.dateValue <= currentStart) add(previous, record);
  }

  const anomalies: Array<Record<string, any>> = [];
  const screeningSignals: Array<Record<string, any>> = [];
  const names = new Set([...Object.keys(current), ...Object.keys(previous)]);

  for (const campaignName of names) {
    const now = current[campaignName] || { spend: 0, clicks: 0, conversions: 0 };
    const before = previous[campaignName] || { spend: 0, clicks: 0, conversions: 0 };
    if (now.spend > 500 && now.conversions === 0) {
      screeningSignals.push({
        campaignName,
        signal: 'spend_without_recorded_conversions',
        currentSpend: now.spend,
        currentClicks: now.clicks,
        currentConversions: now.conversions,
        interpretation: 'Screening signal only. Check attribution and conversion tracking; this is not proof of a tracking fault.'
      });
    }

    if (before.clicks <= 0 || before.conversions <= 0 || now.clicks <= 0) continue;
    const previousRate = before.conversions / before.clicks;
    const currentRate = now.conversions / now.clicks;
    const rateDeltaPct = ((currentRate - previousRate) / previousRate) * 100;
    if (Number.isFinite(rateDeltaPct) && rateDeltaPct <= -Math.abs(thresholdDropPct)) {
      anomalies.push({
        campaignName,
        metric: 'conversion_rate',
        previousValue: previousRate,
        currentValue: currentRate,
        percentageDelta: rateDeltaPct,
        thresholdDropPct: Math.abs(thresholdDropPct),
        currentSpend: now.spend,
        currentClicks: now.clicks,
        currentConversions: now.conversions,
        previousSpend: before.spend,
        previousClicks: before.clicks,
        previousConversions: before.conversions
      });
    }

    if (before.conversions > 0 && now.conversions > 0) {
      const previousCpa = before.spend / before.conversions;
      const currentCpa = now.spend / now.conversions;
      const cpaDeltaPct = previousCpa > 0 ? ((currentCpa - previousCpa) / previousCpa) * 100 : 0;
      if (Number.isFinite(cpaDeltaPct) && cpaDeltaPct >= Math.abs(thresholdDropPct)) {
        anomalies.push({
          campaignName,
          metric: 'cost_per_conversion',
          previousValue: previousCpa,
          currentValue: currentCpa,
          percentageDelta: cpaDeltaPct,
          thresholdDropPct: Math.abs(thresholdDropPct),
          currentSpend: now.spend,
          currentConversions: now.conversions,
          previousSpend: before.spend,
          previousConversions: before.conversions
        });
      }
    }
  }

  return {
    anomalies,
    screeningSignals,
    window: {
      previousStart: new Date(previousStart).toISOString(),
      currentStart: new Date(currentStart).toISOString(),
      end: new Date(anchor).toISOString()
    }
  };
}
