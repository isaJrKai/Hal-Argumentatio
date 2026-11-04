import { describe, expect, it } from 'vitest';
import { pruneBoundedMap } from '../../src/lib/boundedMap';

describe('pruneBoundedMap', () => {
  it('removes expired entries and preserves active entries', () => {
    const entries = new Map([
      ['expired', { expiresAt: 99 }],
      ['active', { expiresAt: 101 }]
    ]);

    pruneBoundedMap(entries, 100, value => value.expiresAt, 10);

    expect([...entries.keys()]).toEqual(['active']);
  });

  it('evicts oldest entries when the configured cap is exceeded', () => {
    const entries = new Map([
      ['first', { expiresAt: 500 }],
      ['second', { expiresAt: 500 }],
      ['third', { expiresAt: 500 }]
    ]);

    pruneBoundedMap(entries, 100, value => value.expiresAt, 2);

    expect([...entries.keys()]).toEqual(['second', 'third']);
  });

  it('does not evict active entries when the map is under its cap', () => {
    const entries = new Map([['active', { expiresAt: 500 }]]);

    pruneBoundedMap(entries, 100, value => value.expiresAt, 1);

    expect(entries.size).toBe(1);
  });
});
