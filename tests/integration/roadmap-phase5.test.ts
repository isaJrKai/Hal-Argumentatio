import { describe, it, expect } from 'vitest';
import { db } from '../../src/db/db';
import {
  getDefaultOrganizationNodes,
  getDefaultEdgeRegions,
  getDefaultBusinessOntologies,
  evaluateBrainSynchronization,
  verifyPhase5Pillars
} from '../../src/lib/phase5-enterprise';

/**
 * HAL ROADMAP PHASE 5 (GLOBAL ENTERPRISE & 11-LAYER BRAIN) INTEGRATION TESTS
 * Validates the core enterprise architectural pillars:
 * 1. Hierarchical Multi-Org Management & Dynamic RBAC (isolated SHA-256 tenant vault keys)
 * 2. Decentralized Edge Federation & Multi-Region Resilience (< 100ms latency, healthy sync)
 * 3. Cross-Industry Knowledge Transfer & Business Ontology (zero-PII Bayesian priors)
 * 4. 11-Layer Brain Synchronization (HAL Constitution & Intentionality Directive v1.0)
 * 5. Cryptographic SHA-256 Ledger Audit Trail
 */

describe('HAL Roadmap Phase 5: Global Enterprise & 11-Layer Brain Architecture', () => {
  const testContractorId = 'con_test_phase5_' + Date.now();

  describe('Pillar 1: Hierarchical Multi-Org Management & Isolated Vault Keys', () => {
    it('manages hierarchical organization entities with distinct SHA-256 tenant vault keys', () => {
      const orgs = getDefaultOrganizationNodes();
      expect(orgs.length).toBeGreaterThanOrEqual(3);

      const holdingCo = orgs.find(o => o.type === 'holding_co');
      expect(holdingCo).toBeDefined();

      const subsidiaries = orgs.filter(o => o.type === 'subsidiary' || o.type === 'territory_unit');
      expect(subsidiaries.length).toBeGreaterThanOrEqual(2);

      // Verify every org has a non-empty 64-character SHA-256 isolated vault key hash
      orgs.forEach(org => {
        expect(org.vaultKeyHash).toHaveLength(64);
        expect(/^[a-f0-9]{64}$/.test(org.vaultKeyHash)).toBe(true);
      });

      // Verify tenant isolation: no duplicate vault keys across entities
      const keys = orgs.map(o => o.vaultKeyHash);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(orgs.length);
    });
  });

  describe('Pillar 2: Decentralized Edge Federation & Multi-Region Mesh', () => {
    it('verifies healthy edge nodes across North America and Europe with < 100ms latency', () => {
      const regions = getDefaultEdgeRegions();
      expect(regions.length).toBeGreaterThanOrEqual(2);

      const healthyRegions = regions.filter(r => r.syncStatus === 'HEALTHY');
      expect(healthyRegions.length).toBeGreaterThanOrEqual(2);

      // Latencies must be strictly sub-100ms
      healthyRegions.forEach(r => {
        expect(r.latencyMs).toBeLessThan(100);
        expect(r.latencyMs).toBeGreaterThan(0);
        expect(r.endpoint).toMatch(/^https:\/\//);
      });
    });

    it('records edge federation events on the immutable ledger', () => {
      const regions = getDefaultEdgeRegions();

      const block = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'phase5_regions_federated',
        entityType: 'edge_telemetry',
        entityId: 'global_edge_federation',
        actor: 'HAL Distributed Edge Router',
        details: `Federated ${regions.length} global edge nodes with latency under 85ms and zero-trust replication.`,
        metadata: {
          regions: regions.map(r => r.name),
          healthyCount: regions.filter(r => r.syncStatus === 'HEALTHY').length
        }
      });

      expect(block.sequenceNumber).toBeGreaterThan(0);
      expect(block.entryHash).toHaveLength(64);
      expect(db.verifyLedgerIntegrity(testContractorId).valid).toBe(true);
    });
  });

  describe('Pillar 3: Cross-Industry Knowledge Transfer & Business Ontology', () => {
    it('shares calibrated Bayesian priors across distinct trade verticals with zero PII leakage', () => {
      const ontologies = getDefaultBusinessOntologies();
      expect(ontologies.length).toBeGreaterThanOrEqual(3);

      const verticals = ontologies.map(o => o.vertical.toLowerCase());
      expect(verticals.some(v => v.includes('hvac'))).toBe(true);
      expect(verticals.some(v => v.includes('roofing'))).toBe(true);
      expect(verticals.some(v => v.includes('electrical'))).toBe(true);

      ontologies.forEach(onto => {
        // Privacy invariant: zero PII leakage guarantee
        expect(onto.privacyGuaranteed).toBe(true);
        expect(onto.verifiedConversionRate).toBeGreaterThan(0.05);
        expect(onto.optimalPriceFloorUsd).toBeGreaterThan(1500);

        // Bayesian priors validation
        expect(onto.bayesianUrgencyPrior.missingSslWeight).toBeGreaterThan(0);
        expect(onto.bayesianUrgencyPrior.slowSpeedWeight).toBeGreaterThan(0);
        expect(onto.bayesianUrgencyPrior.phoneFirstMultiplier).toBeGreaterThan(1.0);
      });
    });
  });

  describe('Pillar 4: 11-Layer Brain Synchronization & Intentionality Directive', () => {
    it('evaluates all 11 cognitive layers and verifies alignment with the HAL Constitution', () => {
      const layers = evaluateBrainSynchronization();
      expect(layers.length).toBe(11);

      // Verify canonical cognitive progression:
      // Mission -> Goals -> Planner -> Memory -> Knowledge -> World Model -> Agents -> Skills -> Tools -> Execution -> Learning
      const expectedLayers = [
        '1. Mission',
        '2. Goals',
        '3. Planner',
        '4. Memory',
        '5. Knowledge',
        '6. World Model',
        '7. Agents',
        '8. Skills',
        '9. Tools',
        '10. Execution',
        '11. Learning'
      ];

      layers.forEach((layer, idx) => {
        expect(layer.layer).toBe(expectedLayers[idx]);
        expect(layer.synchronizationStatus).toBe('LOCKED_IN_PHASE');
        expect(layer.deterministicIntegrity).toBe(100);
        expect(layer.juniorColleagueDeskEquivalent).toBeDefined();
        expect(layer.instrumentVsWorkflowPrinciple).toBeDefined();
      });
    });

    it('embodies the "Constrain the tools, not the behavior" and "Junior Colleague" principles', () => {
      const layers = evaluateBrainSynchronization();

      const plannerLayer = layers.find(l => l.layer.includes('Planner'));
      expect(plannerLayer).toBeDefined();
      expect(plannerLayer?.instrumentVsWorkflowPrinciple).toContain('No hardcoded workflows');

      const toolsLayer = layers.find(l => l.layer.includes('Tools'));
      expect(toolsLayer).toBeDefined();
      expect(toolsLayer?.instrumentVsWorkflowPrinciple).toContain('Constrain the tools, not the behavior');

      const learningLayer = layers.find(l => l.layer.includes('Learning'));
      expect(learningLayer).toBeDefined();
      expect(learningLayer?.juniorColleagueDeskEquivalent).toContain('The Apprenticeship Loop');
    });

    it('passes overall Phase 5 pillar verification with a 100% score', () => {
      const orgs = getDefaultOrganizationNodes();
      const regions = getDefaultEdgeRegions();
      const ontologies = getDefaultBusinessOntologies();

      const verification = verifyPhase5Pillars(orgs, regions, ontologies);

      expect(verification.allPassed).toBe(true);
      expect(verification.totalScore).toBe(100);
      expect(verification.pillar1.passed).toBe(true);
      expect(verification.pillar2.passed).toBe(true);
      expect(verification.pillar3.passed).toBe(true);
      expect(verification.brainSync.synced).toBe(true);
      expect(verification.brainSync.overallIntegrityScore).toBe(100);
    });
  });
});
