/**
 * HAL Autonomous Campaign Circuit Breaker & Real-Time Telemetry Engine
 * 
 * Enforces:
 * 1. Rolling 48-hour CPL vs. Target CAC threshold evaluation.
 * 2. Automated emergency kill switches (throttling or pausing runaway spend).
 * 3. Audit ledger event emission for all automated interventions.
 * 4. Webhook status delivery transitions (sent, delivered, opened, bounced, responded).
 */

export interface CircuitBreakerConfig {
  cplThresholdPct: number; // e.g. 0.35 (35% over target CAC)
  minSpendForTriggerUsd: number; // Minimum 48h spend before trigger is eligible ($100 default)
  rollingWindowHours: number; // Rolling lookback window (default 48 hours)
  consecutiveBreachesAllowed: number; // default 1 (immediate kill switch)
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  cplThresholdPct: 0.35, // 35% breach triggers automatic pause/throttle
  minSpendForTriggerUsd: 100,
  rollingWindowHours: 48,
  consecutiveBreachesAllowed: 1
};

export interface CampaignTelemetrySnapshot {
  campaignId: string;
  campaignName: string;
  rollingSpend: number;
  rollingConversions: number;
  rollingImpressions: number;
  rollingClicks: number;
  actualCpl: number;
  targetCac: number;
  cplVariancePct: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'BREACHED' | 'THROTTLED' | 'HALTED';
  recommendedAction: 'NONE' | 'THROTTLE_BID_25' | 'EMERGENCY_KILL_SWITCH';
  reason: string;
}

export interface CircuitBreakerEvaluationResult {
  contractorId: string;
  evaluatedAt: string;
  campaignsEvaluated: number;
  campaignsBreached: number;
  emergencyHaltsTriggered: number;
  snapshots: CampaignTelemetrySnapshot[];
  interventions: {
    campaignId: string;
    action: 'PAUSE' | 'THROTTLE';
    previousStatus: string;
    newStatus: string;
    actualCpl: number;
    targetCac: number;
    reason: string;
  }[];
}

/**
 * Computes live telemetry and checks whether any campaign has breached the safety threshold.
 */
export function evaluateCampaignCircuitBreaker(
  adRecords: {
    campaignId: string;
    campaignName: string;
    cost: number;
    conversions: number;
    clicks: number;
    impressions: number;
    date: Date | string;
  }[],
  campaignMetas: {
    id: string;
    name: string;
    status: string;
    budgetUsd?: number;
    targetCacUsd?: number;
  }[],
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG,
  targetCacFallbackUsd: number = 75
): CircuitBreakerEvaluationResult {
  const now = Date.now();
  const windowMillis = config.rollingWindowHours * 60 * 60 * 1000;
  const cutoffTime = now - windowMillis;

  // Filter ad records within the rolling window
  const recentRecords = adRecords.filter(r => {
    const d = new Date(r.date).getTime();
    return !isNaN(d) && d >= cutoffTime;
  });

  // Aggregate by campaign
  const campaignAgg: Record<string, {
    campaignName: string;
    spend: number;
    conversions: number;
    clicks: number;
    impressions: number;
  }> = {};

  for (const record of recentRecords) {
    const cId = record.campaignId || 'camp_default';
    if (!campaignAgg[cId]) {
      campaignAgg[cId] = {
        campaignName: record.campaignName || 'Active Campaign',
        spend: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0
      };
    }
    campaignAgg[cId].spend += Number(record.cost) || 0;
    campaignAgg[cId].conversions += Number(record.conversions) || 0;
    campaignAgg[cId].clicks += Number(record.clicks) || 0;
    campaignAgg[cId].impressions += Number(record.impressions) || 0;
  }

  const snapshots: CampaignTelemetrySnapshot[] = [];
  const interventions: CircuitBreakerEvaluationResult['interventions'] = [];

  const metaMap = new Map(campaignMetas.map(m => [m.id, m]));

  for (const [campaignId, agg] of Object.entries(campaignAgg)) {
    const meta = metaMap.get(campaignId);
    const currentStatus = meta?.status || 'active';
    const targetCac = meta?.targetCacUsd && meta.targetCacUsd > 0 ? meta.targetCacUsd : targetCacFallbackUsd;

    // Actual CPL: if zero conversions, and spend > 0, CPL is effectively the full spend
    const actualCpl = agg.conversions > 0 
      ? agg.spend / agg.conversions 
      : agg.spend;

    const cplVariancePct = targetCac > 0 
      ? (actualCpl - targetCac) / targetCac 
      : 0;

    let status: CampaignTelemetrySnapshot['status'] = 'OPTIMAL';
    let recommendedAction: CampaignTelemetrySnapshot['recommendedAction'] = 'NONE';
    let reason = 'Cost per lead within safe boundaries.';

    // Check conditions
    if (agg.spend >= config.minSpendForTriggerUsd) {
      if (cplVariancePct >= config.cplThresholdPct) {
        // Severe breach (e.g. > 35% higher than target CAC)
        status = 'BREACHED';
        recommendedAction = 'EMERGENCY_KILL_SWITCH';
        reason = `CRITICAL CPL SPIKE: 48h Actual CPL ($${actualCpl.toFixed(2)}) exceeds target CAC ($${targetCac.toFixed(2)}) by ${(cplVariancePct * 100).toFixed(1)}% (Threshold: ${(config.cplThresholdPct * 100).toFixed(0)}%).`;
        
        if (currentStatus !== 'paused' && currentStatus !== 'halted') {
          interventions.push({
            campaignId,
            action: 'PAUSE',
            previousStatus: currentStatus,
            newStatus: 'halted_circuit_breaker',
            actualCpl: Math.round(actualCpl * 100) / 100,
            targetCac: Math.round(targetCac * 100) / 100,
            reason
          });
        }
      } else if (cplVariancePct > 0.15) {
        // Warning zone (15% to 35% above target CAC)
        status = 'ELEVATED';
        recommendedAction = 'THROTTLE_BID_25';
        reason = `Elevated CPL warning: 48h Actual CPL ($${actualCpl.toFixed(2)}) is ${(cplVariancePct * 100).toFixed(1)}% above target CAC. Recommend reducing aggressive target bids.`;
      }
    } else {
      reason = `Spend ($${agg.spend.toFixed(2)}) under minimum statistical threshold ($${config.minSpendForTriggerUsd}) for auto-kill trigger.`;
    }

    snapshots.push({
      campaignId,
      campaignName: agg.campaignName,
      rollingSpend: Math.round(agg.spend * 100) / 100,
      rollingConversions: Math.round(agg.conversions * 10) / 10,
      rollingImpressions: agg.impressions,
      rollingClicks: agg.clicks,
      actualCpl: Math.round(actualCpl * 100) / 100,
      targetCac: Math.round(targetCac * 100) / 100,
      cplVariancePct: Math.round(cplVariancePct * 1000) / 10,
      status,
      recommendedAction,
      reason
    });
  }

  return {
    contractorId: '',
    evaluatedAt: new Date().toISOString(),
    campaignsEvaluated: Object.keys(campaignAgg).length,
    campaignsBreached: snapshots.filter(s => s.status === 'BREACHED').length,
    emergencyHaltsTriggered: interventions.filter(i => i.action === 'PAUSE').length,
    snapshots,
    interventions
  };
}

