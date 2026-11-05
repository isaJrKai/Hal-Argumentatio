import type { Pool, PoolClient } from 'pg';

export interface DueCommunication {
  id: string;
  contractor_id: string;
  channel: string;
  provider: string;
  recipient_encrypted: string;
  subject_encrypted: string | null;
  body_encrypted: string;
  attempts: number;
  idempotency_key: string;
}

export interface WorkerResult {
  claimed: number;
  submitted: number;
  retrying: number;
  deadLettered: number;
  failed: number;
  reconciliationPending: number;
}

export type CommunicationSender = (record: DueCommunication) => Promise<{ providerMessageId: string }>;

function retryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  const match = message.match(/HTTP (\d{3})/i);
  if (!match) return !(error instanceof Error && error.name === 'EmailProviderConfigurationError');
  const status = Number(match[1]);
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export async function runCommunicationsOutboxWorker(
  pool: Pick<Pool, 'connect' | 'query'>,
  send: CommunicationSender,
  options: { batchSize?: number; maxAttempts?: number; now?: Date } = {}
): Promise<WorkerResult> {
  const batchSize = Math.max(1, Math.min(50, options.batchSize ?? 10));
  const maxAttempts = Math.max(1, Math.min(10, options.maxAttempts ?? 5));
  const now = options.now ?? new Date();
  const client: PoolClient = await pool.connect();
  let records: DueCommunication[] = [];
  try {
    await client.query('BEGIN');
    const claimed = await client.query<DueCommunication>(
      `WITH due AS (
        SELECT id FROM communications_outbox
        WHERE provider = 'resend' AND channel = 'email'
          -- A stale processing row may already have been accepted by the provider
          -- before the process lost its database connection. Never resend it
          -- automatically; reconcile it against provider records first.
          AND status IN ('queued','retrying')
          AND (next_attempt_at IS NULL OR next_attempt_at <= $1)
        ORDER BY COALESCE(next_attempt_at, created_at), created_at
        FOR UPDATE SKIP LOCKED
        LIMIT $2
      )
      UPDATE communications_outbox AS o
      SET status = 'processing', attempts = o.attempts + 1,
          last_attempt_at = $1, updated_at = $1
      FROM due WHERE o.id = due.id
      RETURNING o.id, o.contractor_id, o.channel, o.provider,
        o.recipient_encrypted, o.subject_encrypted, o.body_encrypted, o.attempts, o.idempotency_key`,
      [now, batchSize]
    );
    records = claimed.rows;
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  const result: WorkerResult = {
    claimed: records.length,
    submitted: 0,
    retrying: 0,
    deadLettered: 0,
    failed: 0,
    reconciliationPending: 0
  };
  for (const record of records) {
    let sent: { providerMessageId: string };
    try {
      sent = await send(record);
    } catch (error) {
      const canRetry = retryable(error);
      const exhausted = record.attempts >= maxAttempts;
      const dead = !canRetry || exhausted;
      const delaySeconds = Math.min(3600, 30 * (2 ** Math.max(0, record.attempts - 1)));
      const status = dead ? (canRetry ? 'dead_letter' : 'failed') : 'retrying';
      await pool.query(
        `UPDATE communications_outbox SET status=$2,
          next_attempt_at=CASE WHEN $2='retrying' THEN NOW() + ($3 * INTERVAL '1 second') ELSE NULL END,
          error_code=$4, error_message=$5, updated_at=NOW()
          WHERE id=$1 AND status='processing'`,
        [record.id, status, delaySeconds, canRetry ? 'PROVIDER_TEMPORARY_FAILURE' : 'PROVIDER_PERMANENT_FAILURE',
          String(error instanceof Error ? error.message : 'Provider request failed').slice(0, 500)]
      );
      if (status === 'retrying') result.retrying++;
      else if (status === 'dead_letter') result.deadLettered++;
      else result.failed++;
      continue;
    }

    // Provider acceptance is a point of no return for automatic sending.
    // If persistence fails, leave the row in processing: the claim query
    // deliberately excludes that state until provider reconciliation.
    try {
      const persisted = await pool.query(
        `UPDATE communications_outbox SET status='submitted', provider_message_id=$2,
          submitted_at=NOW(), next_attempt_at=NULL, error_code=NULL, error_message=NULL,
          updated_at=NOW() WHERE id=$1 AND status='processing'`,
        [record.id, sent.providerMessageId]
      );
      if (persisted.rowCount === 0) {
        throw new Error('Accepted email outbox row was not updated; provider reconciliation is required.');
      }
      result.submitted++;
    } catch (persistenceError) {
      result.reconciliationPending++;
      console.error('[Communications Outbox] Provider accepted an email, but submission state persistence failed; automatic resend is disabled.', {
        outboxId: record.id,
        providerMessageId: sent.providerMessageId,
        idempotencyKey: record.idempotency_key,
        error: persistenceError instanceof Error ? persistenceError.message : String(persistenceError)
      });
    }
  }
  return result;
}
