import { describe, expect, it, vi } from 'vitest';
import { runCommunicationsOutboxWorker } from '../../src/services/communications/outboxWorker';

describe('communications outbox worker', () => {
  it('claims work with SKIP LOCKED and records provider submission', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{
          id: 'outbox-1', contractor_id: 'tenant-a', channel: 'email', provider: 'resend',
          recipient_encrypted: 'enc-to', subject_encrypted: 'enc-subject', body_encrypted: 'enc-body', attempts: 1
        }] })
        .mockResolvedValue({ rows: [] }),
      release: vi.fn()
    };
    const pool = { connect: vi.fn().mockResolvedValue(client), query: vi.fn().mockResolvedValue({ rows: [] }) };
    const send = vi.fn().mockResolvedValue({ providerMessageId: 're_123' });

    const result = await runCommunicationsOutboxWorker(pool as any, send, { now: new Date('2026-01-01T00:00:00Z') });

    expect(result).toEqual({ claimed: 1, submitted: 1, retrying: 0, deadLettered: 0, failed: 0 });
    expect(client.query.mock.calls[1][0]).toContain('FOR UPDATE SKIP LOCKED');
    expect(client.query.mock.calls[1][0]).toContain("status IN ('queued','retrying')");
    expect(client.query.mock.calls[1][0]).not.toContain("status = 'processing'");
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ contractor_id: 'tenant-a' }));
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("status='submitted'"), ['outbox-1', 're_123']);
    expect(client.release).toHaveBeenCalled();
  });

  it('schedules transient provider failures and dead-letters exhausted attempts', async () => {
    const makePool = (attempts: number) => {
      const client = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{
            id: 'outbox-2', contractor_id: 'tenant-a', channel: 'email', provider: 'resend',
            recipient_encrypted: 'enc-to', subject_encrypted: null, body_encrypted: 'enc-body', attempts
          }] })
          .mockResolvedValue({ rows: [] }),
        release: vi.fn()
      };
      return { pool: { connect: vi.fn().mockResolvedValue(client), query: vi.fn().mockResolvedValue({ rows: [] }) }, client };
    };
    const first = makePool(1);
    const transient = new Error('Resend rejected request (HTTP 503).');
    const retryResult = await runCommunicationsOutboxWorker(first.pool as any, vi.fn().mockRejectedValue(transient));
    expect(retryResult.retrying).toBe(1);
    expect(first.pool.query).toHaveBeenCalledWith(expect.stringContaining("status=$2"), expect.arrayContaining(['outbox-2', 'retrying']));

    const exhausted = makePool(5);
    const deadResult = await runCommunicationsOutboxWorker(exhausted.pool as any, vi.fn().mockRejectedValue(transient));
    expect(deadResult.deadLettered).toBe(1);
    expect(exhausted.pool.query).toHaveBeenCalledWith(expect.stringContaining("status=$2"), expect.arrayContaining(['outbox-2', 'dead_letter']));
  });

  it('does not retry permanent configuration errors', async () => {
    const client = {
      query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{
        id: 'outbox-3', contractor_id: 'tenant-a', channel: 'email', provider: 'resend',
        recipient_encrypted: 'enc-to', subject_encrypted: null, body_encrypted: 'enc-body', attempts: 1
      }] }).mockResolvedValue({ rows: [] }),
      release: vi.fn()
    };
    const pool = { connect: vi.fn().mockResolvedValue(client), query: vi.fn().mockResolvedValue({ rows: [] }) };
    const error = new Error('missing sender'); error.name = 'EmailProviderConfigurationError';
    const result = await runCommunicationsOutboxWorker(pool as any, vi.fn().mockRejectedValue(error));
    expect(result.failed).toBe(1);
    expect(result.retrying).toBe(0);
  });
});