/**
 * Validates and maps external delivery webhook statuses (e.g. Twilio, SendGrid, Resend)
 * to HAL internal lead lifecycle states.
 */
export type NormalizedDeliveryEvent = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'responded';

export function normalizeDeliveryWebhookStatus(
  provider: 'twilio' | 'sendgrid' | 'resend' | 'generic',
  rawStatus: string
): {
  normalizedEvent: NormalizedDeliveryEvent;
  leadStatusTransition?: 'contacted' | 'bad_data' | 'qualified' | 'lost';
  isTerminalFailure: boolean;
  notes: string;
} {
  const status = (rawStatus || '').toLowerCase().trim();

  if (['delivered', 'successful', 'success'].includes(status)) {
    return {
      normalizedEvent: 'delivered',
      leadStatusTransition: 'contacted',
      isTerminalFailure: false,
      notes: 'Outreach payload verified delivered to carrier/inbox.'
    };
  }

  if (['bounced', 'bounce', 'failed', 'undelivered', 'rejected', 'drop', 'dropped', 'hard_bounce'].includes(status)) {
    return {
      normalizedEvent: 'bounced',
      leadStatusTransition: 'bad_data',
      isTerminalFailure: true,
      notes: 'Delivery failed or bounced by recipient mail transfer agent / SMS carrier.'
    };
  }

  if (['opened', 'open'].includes(status)) {
    return {
      normalizedEvent: 'opened',
      isTerminalFailure: false,
      notes: 'Prospect viewed message payload.'
    };
  }

  if (['clicked', 'click'].includes(status)) {
    return {
      normalizedEvent: 'clicked',
      isTerminalFailure: false,
      notes: 'Prospect engaged with audit report or scheduling link.'
    };
  }

  if (['replied', 'response', 'inbound', 'responded'].includes(status)) {
    return {
      normalizedEvent: 'responded',
      leadStatusTransition: 'qualified',
      isTerminalFailure: false,
      notes: 'Prospect responded actively to outreach sequence.'
    };
  }

  return {
    normalizedEvent: 'sent',
    isTerminalFailure: false,
    notes: `Message processed with status: ${status}`
  };
}
