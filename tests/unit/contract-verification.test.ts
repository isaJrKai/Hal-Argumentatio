import { describe, it, expect } from 'vitest';
import {
  extractContractFromPerspective,
  validateSymbolicArithmetic,
  verifyStructuredContracts,
  calculateConsensusAlignment,
  ExtractedContract
} from '../../src/lib/contractVerification';

describe('Priority 2: Structured Contract Extraction & Symbolic Invariant Verification', () => {
  describe('Symbolic Dimension Validation & Arithmetic Bounds', () => {
    it('passes when proposals align within statutory tolerances', () => {
      const geminiContract: ExtractedContract = {
        model: 'gemini-2.5-flash',
        topic: 'Calgary Commercial Roofing Commercial SLA',
        intervention: {
          action: 'commercial_pricing_sla',
          targetEntity: 'Calgary Commercial Roofing',
          direction: 'maintain',
          magnitude: 2750,
          metric: 'USD/mo'
        },
        bounds: {
          minRoas: 3.8,
          budgetCeilingUsd: 5000,
          expectedLiftUsd: 1100,
          pricingMonthlyUsd: 2750,
          monthlyRetainerUsd: 2750,
          monthlyAdSpendUsd: 2200,
          terminationNoticeDays: 30,
          riskTolerance: 'LOW'
        },
        policy: {
          requireEncryption: true,
          requireConsent: true,
          requireAuditTrail: true,
          complianceGates: ['PII_ENCRYPTION_AES_256_GCM'],
          proofCitations: ['Core Web Vitals audit']
        },
        claims: [
          { premise: 'LCP latency is 3.9s', evidenceType: 'web_vitals', metricValue: '3.9s', verified: true }
        ],
        rawText: 'Propose $2,750 retainer with 30-day notice and 3.8x ROAS.'
      };

      const nemotronContract: ExtractedContract = {
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        topic: 'Calgary Commercial Roofing Commercial SLA',
        intervention: {
          action: 'commercial_pricing_sla',
          targetEntity: 'Calgary Commercial Roofing',
          direction: 'maintain',
          magnitude: 2600,
          metric: 'USD/mo'
        },
        bounds: {
          minRoas: 3.6,
          budgetCeilingUsd: 5000,
          expectedLiftUsd: 1040,
          pricingMonthlyUsd: 2600,
          monthlyRetainerUsd: 2600,
          monthlyAdSpendUsd: 2000,
          terminationNoticeDays: 30,
          riskTolerance: 'LOW'
        },
        policy: {
          requireEncryption: true,
          requireConsent: true,
          requireAuditTrail: true,
          complianceGates: ['PII_ENCRYPTION_AES_256_GCM'],
          proofCitations: ['Core Web Vitals audit']
        },
        claims: [
          { premise: 'Verified against local territory benchmarks', evidenceType: 'web_vitals', metricValue: '3.9s', verified: true }
        ],
        rawText: 'Approve $2,600 retainer with 30-day notice and 3.6x ROAS.'
      };

      const audit = validateSymbolicArithmetic(geminiContract, nemotronContract);
      expect(audit.passed).toBe(true);
      expect(audit.divergentDimensions).toHaveLength(0);
      expect(audit.maxDivergencePct).toBeLessThanOrEqual(25);

      const verification = verifyStructuredContracts(geminiContract, nemotronContract, 'Calgary Commercial Roofing Commercial SLA');
      expect(verification.verdict).toBe('CONTRACT_VERIFIED_UNANIMOUS');
      expect(verification.passedPolicy).toBe(true);
      expect(verification.boundsIntersection.pricingMonthlyUsd).toBe(2675);
      expect(verification.boundsIntersection.monthlyAdSpendUsd).toBe(2100);
      expect(verification.boundsIntersection.minRoas).toBe(3.8);
    });

    it('detects CRITICAL_INVARIANT_BREACH when ROAS or retainer diverge past threshold', () => {
      const geminiContract: ExtractedContract = {
        model: 'gemini-2.5-flash',
        topic: 'Aggressive Lead Gen',
        intervention: {
          action: 'commercial_pricing_sla',
          targetEntity: 'Test Target',
          direction: 'increase',
          magnitude: 5000,
          metric: 'USD/mo'
        },
        bounds: {
          minRoas: 2.0, // Low floor
          budgetCeilingUsd: 10000,
          expectedLiftUsd: 2000,
          monthlyRetainerUsd: 5000, // 50% higher
          monthlyAdSpendUsd: 4000,
          terminationNoticeDays: 14,
          riskTolerance: 'GUARDED'
        },
        policy: {
          requireEncryption: true,
          requireConsent: true,
          requireAuditTrail: true,
          complianceGates: [],
          proofCitations: []
        },
        claims: [],
        rawText: 'Suggest $5,000/mo retainer at 2.0x ROAS with 14-day notice'
      };

      const nemotronContract: ExtractedContract = {
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        topic: 'Aggressive Lead Gen',
        intervention: {
          action: 'commercial_pricing_sla',
          targetEntity: 'Test Target',
          direction: 'increase',
          magnitude: 2500,
          metric: 'USD/mo'
        },
        bounds: {
          minRoas: 4.5, // High floor -> delta > 15% threshold
          budgetCeilingUsd: 5000,
          expectedLiftUsd: 1000,
          monthlyRetainerUsd: 2500, // Diverges by 50%
          monthlyAdSpendUsd: 2000,
          terminationNoticeDays: 60, // Diverges by > 20%
          riskTolerance: 'LOW'
        },
        policy: {
          requireEncryption: true,
          requireConsent: true,
          requireAuditTrail: true,
          complianceGates: [],
          proofCitations: []
        },
        claims: [],
        rawText: 'Suggest $2,500/mo retainer at 4.5x ROAS with 60-day notice'
      };

      const audit = validateSymbolicArithmetic(geminiContract, nemotronContract);
      expect(audit.passed).toBe(false);
      expect(audit.divergentDimensions.length).toBeGreaterThan(0);

      const verification = verifyStructuredContracts(geminiContract, nemotronContract, 'Aggressive Lead Gen');
      expect(verification.verdict).toBe('CRITICAL_INVARIANT_BREACH');
      expect(verification.passedPolicy).toBe(false);
      const invariant07 = verification.invariantsEvaluated.find(i => i.ruleId === 'INV_07_SYMBOLIC_ARITHMETIC_CONSISTENCY');
      expect(invariant07).toBeDefined();
      expect(invariant07?.passed).toBe(false);
    });
  });

  describe('Contract Parsing & Semantic Extraction', () => {
    it('extracts monthly retainer, ad spend, and notice window from natural text', () => {
      const text = `Propose establishing a monthly retainer fee of $3,500 with dedicated ad spend of $2,000 for Google Ads. Minimum 4.2x ROAS guaranteed with 45-day written notice termination SLA.`;
      const contract = extractContractFromPerspective(text, 'gemini-2.5-flash', 'Ad Campaign SLA');

      expect(contract.bounds.monthlyRetainerUsd).toBe(3500);
      expect(contract.bounds.monthlyAdSpendUsd).toBe(2000);
      expect(contract.bounds.minRoas).toBe(4.2);
      expect(contract.bounds.terminationNoticeDays).toBe(45);
    });

    it('end-to-end consensus calculation with calculateConsensusAlignment', () => {
      const geminiText = 'Target mobile speed deficit (LCP 3.9s); establish $2,750/mo retainer and 3.5x ROAS with 30-day notice.';
      const nemotronText = 'Deterministic policy check: pricing verified at $2,600/mo, 3.8x ROAS floor, 30 days notice SLA, AES-256-GCM encryption.';

      const alignment = calculateConsensusAlignment(geminiText, nemotronText, 'HVAC Territory Expansion');
      expect(alignment.alignmentScore).toBeGreaterThanOrEqual(80);
      expect(alignment.contractVerification.symbolicArithmeticAudit.passed).toBe(true);
      expect(['CONTRACT_VERIFIED_UNANIMOUS', 'BOUNDS_SATISFIED_WITH_CONDITIONS']).toContain(alignment.verdict);
    });
  });
});
