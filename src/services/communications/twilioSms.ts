import crypto from 'node:crypto';

export class TwilioConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = 'TwilioConfigurationError'; }
}
export class TwilioRequestError extends Error {
  constructor(message: string) { super(message); this.name = 'TwilioRequestError'; }
}

export async function sendTwilioSms(
  input: { to: string; from: string; body: string; statusCallbackUrl: string },
  options: { accountSid?: string; authToken?: string; fetchImpl?: typeof fetch } = {}
): Promise<{ provider: 'twilio'; status: 'submitted'; providerMessageId: string }> {
  const accountSid = options.accountSid ?? process.env.TWILIO_ACCOUNT_SID;
  const authToken = options.authToken ?? process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !/^AC[0-9a-f]{32}$/i.test(accountSid) || !authToken) {
    throw new TwilioConfigurationError('A valid Twilio Account SID and auth token are required.');
  }
  if (!/^\+[1-9]\d{7,14}$/.test(input.to) || !/^\+[1-9]\d{7,14}$/.test(input.from)) {
    throw new TwilioConfigurationError('SMS recipient and sender must use E.164 phone format.');
  }
  if (!input.body.trim() || input.body.length > 1600) {
    throw new TwilioConfigurationError('SMS body must contain 1–1,600 characters.');
  }
  let callback: URL;
  try { callback = new URL(input.statusCallbackUrl); } catch { throw new TwilioConfigurationError('A valid status callback URL is required.'); }
  if (callback.protocol !== 'https:') throw new TwilioConfigurationError('Twilio status callback URL must use HTTPS.');

  const fetchImpl = options.fetchImpl ?? fetch;
  const form = new URLSearchParams({ To: input.to, From: input.from, Body: input.body, StatusCallback: callback.toString() });
  let response: Response;
  try {
    response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form,
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new TwilioRequestError('Twilio could not be reached. The message may not have been submitted; automatic retry is disabled to avoid duplicates.');
  }
  if (!response.ok) {
    throw new TwilioRequestError(`Twilio rejected the message request (HTTP ${response.status}).`);
  }
  let payload: { sid?: unknown };
  try { payload = await response.json() as { sid?: unknown }; }
  catch { throw new TwilioRequestError('Twilio returned an unreadable response; delivery status is unknown.'); }
  if (typeof payload.sid !== 'string' || !/^SM[0-9a-f]{32}$/i.test(payload.sid)) {
    throw new TwilioRequestError('Twilio did not return a valid message SID; delivery status is unknown.');
  }
  return { provider: 'twilio', status: 'submitted', providerMessageId: payload.sid };
}

/** Verify Twilio's X-Twilio-Signature against a configured canonical callback URL. */
export function verifyTwilioRequestSignature(
  canonicalUrl: string,
  params: Record<string, unknown>,
  signature: string | undefined,
  authToken: string | undefined
): boolean {
  if (!authToken || !signature) return false;
  const keys = Object.keys(params).sort();
  let data = canonicalUrl;
  for (const key of keys) {
    const raw = params[key];
    const values = (Array.isArray(raw) ? raw : [raw]).map(value => String(value ?? '')).sort();
    for (const value of values) data += key + value;
  }
  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(signature);
  return expectedBytes.length === suppliedBytes.length && crypto.timingSafeEqual(expectedBytes, suppliedBytes);
}
