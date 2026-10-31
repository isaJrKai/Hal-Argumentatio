import { describe, it, expect } from 'vitest';
import {
  validateCrmTransition,
  ALLOWED_CRM_TRANSITIONS,
  canonicalizeStage,
  isKnownCrmStage
} from '../../src/lib/crmStateMachine';

describe('CRM state machine and lifecycle verification', () => {
  describe('legal lifecycle progression', () => {
    it('permits canonical forward stage progression', () => {
      expect(validateCrmTransition('new', 'contacted').valid).toBe(true);
      expect(validateCrmTransition('contacted', 'qualified').valid).toBe(true);
      expect(validateCrmTransition('qualified', 'sal').valid).toBe(true);
      expect(validateCrmTransition('sal', 'proposal').valid).toBe(true);
      expect(validateCrmTransition('proposal', 'customer').valid).toBe(true);
      expect(validateCrmTransition('customer', 'retained').valid).toBe(true);
    });

    it('permits early loss transitions from intermediate stages', () => {
      for (const stage of ['new', 'contacted', 'qualified', 'sal', 'proposal']) {
        expect(validateCrmTransition(stage, 'closed_lost').valid).toBe(true);
      }
    });

    it('permits idempotent transitions', () => {
      expect(validateCrmTransition('qualified', 'qualified').valid).toBe(true);
      expect(validateCrmTransition('new', 'new').valid).toBe(true);
    });
  });

  describe('legacy stage normalization', () => {
    it.each([
      ['converted', 'closed_won'],
      ['won', 'closed_won'],
      ['customer', 'closed_won'],
      ['dead', 'closed_lost'],
      ['lost', 'closed_lost'],
      ['appointment', 'proposal'],
      ['booked', 'proposal'],
      ['opportunity', 'proposal'],
      ['estimate', 'proposal']
    ])('normalizes %s to %s', (legacy, canonical) => {
      expect(canonicalizeStage(legacy)).toBe(canonical);
      expect(isKnownCrmStage(legacy)).toBe(true);
    });

    it('allows valid transitions from legacy aliases', () => {
      expect(validateCrmTransition('customer', 'retained').valid).toBe(true);
      expect(validateCrmTransition('dead', 'reactivated').valid).toBe(true);
      expect(validateCrmTransition('booked', 'customer').valid).toBe(true);
    });
  });

  describe('illegal lifecycle progression enforcement', () => {
    it('rejects jumping directly from closed_lost to customer or proposal', () => {
      const lostToCustomer = validateCrmTransition('closed_lost', 'customer');
      expect(lostToCustomer.valid).toBe(false);
      expect(lostToCustomer.reason).toContain('Illegal CRM pipeline transition');
      expect(validateCrmTransition('closed_lost', 'proposal').valid).toBe(false);
    });

    it('rejects jumping directly from new to customer', () => {
      const directJump = validateCrmTransition('new', 'customer');
      expect(directJump.valid).toBe(false);
      expect(directJump.reason).toContain('Illegal CRM pipeline transition');
    });

    it('permits the reactivation workflow', () => {
      expect(validateCrmTransition('closed_lost', 'reactivated').valid).toBe(true);
      expect(validateCrmTransition('reactivated', 'contacted').valid).toBe(true);
    });

    it('fails closed for unknown current and target stages', () => {
      expect(validateCrmTransition('mystery_stage', 'qualified').valid).toBe(false);
      expect(validateCrmTransition('new', 'mystery_stage').valid).toBe(false);
      expect(validateCrmTransition('legacy-custom', 'legacy-custom').valid).toBe(true);
      expect(validateCrmTransition('new', '').valid).toBe(false);
    });

    it('exposes only canonical transition keys', () => {
      expect(Object.keys(ALLOWED_CRM_TRANSITIONS)).not.toContain('converted');
      expect(Object.keys(ALLOWED_CRM_TRANSITIONS)).not.toContain('customer');
      expect(Object.keys(ALLOWED_CRM_TRANSITIONS)).toContain('closed_won');
    });
  });
});
