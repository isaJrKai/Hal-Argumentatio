import { describe, expect, it } from 'vitest';
import { normalizePostgresConnectionString } from '../../src/db/connectionString';

describe('normalizePostgresConnectionString', () => {
  it.each(['prefer', 'require', 'verify-ca'])('makes sslmode=%s explicitly verify-full', mode => {
    const url = `postgresql://user:pass@db.example.test/app?sslmode=${mode}&connect_timeout=5`;
    expect(normalizePostgresConnectionString(url)).toBe('postgresql://user:pass@db.example.test/app?sslmode=verify-full&connect_timeout=5');
  });
  it('preserves existing verify-full mode and unrelated query parameters', () => {
    const url = 'postgresql://user:pass@db.example.test/app?sslmode=verify-full&application_name=hal';
    expect(normalizePostgresConnectionString(url)).toBe(url);
  });
  it('does not change a connection string without an SSL mode parameter', () => {
    const url = 'postgresql://user:pass@db.example.test/app?application_name=hal';
    expect(normalizePostgresConnectionString(url)).toBe(url);
  });
});
