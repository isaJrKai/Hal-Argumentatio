import { describe, expect, it } from 'vitest';
import { getEffectiveStaffAvailability, validateStaffInput } from '../../src/lib/staff';

describe('HAL staff directory rules', () => {
  it('requires a real name and role and normalizes optional contact details', () => {
    expect(validateStaffInput({ name: '  Ada Lovelace ', role: '  Operations ', email: 'ADA@example.com', phone: ' +256700000000 ' })).toEqual({
      valid: true,
      value: { name: 'Ada Lovelace', role: 'Operations', email: 'ada@example.com', phone: '+256700000000', status: 'active', availability: 'available' }
    });
    expect(validateStaffInput({ name: '', role: 'Operations' }).valid).toBe(false);
    expect(validateStaffInput({ name: 'Ada', role: '' }).valid).toBe(false);
  });

  it('rejects invalid email, status and availability values', () => {
    expect(validateStaffInput({ name: 'Ada', role: 'Ops', email: 'not-an-email' }).valid).toBe(false);
    expect(validateStaffInput({ name: 'Ada', role: 'Ops', status: 'terminated' }).valid).toBe(false);
    expect(validateStaffInput({ name: 'Ada', role: 'Ops', availability: 'maybe' }).valid).toBe(false);
    expect(validateStaffInput(null).valid).toBe(false);
  });

  it('derives busy state from active assignments without overwriting unavailable or inactive status', () => {
    expect(getEffectiveStaffAvailability({ status: 'active', availability: 'available' }, 0)).toBe('available');
    expect(getEffectiveStaffAvailability({ status: 'active', availability: 'available' }, 1)).toBe('busy');
    expect(getEffectiveStaffAvailability({ status: 'active', availability: 'unavailable' }, 0)).toBe('unavailable');
    expect(getEffectiveStaffAvailability({ status: 'inactive', availability: 'available' }, 0)).toBe('unavailable');
  });
});
