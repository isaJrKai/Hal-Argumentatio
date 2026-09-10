import { describe, it, expect } from 'vitest';
import { validateCrmTransition, ALLOWED_CRM_TRANSITIONS } from '../../src/lib/crmStateMachine';

describe('Integration: CRM State Machine & Lifecycle Verification', () => {
  describe('Legal Lifecycle Progression', () => {
    it('permits canonical forward stage progression', () => {
      expect(validateCrmTransition('new', 'contacted').valid).toBe(true);
      expect(validateCrmTransition('contacted', 'qualified').valid).toBe(true);
      expect(validateCrmTransition('qualified', 'sal').valid).toBe(true);
      expect(validateCrmTransition('sal', 'proposal').valid).toBe(true);
      expect(validateCrmTransition('proposal', 'customer').valid).toBe(true);
      expect(validateCrmTransition('customer', 'retained').valid).toBe(true);
    });

    it('permits early loss transitions from intermediate stages', () => {
      expect(validateCrmTransition('new', 'closed_lost').valid).toBe(true);
      expect(validateCrmTransition('contacted', 'closed_lost').valid).toBe(true);
      expect(validateCrmTransition('qualified', 'closed_lost').valid).toBe(true);
      expect(validateCrmTransition('sal', 'closed_lost').valid).toBe(true);
      expect(validateCrmTransition('proposal', 'closed_lost').valid).toBe(true);
    });

    it('permits idempotent transitions (same stage to same stage)', () => {
      expect(validateCrmTransition('qualified', 'qualified').valid).toBe(true);
      expect(validateCrmTransition('new', 'new').valid).toBe(true);
    });
  });

  describe('Illegal Lifecycle Progression Enforcement', () => {
    it('strictly rejects jumping directly from closed_lost to customer or proposal', () => {
      const lostToCustomer = validateCrmTransition('closed_lost', 'customer');
      expect(lostToCustomer.valid).toBe(false);
      expect(lostToCustomer.reason).toContain('Illegal CRM pipeline transition');

      const lostToProposal = validateCrmTransition('closed_lost', 'proposal');
      expect(lostToProposal.valid).toBe(false);
    });

    it('strictly rejects jumping directly from new to customer', () => {
      const directJump = validateCrmTransition('new', 'customer');
      expect(directJump.valid).toBe(false);
      expect(directJump.reason).toContain('Illegal CRM pipeline transition');
    });

    it('permits reactivation workflow from closed_lost', () => {
      // closed_lost can transition to reactivated
      expect(validateCrmTransition('closed_lost', 'reactivated').valid).toBe(true);
      // reactivated can then transition to contacted
      expect(validateCrmTransition('reactivated', 'contacted').valid).toBe(true);
    });
  });
});
