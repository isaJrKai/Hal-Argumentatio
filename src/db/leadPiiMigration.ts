import type { Pool } from 'pg';
import { decrypt, encrypt } from './encryption';

interface LeadPiiRow {
  id: string;
  email: string | null;
  phone: string | null;
  email_encrypted: string | null;
  phone_encrypted: string | null;
}

/**
 * Encrypt legacy plaintext lead contact fields in-place.
 *
 * The migration is transactional and idempotent. Plaintext columns are replaced
 * with the non-sensitive marker used by current lead-write paths; ciphertext is
 * stored in the dedicated encrypted columns. If a ciphertext exists but does
 * not decrypt to the plaintext source value, it is regenerated from that
 * plaintext value before the plaintext is scrubbed.
 */
export async function migrateExistingLeadPii(pool: Pool): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<LeadPiiRow>(`
      SELECT id, email, phone, email_encrypted, phone_encrypted
      FROM public.leads
      WHERE
        (email IS NOT NULL AND email <> '' AND email <> '[ENCRYPTED]')
        OR
        (phone IS NOT NULL AND phone <> '' AND phone <> '[ENCRYPTED]')
      FOR UPDATE
    `);

    let migrated = 0;

    for (const row of result.rows) {
      const hasPlainEmail = Boolean(row.email && row.email !== '[ENCRYPTED]');
      const hasPlainPhone = Boolean(row.phone && row.phone !== '[ENCRYPTED]');

      if (!hasPlainEmail && !hasPlainPhone) continue;

      const emailEncrypted = hasPlainEmail
        ? (row.email_encrypted && decrypt(row.email_encrypted) === row.email
            ? row.email_encrypted
            : encrypt(row.email!))
        : row.email_encrypted;

      const phoneEncrypted = hasPlainPhone
        ? (row.phone_encrypted && decrypt(row.phone_encrypted) === row.phone
            ? row.phone_encrypted
            : encrypt(row.phone!))
        : row.phone_encrypted;

      await client.query(
        `UPDATE public.leads
         SET
           email = CASE WHEN $2 THEN '[ENCRYPTED]' ELSE email END,
           email_encrypted = CASE WHEN $2 THEN $3 ELSE email_encrypted END,
           phone = CASE WHEN $4 THEN '[ENCRYPTED]' ELSE phone END,
           phone_encrypted = CASE WHEN $4 THEN $5 ELSE phone_encrypted END
         WHERE id = $1`,
        [row.id, hasPlainEmail, emailEncrypted, hasPlainPhone, phoneEncrypted]
      );

      migrated += 1;
    }

    await client.query('COMMIT');
    return migrated;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
