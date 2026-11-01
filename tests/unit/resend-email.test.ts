import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EmailProviderConfigurationError,
  EmailProviderRequestError,
  sendResendEmail,
} from '../../src/services/communications/resendEmail';

describe('Resend email adapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed when server credentials are missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('HAL_SENDER_EMAIL', '');
    await expect(sendResendEmail({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'A message',
    })).rejects.toBeInstanceOf(EmailProviderConfigurationError);
  });

  it('validates recipients before contacting the provider', async () => {
    const fetchImpl = vi.fn();
    await expect(sendResendEmail({
      to: 'not-an-email',
      subject: 'Hello',
      text: 'A message',
    }, {
      apiKey: 'server-secret',
      from: 'hal@example.com',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toBeInstanceOf(EmailProviderConfigurationError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('submits text and safely escaped HTML and reports submission, not delivery', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 're_message_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const result = await sendResendEmail({
      to: 'owner@example.com',
      subject: 'Welcome',
      text: '<script>alert("x")</script> & hello',
    }, {
      apiKey: 'server-secret',
      from: 'HAL <verified@example.com>',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({
      provider: 'resend',
      status: 'submitted',
      providerMessageId: 're_message_123',
    });
    const [, request] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(request.headers).toMatchObject({ Authorization: 'Bearer server-secret' });
    const payload = JSON.parse(String(request.body));
    expect(payload.to).toEqual(['owner@example.com']);
    expect(payload.text).toContain('<script>');
    expect(payload.html).toContain('&lt;script&gt;');
    expect(payload.html).toContain('&amp; hello');
    expect(payload.html).not.toContain('<script>');
  });

  it('does not claim success when Resend rejects a request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('provider error', { status: 401 }));
    await expect(sendResendEmail({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'A message',
    }, {
      apiKey: 'server-secret',
      from: 'hal@example.com',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toBeInstanceOf(EmailProviderRequestError);
  });

  it('does not claim success when Resend omits a message ID', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(sendResendEmail({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'A message',
    }, {
      apiKey: 'server-secret',
      from: 'hal@example.com',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toThrow(/did not return a message ID/);
  });
});
