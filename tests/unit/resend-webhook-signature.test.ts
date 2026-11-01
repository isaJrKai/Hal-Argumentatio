import { afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { verifySvixWebhookSignature } from '../../src/lib/resendWebhook';

describe('Resend Svix webhook signature verification', () => {
  const secret = 'whsec_' + Buffer.from('a sufficiently long webhook secret for tests').toString('base64');
  const rawBody = Buffer.from(JSON.stringify({ type: 'email.delivered', data: { email_id: 're_123' } }));
  const id = 'msg_test_123';
  const timestamp = String(1_798_000_000);

  const signedHeader = () => {
    const key = Buffer.from(secret.slice('whsec_'.length), 'base64');
    const signature = crypto.createHmac('sha256', key).update(id + '.' + timestamp + '.' + rawBody.toString('utf8')).digest('base64');
    return { id, timestamp, signature: 'v1,' + signature };
  };

  it('accepts a valid signature inside the replay window', () => {
    expect(verifySvixWebhookSignature(rawBody, signedHeader(), secret, Number(timestamp) * 1000)).toBe(true);
  });

  it('rejects a modified body', () => {
    expect(verifySvixWebhookSignature(Buffer.from(rawBody.toString() + ' '), signedHeader(), secret, Number(timestamp) * 1000)).toBe(false);
  });

  it('rejects a stale webhook timestamp', () => {
    expect(verifySvixWebhookSignature(rawBody, signedHeader(), secret, (Number(timestamp) + 600) * 1000)).toBe(false);
  });

  it('rejects missing headers and invalid secrets', () => {
    expect(verifySvixWebhookSignature(rawBody, {}, secret, Number(timestamp) * 1000)).toBe(false);
    expect(verifySvixWebhookSignature(rawBody, signedHeader(), 'invalid', Number(timestamp) * 1000)).toBe(false);
  });
});
