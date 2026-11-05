import crypto from 'node:crypto';

export function verifyMetaWebhookSignature(rawBody: Buffer, signature: string | undefined, appSecret: string | undefined): boolean {
  if (!appSecret || !signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from('sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex'));
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

export function isMetaPhoneNumberId(value: unknown): value is string {
  return typeof value === 'string' && /^\d{5,30}$/.test(value);
}
