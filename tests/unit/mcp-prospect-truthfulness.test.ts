import { describe, expect, it } from 'vitest';
import { sanitizeProspect } from '../../src/services/mcp/halMcpServer';

describe('MCP prospect evidence truthfulness', () => {
  it('does not expose schema defaults as measured lead intelligence', () => {
    const prospect = sanitizeProspect({
      id: 'lead_test',
      businessName: 'Example Contractor',
      email: 'owner@example.com',
      phone: '+14165550123',
      city: 'Toronto',
      niche: 'Plumbing',
      status: 'new',
      source: 'territory_harvest',
      sourceType: 'live_harvest',
      verificationStatus: 'UNVERIFIED_STAGING',
      reviewCount: 0,
      reviewScore: 0,
      predictedMonthlyLostRevenueUsd: 0,
      performanceScore: 50,
      sslStatus: 'secured',
      mobileFriendly: true,
      urgencyScore: 5,
      predictedLtv: 5000,
      seoScore: 50,
      googleRating: 0,
      sentimentScore: 5,
    });

    expect(prospect.sourceType).toBe('unknown');
    expect(prospect.email).toBeNull();
    expect(prospect.phone).toBeNull();
    expect(prospect.contactDetailsRedacted).toBe(true);
    expect(prospect.verificationStatus).toBe('UNVERIFIED_STAGING');
    expect(prospect.reviewCount).toBeNull();
    expect(prospect.reviewScore).toBeNull();
    expect(prospect.predictedMonthlyLostRevenueUsd).toBeNull();
    expect(prospect.performanceScore).toBeNull();
    expect(prospect.sslStatus).toBeNull();
    expect(prospect.mobileFriendly).toBeNull();
    expect(prospect.urgencyScore).toBeNull();
    expect(prospect.predictedLtv).toBeNull();
    expect(prospect.seoScore).toBeNull();
    expect(prospect.googleRating).toBeNull();
    expect(prospect.sentimentScore).toBeNull();
  });

  it('retains source type only when external provenance exists', () => {
    const prospect = sanitizeProspect({
      id: 'lead_external',
      businessName: 'Imported Contractor',
      city: 'Toronto',
      niche: 'Roofing',
      status: 'new',
      sourceType: 'google_ads',
      externalSource: 'google_ads',
    });

    expect(prospect.sourceType).toBe('google_ads');
  });
});
