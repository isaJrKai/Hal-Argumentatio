import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isMetaPhoneNumberId, verifyMetaWebhookSignature } from '../../src/lib/whatsappWebhook';

describe('Meta WhatsApp webhook security helpers', () => {
  it('accepts only a correctly signed raw request body', () => {
    const body = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', entry: [] }));
    const secret = 'meta-app-secret';
    const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyMetaWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(Buffer.from('{}'), signature, secret)).toBe(false);
    expect(verifyMetaWebhookSignature(body, signature, undefined)).toBe(false);
    expect(verifyMetaWebhookSignature(body, 'sha256=bad', secret)).toBe(false);
  });

  it('validates Meta phone-number IDs as numeric identifiers', () => {
    expect(isMetaPhoneNumberId('1234567890')).toBe(true);
    expect(isMetaPhoneNumberId('1234')).toBe(false);
    expect(isMetaPhoneNumberId('12345x')).toBe(false);
    expect(isMetaPhoneNumberId(null)).toBe(false);
  });
});
