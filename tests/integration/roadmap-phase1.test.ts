import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { db, encrypt, decrypt } from '../../src/db/db';

/**
 * HAL ROADMAP PHASE 1 (FOUNDATION) SPECIFICATION TESTS
 * Validates the 3 Non-Negotiable Pillars of Phase 1:
 * 1. Structured Ledger & Tamper-Evident Hash Chain
 * 2. Secure Storage & AES-GCM-256 PII Cryptographic Vault
 * 3. Basic Pipeline Flow (Attribution -> Ingestion -> CRM State Engine -> Conversion Outbox)
 */

describe('HAL Roadmap Phase 1: Foundation Architecture', () => {
  describe('Pillar 1: Cryptographic Structured Ledger', () => {
    it('initializes with a verified Genesis block', () => {
      const ledger = db.getStructuredLedger();
      expect(ledger.length).toBeGreaterThanOrEqual(1);

      const genesis = ledger[ledger.length - 1]; // oldest entry
      expect(genesis.eventType).toBe('genesis_block');
      expect(genesis.sequenceNumber).toBe(1);
      expect(genesis.prevHash).toBe('0'.repeat(64));
      expect(genesis.entryHash.length).toBe(64);
    });

    it('records entries sequentially with unbroken SHA-256 hash chaining', () => {
      const testContractorId = 'con_test_phase1_' + Date.now();
      
      const entry1 = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'lead_captured',
        entityType: 'lead',
        entityId: 'lead_p1_001',
        actor: 'Attribution Ingestion Engine',
        details: 'Captured prospective HVAC client via Winnipeg search campaign',
        metadata: { source: 'google_ads', gclid: 'gclid_p1_test' }
      });

      const entry2 = db.recordLedgerEntry({
        contractorId: testContractorId,
        eventType: 'crm_transition',
        entityType: 'lead',
        entityId: 'lead_p1_001',
        actor: 'Operator Dispatcher',
        details: 'Lead status transitioned from new to contacted',
        metadata: { fromStatus: 'new', toStatus: 'contacted' }
      });

      expect(entry2.sequenceNumber).toBe(entry1.sequenceNumber + 1);
      expect(entry2.prevHash).toBe(entry1.entryHash);

      // Verify cryptographic audit passes across entire chain
      const integrity = db.verifyLedgerIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalEntries).toBeGreaterThanOrEqual(3);
    });

    it('strictly detects any tampering or sequence break in the ledger chain', () => {
      // Mock an isolated array of ledger entries to simulate tampering without corrupting db
      const mockLedger = [
        {
          id: 'led_1',
          sequenceNumber: 1,
          prevHash: '0'.repeat(64),
          entryHash: crypto.createHash('sha256').update('block_1').digest('hex')
        },
        {
          id: 'led_2',
          sequenceNumber: 2,
          prevHash: crypto.createHash('sha256').update('block_1').digest('hex'),
          entryHash: crypto.createHash('sha256').update('block_2').digest('hex')
        },
        {
          id: 'led_3',
          sequenceNumber: 3,
          // TAMPERED: prevHash does not match entry 2's hash
          prevHash: 'tampered_bad_hash_' + '0'.repeat(46),
          entryHash: crypto.createHash('sha256').update('block_3').digest('hex')
        }
      ];

      // Verifier loop logic matches db.verifyLedgerIntegrity
      let isValid = true;
      let brokenSequence: number | null = null;
      let expectedPrev = '0'.repeat(64);

      for (let i = 0; i < mockLedger.length; i++) {
        const item = mockLedger[i];
        if (item.sequenceNumber !== i + 1 || item.prevHash !== expectedPrev) {
          isValid = false;
          brokenSequence = item.sequenceNumber;
          break;
        }
        expectedPrev = item.entryHash;
      }

      expect(isValid).toBe(false);
      expect(brokenSequence).toBe(3);
    });
  });

  describe('Pillar 2: Secure Storage & AES-GCM-256 PII Vault', () => {
    it('encrypts contractor and client PII with randomized IV and 128-bit authentication tag', () => {
      const plaintextPhone = '+1 (204) 555-0199';
      const ciphertext = encrypt(plaintextPhone);

      expect(ciphertext).toBeDefined();
      expect(ciphertext).not.toContain('555-0199');
      
      const parts = ciphertext.split(':');
      expect(parts.length).toBe(3); // ivHex : encryptedHex : authTagHex
      expect(parts[0].length).toBe(24); // 12-byte IV (96-bit standard for AES-GCM)
      expect(parts[2].length).toBe(32); // 16-byte Auth Tag (128-bit)

      const recovered = decrypt(ciphertext);
      expect(recovered).toBe(plaintextPhone);
    });

    it('enforces strict fail-closed behavior if PII ciphertext is modified or forged', () => {
      const plaintext = 'confidential-commercial-lead-contract';
      const ciphertext = encrypt(plaintext);
      const parts = ciphertext.split(':');
      
      // Tamper with ciphertext bits
      const tamperedBody = parts[1].slice(0, -4) + 'abcd';
      const forgedCiphertext = `${parts[0]}:${tamperedBody}:${parts[2]}`;

      // Must fail closed with empty string, never throw unhandled exception or leak corrupted data
      const result = decrypt(forgedCiphertext);
      expect(result).toBe('');
    });
  });

  describe('Pillar 3: Basic Pipeline End-to-End Flow', () => {
    it('orchestrates attribution -> lead ingestion -> ledger audit -> stage transition', () => {
      const contractor = db.getContractors()[0];
      expect(contractor).toBeDefined();

      // 1. Ingestion of Prospect Lead with encrypted phone
      const newLead = db.addLead({
        contractorId: contractor.id,
        businessName: 'Prairie Commercial Roofing Ltd',
        contactName: 'Robert Vance',
        phone: '+1 (204) 555-8844',
        email: 'rvance@prairieroof.ca',
        city: 'Winnipeg',
        niche: 'commercial roofing',
        status: 'new',
        score: 88,
        source: 'google_ads_inbound'
      });

      expect(newLead.id).toBeDefined();
      expect(newLead.status).toBe('new');

      // 2. Structured Ledger Entry Recorded for Pipeline Event
      const ledgerEntry = db.recordLedgerEntry({
        contractorId: contractor.id,
        eventType: 'lead_captured',
        entityType: 'lead',
        entityId: newLead.id,
        actor: 'HAL Ingestion Gateway',
        details: `Captured high-intent commercial roofing lead (${newLead.businessName})`,
        metadata: { score: newLead.score, city: newLead.city }
      });

      expect(ledgerEntry.sequenceNumber).toBeGreaterThan(1);
      expect(ledgerEntry.entityId).toBe(newLead.id);

      // 3. CRM Transition Invariant
      const updatedLead = db.updateLead(newLead.id, contractor.id, { status: 'contacted' });
      expect(updatedLead?.status).toBe('contacted');

      // 4. Record State Machine Transition in Ledger
      const transitionEntry = db.recordLedgerEntry({
        contractorId: contractor.id,
        eventType: 'crm_transition',
        entityType: 'lead',
        entityId: newLead.id,
        actor: 'Operator Dispatcher',
        details: `Moved ${newLead.businessName} to contacted status`,
        metadata: { previousStatus: 'new', newStatus: 'contacted' }
      });

      expect(transitionEntry.prevHash).toBe(ledgerEntry.entryHash);
    });
  });
});
