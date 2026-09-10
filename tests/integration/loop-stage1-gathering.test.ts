import { describe, it, expect } from 'vitest';
import { validateLoopGate, HAL_LOOP_STAGES } from '../../src/lib/loopGating';
import { db, encrypt, decrypt } from '../../src/db/db';

describe('Integration: HAL Operating Loop Stage 1 (Gathering) Engine', () => {
  const testContractorId = 'test_stage1_contractor_' + Date.now();

  it('verifies that Stage 1 is canonically the initial stage of the 10-stage pipeline', () => {
    expect(HAL_LOOP_STAGES[0]).toBe('gathering');
    expect(HAL_LOOP_STAGES[1]).toBe('analyzing');
  });

  describe('Stage 1 Evidence Gate Enforcement', () => {
    it('blocks advancing to Stage 2 (analyzing) when stateSnapshot has zero verified records', () => {
      const blockedResult = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'analyzing',
        status: 'active',
        stateSnapshot: {
          recordsCount: 0,
          evidenceVerified: false
        }
      });

      expect(blockedResult.passed).toBe(false);
      expect(blockedResult.blockedReason).toContain('Evidence Gate Blocked');
      expect(blockedResult.requiredEvidence).toBe('verified_dataset_records > 0');
    });

    it('blocks advancing when stateSnapshot is completely empty or undefined', () => {
      const blockedResult = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'analyzing',
        status: 'active'
      });

      expect(blockedResult.passed).toBe(false);
      expect(blockedResult.blockedReason).toContain('zero verified records');
    });

    it('clears the Evidence Gate when verified territory records are present', () => {
      const clearedResult = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'analyzing',
        status: 'active',
        stateSnapshot: {
          recordsCount: 4,
          gatheredRecords: 4,
          evidenceVerified: true,
          completenessScore: 95,
          territory: 'Winnipeg',
          niche: 'Commercial HVAC'
        }
      });

      expect(clearedResult.passed).toBe(true);
      expect(clearedResult.blockedReason).toBeUndefined();
    });

    it('strictly forbids skipping Stage 2 (non-sequential transition directly from gathering to planning)', () => {
      const skipResult = validateLoopGate({
        currentStage: 'gathering',
        nextStage: 'planning',
        status: 'active',
        stateSnapshot: {
          recordsCount: 20,
          evidenceVerified: true
        }
      });

      expect(skipResult.passed).toBe(false);
      expect(skipResult.blockedReason).toContain('Non-sequential stage jump blocked');
    });
  });

  describe('Stage 1 PII Cryptographic Guard & Vault Handling', () => {
    it('guarantees that harvested prospect contact points are encrypted via AES-256-GCM', () => {
      const plainPhone = '204-555-0188';
      const plainEmail = 'ops@winnipeghvacpro.ca';

      const phoneCipher = encrypt(plainPhone);
      const emailCipher = encrypt(plainEmail);

      expect(phoneCipher).not.toBe(plainPhone);
      expect(emailCipher).not.toBe(plainEmail);

      // Decrypt round-trip
      expect(decrypt(phoneCipher)).toBe(plainPhone);
      expect(decrypt(emailCipher)).toBe(plainEmail);

      // Verify that database lead insertion preserves encrypted fields
      const lead = db.addLead({
        contractorId: testContractorId,
        businessName: 'Winnipeg Mechanical Commercial Ltd',
        ownerName: 'Dan Fraser',
        phone: plainPhone,
        email: plainEmail,
        city: 'Winnipeg',
        serviceType: 'Commercial HVAC',
        status: 'new',
        urgencyScore: 88,
        predictedLtvUsd: 14000,
        source: 'stage1_evidence_harvest'
      });

      expect(lead.phoneEncrypted).toBeDefined();
      expect(lead.phoneEncrypted).not.toBe(plainPhone);
      expect(decrypt(lead.phoneEncrypted!)).toBe(plainPhone);
    });
  });

  describe('Structured Ledger Anchoring for Stage 1', () => {
    it('records evidence_gathered and stage_transition events into the immutable cryptographic chain', () => {
      const loopId = 'loop_test_' + Date.now();

      // Record Stage 1 Evidence Ingestion block
      const evidenceBlock = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'evidence_gathered',
        entityType: 'hal_loop',
        entityId: loopId,
        actor: 'HAL Stage 1 Harvest Engine',
        details: 'Harvested 4 verified territory companies in Winnipeg (Commercial HVAC)',
        metadata: {
          territory: 'Winnipeg',
          niche: 'Commercial HVAC',
          recordsCount: 4,
          completenessScore: 95
        }
      });

      expect(evidenceBlock.id).toBeDefined();
      expect(evidenceBlock.sequenceNumber).toBeGreaterThan(0);
      expect(evidenceBlock.entryHash).toHaveLength(64);
      expect(evidenceBlock.eventType).toBe('evidence_gathered');

      // Record Stage Transition block to Stage 2 (analyzing)
      const transitionBlock = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'stage_transition',
        entityType: 'hal_loop',
        entityId: loopId,
        actor: 'HAL Operator',
        details: 'Operating Loop advanced from gathering to analyzing',
        metadata: {
          previousStage: 'gathering',
          newStage: 'analyzing'
        }
      });

      expect(transitionBlock.sequenceNumber).toBe(evidenceBlock.sequenceNumber + 1);
      expect(transitionBlock.prevHash).toBe(evidenceBlock.entryHash);
      expect(transitionBlock.eventType).toBe('stage_transition');

      // Verify ledger integrity
      const audit = db.verifyLedgerIntegrity(testContractorId);
      expect(audit.valid).toBe(true);
      expect(audit.totalEntries).toBeGreaterThanOrEqual(2);
    });
  });
});
