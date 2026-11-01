/**
 * HAL Roadmap Phase 2: Intelligence & Real Data Harvest Engine
 * 
 * Provides:
 * 1. Local Territory Harvesting & Mock Seed Purging
 * 2. Spatial Quadrant Clustering & Dispatch Latency Scoring
 * 3. Real-Time Competitor Digital Footprint Auditing & Google 3-Pack Grounding
 */

export interface CompetitorProfile {
  businessName: string;
  domain: string;
  threePackRank: number;
  googleRating: number;
  reviewCount: number;
  reviewVelocity: string;
  mobileSpeedScore: number;
  seoScore: number;
  sslStatus: 'secured' | 'missing';
  monthlyEstimatedSpend: number;
  vulnerabilityGap: string;
  attackAngle: string;
}

export interface CompetitorAuditReport {
  id: string;
  territory: string;
  niche: string;
  saturationLevel: 'LOW' | 'MEDIUM' | 'MEDIUM-HIGH' | 'HIGH';
  competitors: CompetitorProfile[];
  marketAverages: {
    avgRating: number;
    avgReviews: number;
    avgMobileSpeed: number;
    avgSeoScore: number;
    sslSecuredPct: number;
  };
  deficitMatrix: {
    reviewVolumeGaps: string;
    speedVulnerabilities: string;
    localSchemaGaps: string;
    paidSearchArbitrage: string;
  };
  tacticalActionPlan: Array<{
    step: number;
    title: string;
    action: string;
    timeframe: string;
    expectedOutcome: string;
  }>;
  auditedAt: string;
}

export interface SpatialQuadrantSummary {
  quadrant: 'NW' | 'NE' | 'CENTRAL' | 'SW' | 'SE';
  label: string;
  leadCount: number;
  avgDistanceKm: number;
  avgDispatchLatencyMins: number;
  densityIndex: number; // 0 - 100
  saturationRating: 'ACCESSIBLE' | 'BALANCED' | 'CONGESTED';
}

/**
 * Generates grounded competitor digital footprint audit data for a target market and niche.
 * Combines market heuristics and empirical benchmarks for Western Canada / North America.
 */
export function auditCompetitorFootprint(
  _city: string,
  _niche: string,
  _providedCompetitors?: string[]
): never {
  throw new Error(
    'Competitor intelligence is unavailable: no verified competitor data source is configured. Synthetic names, rankings, ratings, review counts, speed scores, spend estimates, and market claims are disabled.'
  );
}

/**
 * Geographic analytics require trusted coordinates and a real route-time provider.
 * This codebase does not currently have both, so it returns no synthetic quadrant data.
 */
export function calculateSpatialQuadrants(
  _leadsList: Array<{ id: string; latitude?: number | null; longitude?: number | null }>
): SpatialQuadrantSummary[] {
  return [];
}

/**
 * Reports only evidence the current data inputs can substantiate.
 */
export function verifyPhase2Pillars(
  leadsList: Array<{
    id: string;
    phoneEncrypted?: string | null;
    emailEncrypted?: string | null;
    phone?: string;
    email?: string;
    websiteUrl?: string | null;
    performanceScore?: number | null;
    sslStatus?: string | null;
  }>
) {
  // Pillar 1: Local Territory Harvesting
  const totalLeads = leadsList.length;
  const encryptedCount = leadsList.filter(l => !!l.phoneEncrypted || !!l.emailEncrypted).length;
  const mockCount = leadsList.filter(l => l.id.startsWith('lead_seed_')).length;
  const nonSeedRecordCount = totalLeads - mockCount;

  // Zero plaintext leak validation
  let hasPlaintextLeak = false;
  for (const lead of leadsList) {
    const plaintextPhone = Boolean(lead.phone && lead.phone !== '[ENCRYPTED]' && lead.phone.length > 4);
    const plaintextEmail = Boolean(lead.email && lead.email !== '[ENCRYPTED]' && lead.email.length > 4);
    if (plaintextPhone || plaintextEmail) {
      hasPlaintextLeak = true;
      break;
    }
  }

  const piiCheckPassed = totalLeads > 0 && !hasPlaintextLeak;
  // The current input does not include verifiable source provenance.
  const pillar1Verified = false;

  // Pillar 2: Live Geo Ranking & Latency Scoring
  const quadrants = calculateSpatialQuadrants(leadsList);
  const pillar2Verified = false;

  // Pillar 3: Competitor Digital Footprint Audits
  const pillar3Verified = false;

  const allPassed = pillar1Verified && pillar2Verified && pillar3Verified;

  return {
    allPassed,
    pillar1: {
      name: 'Local Territory Harvesting Engine',
      verified: pillar1Verified,
      status: pillar1Verified ? 'VERIFIED' : 'PENDING',
      details: `${nonSeedRecordCount} non-seed records inspected; PII check ${piiCheckPassed ? 'passed' : 'failed or has no data'}. Source provenance is not verified.`,
      metrics: {
        totalLeads,
        nonSeedRecordCount,
        mockCount,
        encryptedCount,
        plaintextLeakCheck: totalLeads === 0 ? 'NOT_ENOUGH_DATA' : hasPlaintextLeak ? 'FAILED_LEAK_DETECTED' : 'PASSED_ZERO_LEAKAGE'
      }
    },
    pillar2: {
      name: 'Live Geo Ranking & Latency Scoring',
      verified: pillar2Verified,
      status: pillar2Verified ? 'VERIFIED' : 'PENDING',
      details: 'Not verified: trusted coordinates and a route-time provider are not configured; no spatial or latency metrics are generated.',
      metrics: {
        quadrantCount: quadrants.length,
        avgLatencyMins: null,
        quadrants
      }
    },
    pillar3: {
      name: 'Competitor Digital Footprint Audits',
      verified: pillar3Verified,
      status: pillar3Verified ? 'VERIFIED' : 'PENDING',
      details: 'Not verified: no verified competitor data source is configured; rankings, ratings, reviews, speed, and spend are not generated.',
      metrics: {
        competitorsSampled: 0,
        status: 'UNAVAILABLE_NO_VERIFIED_SOURCE'
      }
    },
    auditedAt: new Date().toISOString()
  };
}
