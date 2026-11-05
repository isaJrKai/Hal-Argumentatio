import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { sendTwilioSms, TwilioConfigurationError, verifyTwilioRequestSignature } from '../../src/services/communications/twilioSms';

describe('Twilio SMS adapter', () => {
  it('submits an E.164 message and reports submission, not delivery', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sid: 'SM' + 'a'.repeat(32) }), { status: 201 }));
    const result = await sendTwilioSms({
      to: '+15551234567', from: '+15557654321', body: 'Hello',
      statusCallbackUrl: 'https://example.com/api/webhooks/twilio/status'
    }, { accountSid: 'AC' + 'b'.repeat(32), authToken: 'secret', fetchImpl: fetchImpl as any });
    expect(result.status).toBe('submitted');
    expect(result.providerMessageId).toBe('SM' + 'a'.repeat(32));
    const [, request] = fetchImpl.mock.calls[0];
    expect(request.headers.Authorization).toMatch(/^Basic /);
    expect(String(request.body)).toContain('To=%2B15551234567');
  });

  it('rejects unsafe destinations and callback URLs before contacting Twilio', async () => {
    const fetchImpl = vi.fn();
    await expect(sendTwilioSms({
      to: '5551234567', from: '+15557654321', body: 'Hello',
      statusCallbackUrl: 'https://example.com/callback'
    }, { accountSid: 'AC' + 'b'.repeat(32), authToken: 'secret', fetchImpl: fetchImpl as any }))
      .rejects.toBeInstanceOf(TwilioConfigurationError);
    await expect(sendTwilioSms({
      to: '+15551234567', from: '+15557654321', body: 'Hello',
      statusCallbackUrl: 'http://example.com/callback'
    }, { accountSid: 'AC' + 'b'.repeat(32), authToken: 'secret', fetchImpl: fetchImpl as any }))
      .rejects.toBeInstanceOf(TwilioConfigurationError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('verifies Twilio signatures using the canonical URL and sorted form parameters', () => {
    const url = 'https://example.com/api/webhooks/twilio/status';
    const params = { MessageSid: 'SM123', MessageStatus: 'delivered', To: '+15551234567' };
    const token = 'twilio-secret';
    const data = url + 'MessageSidSM123MessageStatusdeliveredTo+15551234567';
    const signature = createHmac('sha1', token).update(data).digest('base64');
    expect(verifyTwilioRequestSignature(url, params, signature, token)).toBe(true);
    expect(verifyTwilioRequestSignature(url + '?x=1', params, signature, token)).toBe(false);
    expect(verifyTwilioRequestSignature(url, params, signature, undefined)).toBe(false);
  });
});
