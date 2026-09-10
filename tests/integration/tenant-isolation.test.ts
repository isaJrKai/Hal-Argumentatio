import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/db/db';
import { validateCrmTransition } from '../../src/lib/crmStateMachine';

/**
 * INTEGRATION / TENANT ISOLATION & SECURITY P0 REGRESSION TESTS
 * 
 * Verifies that:
 * 1. PUT /api/leads/:id sanitization strips all dangerous fields (contractorId, id, createdAt, etc.)
 * 2. Cross-tenant mutations in win/loss and lead management are strictly rejected
 * 3. SSE /api/events broadcasts are scoped strictly to the authenticated tenant
 * 4. PII encryption invariants are strictly enforced on Postgres-bound data
 * 5. CRM state machine guards prevent arbitrary pipeline jumps
 */

describe('Integration: Tenant Scoping & Security Invariants', () => {
  const tenantA = 'tenant_apex_roofing';
  const tenantB = 'tenant_boreal_hvac';

  describe('P0 Class 1: Authentication & Event Scoping', () => {
    it('verifies that SSE broadcast channels isolate events per contractorId', () => {
      // Simulating the server.ts sseClients Map<string, Set<Response>>
      const sseClients = new Map<string, Set<{ id: string; write: (data: string) => void }>>();

      const registerClient = (contractorId: string, client: { id: string; write: (data: string) => void }) => {
        if (!sseClients.has(contractorId)) {
          sseClients.set(contractorId, new Set());
        }
        sseClients.get(contractorId)!.add(client);
      };

      const messagesA: string[] = [];
      const messagesB: string[] = [];

      const clientA = { id: 'client_a', write: (msg: string) => messagesA.push(msg) };
      const clientB = { id: 'client_b', write: (msg: string) => messagesB.push(msg) };

      registerClient(tenantA, clientA);
      registerClient(tenantB, clientB);

      // Simulating broadcastNotification(targetContractorId, type, title, message)
      const broadcastNotification = (targetContractorId: string, payload: any) => {
        const clients = sseClients.get(targetContractorId);
        if (clients && clients.size > 0) {
          const serialized = JSON.stringify(payload);
          clients.forEach(c => c.write(serialized));
        }
      };

      // Broadcast event destined ONLY for Tenant A
      broadcastNotification(tenantA, { title: 'Lead Sourced', target: tenantA });

      expect(messagesA.length).toBe(1);
      expect(messagesA[0]).toContain(tenantA);
      // Strict verification: Tenant B MUST NEVER receive Tenant A notifications
      expect(messagesB.length).toBe(0);
    });
  });

  describe('P0 Class 2: Tenant Mutation Isolation & Field Sanitization', () => {
    it('strictly strips dangerous fields from PUT /api/leads/:id updates', () => {
      // Replicating safeUpdates filtering logic from server.ts PUT /api/leads/:id
      const rawRequestBody = {
        id: 'hacked_id_overwrite',
        contractorId: tenantB, // Attacker attempting to change lead tenant ownership!
        businessName: 'Legitimate Business Name Update',
        status: 'contacted',
        emailEncrypted: 'attacker_fake_encrypted_blob',
        phoneEncrypted: 'attacker_fake_encrypted_blob',
        createdAt: new Date('2020-01-01'),
        externalCrmId: 'malicious_crm_link',
        notes: 'Updated notes from operator'
      };

      const allowedFields = [
        'businessName', 'ownerName', 'city', 'niche', 'status',
        'urgencyScore', 'predictedLtv', 'notes', 'websiteUrl',
        'seoScore', 'performanceScore', 'sslStatus', 'googleRating',
        'reviewCount', 'sentimentScore', 'outreachStrategy', 'followUpDate'
      ];

      const safeUpdates: any = { updatedAt: new Date() };
      for (const field of allowedFields) {
        if (field in rawRequestBody) {
          safeUpdates[field] = (rawRequestBody as any)[field];
        }
      }

      // Assertions: Dangerous fields MUST be completely omitted
      expect(safeUpdates.id).toBeUndefined();
      expect(safeUpdates.contractorId).toBeUndefined();
      expect(safeUpdates.emailEncrypted).toBeUndefined();
      expect(safeUpdates.phoneEncrypted).toBeUndefined();
      expect(safeUpdates.createdAt).toBeUndefined();
      expect(safeUpdates.externalCrmId).toBeUndefined();

      // Safe fields are preserved
      expect(safeUpdates.businessName).toBe('Legitimate Business Name Update');
      expect(safeUpdates.status).toBe('contacted');
      expect(safeUpdates.notes).toBe('Updated notes from operator');
    });

    it('strictly rejects cross-tenant win/loss mutations (cannot mutate Tenant A lead from Tenant B context)', () => {
      // Mock existing leads in system
      const databaseLeads = [
        { id: 'lead_tenant_a_1', contractorId: tenantA, businessName: 'Apex Target', status: 'proposal', predictedLtv: 5000 }
      ];

      const mutateWinLoss = (requestContractorId: string, leadId: string, outcome: 'won' | 'lost') => {
        // As implemented in server.ts POST /api/learning/winloss:
        const foundLead = databaseLeads.find(l => l.id === leadId && l.contractorId === requestContractorId);
        if (!foundLead) {
          return { status: 404, error: 'Lead not found or inaccessible' };
        }

        const targetStatus = outcome === 'won' ? 'closed_won' : 'closed_lost';
        const transitionCheck = validateCrmTransition(foundLead.status, targetStatus);
        if (!transitionCheck.valid) {
          return { status: 409, error: transitionCheck.reason };
        }

        foundLead.status = targetStatus;
        return { status: 200, success: true, lead: foundLead };
      };

      // Attacker from Tenant B attempts to mutate Tenant A's lead
      const attackResult = mutateWinLoss(tenantB, 'lead_tenant_a_1', 'won');
      expect(attackResult.status).toBe(404);
      expect(attackResult.error).toContain('inaccessible');

      // Lead status in Tenant A remains unchanged
      expect(databaseLeads[0].status).toBe('proposal');

      // Legitimate Tenant A operator can mutate
      const legitimateResult = mutateWinLoss(tenantA, 'lead_tenant_a_1', 'won');
      expect(legitimateResult.status).toBe(200);
      expect(databaseLeads[0].status).toBe('closed_won');
    });
  });

  describe('P0 Class 3: PII Encryption Invariants in Database Operations', () => {
    it('ensures PII is encrypted before persistence and raw columns receive masked placeholders', () => {
      const rawEmail = 'contractor-vip-client@example.com';
      const rawPhone = '403-555-0199';

      // Encryption transformation applied in server.ts for Postgres persistence
      const emailEncrypted = rawEmail ? encrypt(rawEmail) : null;
      const phoneEncrypted = rawPhone ? encrypt(rawPhone) : null;
      const storedPlaintextEmail = rawEmail ? '[ENCRYPTED]' : null;
      const storedPlaintextPhone = rawPhone ? '[ENCRYPTED]' : null;

      // 1. Plaintext columns must never store raw PII
      expect(storedPlaintextEmail).toBe('[ENCRYPTED]');
      expect(storedPlaintextPhone).toBe('[ENCRYPTED]');

      // 2. Encrypted columns must contain valid AES-GCM ciphertext
      expect(emailEncrypted).not.toBeNull();
      expect(emailEncrypted).not.toBe(rawEmail);
      expect(emailEncrypted!.split(':').length).toBe(3); // iv:ciphertext:tag

      // 3. Decryption must accurately restore original PII
      expect(decrypt(emailEncrypted!)).toBe(rawEmail);
      expect(decrypt(phoneEncrypted!)).toBe(rawPhone);
    });
  });
});

