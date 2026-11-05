import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { migrateExistingLeadPii } from '../../src/db/leadPiiMigration';

describe('migrateExistingLeadPii', () => {
  it('encrypts plaintext contact fields and replaces them with markers transactionally', async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      if (sql.includes('SELECT id, email, phone')) {
        return {
          rows: [{
            id: 'lead-1',
            email: 'owner@example.com',
            phone: '+15551234567',
            email_encrypted: null,
            phone_encrypted: null
          }]
        };
      }
      return { rows: [], rowCount: 1, values };
    });
    const release = vi.fn();
    const connect = vi.fn().mockResolvedValue({ query, release });
    const pool = { connect } as unknown as Pool;

    const migrated = await migrateExistingLeadPii(pool);

    expect(migrated).toBe(1);
    expect(query.mock.calls[0][0]).toBe('BEGIN');
    expect(query.mock.calls[1][0]).toContain('FOR UPDATE');
    const update = query.mock.calls.find(([sql]) => sql.includes('UPDATE public.leads'));
    expect(update).toBeDefined();
    expect(update?.[1]?.[1]).toBe(true);
    expect(String(update?.[1]?.[2])).toContain(':');
    expect(update?.[1]?.[3]).toBe(true);
    expect(String(update?.[1]?.[4])).toContain(':');
    expect(query.mock.calls.at(-1)?.[0]).toBe('COMMIT');
    expect(release).toHaveBeenCalledOnce();
  });

  it('rolls back when encryption or database updates fail', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('SELECT id, email, phone')) {
        return { rows: [{ id: 'lead-2', email: 'owner@example.com', phone: null, email_encrypted: null, phone_encrypted: null }] };
      }
      if (sql.includes('UPDATE public.leads')) throw new Error('write failed');
      return { rows: [] };
    });
    const release = vi.fn();
    const pool = { connect: vi.fn().mockResolvedValue({ query, release }) } as unknown as Pool;

    await expect(migrateExistingLeadPii(pool)).rejects.toThrow('write failed');
    expect(query.mock.calls.some(([sql]) => sql === 'ROLLBACK')).toBe(true);
    expect(release).toHaveBeenCalledOnce();
  });
});
