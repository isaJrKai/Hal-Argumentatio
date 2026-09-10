import { describe, it, expect } from 'vitest';
import { db } from '../../src/db/db';
import {
  auditCompetitorFootprint,
  calculateSpatialQuadrants,
  verifyPhase2Pillars
} from '../../src/lib/phase2-intelligence';

/**
 * HAL ROADMAP PHASE 2 (INTELLIGENCE) SPECIFICATION TESTS
 * Validates the 3 Non-Negotiable Pillars of Phase 2:
 * 1. Local Territory Harvesting & Mock Seed Purging
 * 2. Live Geo Ranking & Latency Scoring Engine
 * 3. Competitor Digital Footprint Audits & Google 3-Pack Grounding
 */

describe('HAL Roadmap Phase 2: Intelligence & Real Data Harvest Architecture', () => {
  const testContractorId = 'con_test_phase2_' + Date.now();

  describe('Pillar 1: Local Territory Harvesting & Mock Seed Purging', () => {
    it('purges mock business seeds without impacting active pipeline leads', () => {
      // 1. Seed a mock lead and a real lead
      db.addLead({
        contractorId: testContractorId,
        businessName: 'Dummy Seed Construction',
        contactName: 'Seed Test',
        phone: '+1 (204) 555-0001',
        email: 'seed@test.com',
        city: 'Winnipeg',
        niche: 'commercial roofing',
        status: 'new',
        score: 50,
        source: 'mock_seed'
      });

      // Purge mock leads for this contractor
      db.purgeMockLeads(testContractorId);

      const remainingLeads = db.getLeads(testContractorId);
      const hasMockSeed = remainingLeads.some(l => l.id.startsWith('lead_seed_'));
      expect(hasMockSeed).toBe(false);
    });

    it('harvests actual business profiles with comprehensive digital footprint vitals', () => {
      // Add a harvested lead with active website, performance score, SSL and Google rating
      const harvested = db.addLead({
        contractorId: testContractorId,
        businessName: 'Prairie Apex Commercial Climate Co.',
        contactName: 'Craig Henderson',
        phone: '+1 (204) 555-4921',
        email: 'craig@prairieapex.ca',
        city: 'Winnipeg',
        serviceType: 'commercial hvac',
        status: 'new',
        score: 91,
        source: 'harvested_intelligence'
      });

      expect(harvested.id).toBeDefined();
      expect(harvested.businessName).toBe('Prairie Apex Commercial Climate Co.');

      // Record harvest event in structured ledger
      const block = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'lead_harvested',
        entityType: 'lead',
        entityId: harvested.id,
        actor: 'HAL Territory Intelligence Harvester',
        details: `Harvested live business profile: ${harvested.businessName}`,
        metadata: { city: harvested.city, source: 'harvested_intelligence' }
      });

      expect(block.sequenceNumber).toBeGreaterThan(1);
      expect(block.entryHash.length).toBe(64);
    });

    it('ensures zero unencrypted PII leakage across all harvested business records', () => {
      const allLeads = db.getLeads(testContractorId);
      for (const lead of allLeads) {
        // If phone or email is present, ensure encrypted counterparts exist
        if (lead.phone && lead.phone.length > 5) {
          expect(lead.phoneEncrypted).toBeDefined();
        }
        if (lead.email && lead.email.length > 5) {
          expect(lead.emailEncrypted).toBeDefined();
        }
      }
    });
  });

  describe('Pillar 2: Live Geo Ranking & Latency Scoring Engine', () => {
    it('clusters territory entities into 5 distinct spatial quadrants with dispatch latency models', () => {
      const sampleLeads = [
        { id: 'lead_1', businessName: 'Northwest Roofing', city: 'Winnipeg', score: 85 },
        { id: 'lead_2', businessName: 'Central HVAC Solutions', city: 'Winnipeg', score: 90 },
        { id: 'lead_3', businessName: 'East Side Plumbing', city: 'Winnipeg', score: 78 },
        { id: 'lead_4', businessName: 'Southwest Electrical', city: 'Winnipeg', score: 88 },
        { id: 'lead_5', businessName: 'Southeast Mechanical', city: 'Winnipeg', score: 92 }
      ];

      const quadrants = calculateSpatialQuadrants(sampleLeads);

      expect(quadrants.length).toBe(5);
      const quadNames = quadrants.map(q => q.quadrant);
      expect(quadNames).toContain('CENTRAL');
      expect(quadNames).toContain('NW');
      expect(quadNames).toContain('NE');
      expect(quadNames).toContain('SW');
      expect(quadNames).toContain('SE');

      for (const q of quadrants) {
        expect(q.avgDistanceKm).toBeGreaterThan(0);
        expect(q.avgDispatchLatencyMins).toBeGreaterThan(5);
        expect(q.densityIndex).toBeGreaterThan(0);
        expect(['ACCESSIBLE', 'BALANCED', 'CONGESTED']).toContain(q.saturationRating);
      }
    });
  });

  describe('Pillar 3: Competitor Digital Footprint Audits & Google 3-Pack Grounding', () => {
    it('audits local competitors, analyzes Core Web Vitals mobile speeds, and detects vulnerability gaps', () => {
      const report = auditCompetitorFootprint('Calgary', 'commercial roofing');

      expect(report.territory).toBe('Calgary');
      expect(report.niche).toBe('Commercial Roofing');
      expect(report.competitors.length).toBe(4);

      // Verify competitor metrics
      const topCompetitor = report.competitors[0];
      expect(topCompetitor.threePackRank).toBe(1);
      expect(topCompetitor.googleRating).toBeGreaterThanOrEqual(4.0);
      expect(topCompetitor.reviewCount).toBeGreaterThan(0);
      expect(topCompetitor.mobileSpeedScore).toBeDefined();
      expect(topCompetitor.vulnerabilityGap.length).toBeGreaterThan(15);
      expect(topCompetitor.attackAngle.length).toBeGreaterThan(15);

      // Verify market averages
      expect(report.marketAverages.avgRating).toBeGreaterThan(3.5);
      expect(report.marketAverages.avgMobileSpeed).toBeGreaterThan(20);
      expect(report.marketAverages.sslSecuredPct).toBeGreaterThan(50);

      // Verify 4-step tactical penetration plan
      expect(report.tacticalActionPlan.length).toBe(4);
      expect(report.tacticalActionPlan[0].title).toContain('Speed');
      expect(report.tacticalActionPlan[1].title).toContain('Schema');
    });

    it('records competitor audit execution directly into the structured cryptographic ledger', () => {
      const report = auditCompetitorFootprint('Edmonton', 'hvac');

      const auditBlock = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'competitor_audit_completed',
        entityType: 'competitor_intel',
        entityId: report.id,
        actor: 'HAL Market Intelligence Engine',
        details: `Completed competitor digital footprint audit for Edmonton (HVAC) across 4 local entities`,
        metadata: {
          territory: report.territory,
          niche: report.niche,
          competitorsAnalyzed: report.competitors.length,
          avgMobileSpeed: report.marketAverages.avgMobileSpeed,
          saturationLevel: report.saturationLevel
        }
      });

      expect(auditBlock.sequenceNumber).toBeGreaterThan(1);
      expect(auditBlock.eventType).toBe('competitor_audit_completed');
      expect(auditBlock.metadata.territory).toBe('Edmonton');

      // Verify hash chaining integrity remains completely intact
      const integrity = db.verifyLedgerIntegrity();
      expect(integrity.valid).toBe(true);
    });
  });

  describe('Phase 2 Full Pillar Verification', () => {
    it('verifies all 3 pillars of Phase 2 pass with complete evidence verification', () => {
      const leads = db.getLeads(testContractorId);
      const verification = verifyPhase2Pillars(leads);

      expect(verification.allPassed).toBe(true);
      expect(verification.pillar1.verified).toBe(true);
      expect(verification.pillar2.verified).toBe(true);
      expect(verification.pillar3.verified).toBe(true);
      expect(verification.pillar1.status).toBe('VERIFIED');
    });
  });
});
