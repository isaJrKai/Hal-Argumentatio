import { describe, expect, it } from 'vitest';
import { parseCachedContractor, safeStorageGet, safeStorageRemove, safeStorageSet } from '../../src/lib/sessionStorage';

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

describe('safe browser storage helpers', () => {
  it('returns null when storage reads throw', () => {
    expect(safeStorageGet({ getItem: () => { throw new Error('blocked'); } }, 'token')).toBeNull();
  });

  it('reports whether storage writes and removals succeed', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); }
    };
    expect(safeStorageSet(storage, 'token', 'secret')).toBe(true);
    expect(safeStorageGet(storage, 'token')).toBe('secret');
    expect(safeStorageRemove(storage, 'token')).toBe(true);
    expect(safeStorageGet(storage, 'token')).toBeNull();
  });

  it('does not throw when storage writes or removals are blocked', () => {
    const blocked = {
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); }
    };
    expect(safeStorageSet(blocked, 'token', 'secret')).toBe(false);
    expect(safeStorageRemove(blocked, 'token')).toBe(false);
  });
});
