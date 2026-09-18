import { describe, it, expect } from 'vitest';
import {
  evaluateCampaignCircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  normalizeDeliveryWebhookStatus,
  AdPerformanceTelemetryWindow
} from '../../src/lib/circuitBreaker';

describe('Priority 1: Autonomous Campaign Circuit Breaker & Telemetry', () => {
  it('triggers kill switch when rolling 48h CPL exceeds target CAC threshold', () => {
    const now = new Date();
    const adRecords = [
      {
        campaignId: 'camp-test-1',
        campaignName: 'Emergency Roof Repair',
        cost: 1800,
        conversions: 4, // CPL = $450
        clicks: 120,
        impressions: 2500,
        date: now.toISOString()
      }
    ];

    const campaignMetas = [
      {
        id: 'camp-test-1',
        name: 'Emergency Roof Repair',
        status: 'ENABLED',
        targetCacUsd: 150 // 2.5x threshold = $375, so CPL $450 triggers kill switch
      }
    ];

    const evaluation = evaluateCampaignCircuitBreaker(adRecords, campaignMetas);
    expect(evaluation.emergencyHaltsTriggered).toBe(1);
    expect(evaluation.campaignsBreached).toBe(1);
    expect(evaluation.interventions.length).toBe(1);
    expect(evaluation.interventions[0].action).toBe('PAUSE');
    expect(evaluation.interventions[0].actualCpl).toBe(450);
  });

  it('keeps campaign active when performance is within acceptable bounds', () => {
    const now = new Date();
    const adRecords = [
      {
        campaignId: 'camp-test-2',
        campaignName: 'Siding Replacement',
        cost: 1200,
        conversions: 15, // CPL = $80
        clicks: 200,
        impressions: 4000,
        date: now.toISOString()
      }
    ];

    const campaignMetas = [
      {
        id: 'camp-test-2',
        name: 'Siding Replacement',
        status: 'ENABLED',
        targetCacUsd: 100 // 2.5x threshold = $250, so CPL $80 is healthy
      }
    ];

    const evaluation = evaluateCampaignCircuitBreaker(adRecords, campaignMetas);
    expect(evaluation.emergencyHaltsTriggered).toBe(0);
    expect(evaluation.campaignsBreached).toBe(0);
    expect(evaluation.interventions.length).toBe(0);
  });

  it('normalizes delivery webhook statuses across SMS and email providers', () => {
    const delivered = normalizeDeliveryWebhookStatus('twilio', 'delivered');
    expect(delivered.normalizedEvent).toBe('delivered');
    expect(delivered.leadStatusTransition).toBe('contacted');

    const bounced = normalizeDeliveryWebhookStatus('sendgrid', 'bounce');
    expect(bounced.normalizedEvent).toBe('bounced');
    expect(bounced.leadStatusTransition).toBe('bad_data');
  });
});
