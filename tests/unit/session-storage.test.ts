import { describe, expect, it } from 'vitest';
import { parseCachedContractor } from '../../src/lib/sessionStorage';

describe('parseCachedContractor', () => {
  it('returns null when no cached profile exists', () => {
    expect(parseCachedContractor(null)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseCachedContractor('{not-json')).toBeNull();
  });

  it('rejects incomplete or invalid profile objects', () => {
    expect(parseCachedContractor(JSON.stringify({ id: 'user-1', role: 'admin' }))).toBeNull();
    expect(parseCachedContractor(JSON.stringify({
      id: 'user-1', email: 'owner@example.com', name: 'Owner', role: 'superadmin'
    }))).toBeNull();
  });

  it('accepts a valid cached contractor profile', () => {
    expect(parseCachedContractor(JSON.stringify({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'admin',
      marketId: 'market-1',
      ignored: 'untrusted-extra-field'
    }))).toEqual({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'admin',
      marketId: 'market-1'
    });
  });
});
