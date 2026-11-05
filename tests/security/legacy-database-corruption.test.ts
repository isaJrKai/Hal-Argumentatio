import { describe, expect, it } from 'vitest';
import { parseLegacyDatabase } from '../../src/db/db';

describe('legacy database file parsing', () => {
  it('parses a JSON object without changing its data', () => {
    expect(parseLegacyDatabase('{"leads":[{"id":"lead-1"}]}')).toEqual({
      leads: [{ id: 'lead-1' }]
    });
  });

  it.each(['{', 'null', '[]', '"not-an-object"', '42'])(
    'rejects malformed or non-object database content (%s)',
    (raw) => {
      expect(() => parseLegacyDatabase(raw)).toThrow();
    }
  );
});
