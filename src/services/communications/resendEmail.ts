export class EmailProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailProviderConfigurationError';
  }
}

export class EmailProviderRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailProviderRequestError';
  }
}

export interface ResendEmailInput {
  to: string;
  subject: string;
  text: string;
}

export interface ResendEmailResult {
  provider: 'resend';
  status: 'submitted';
  providerMessageId: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export async function sendResendEmail(
  input: ResendEmailInput,
  options: {
    apiKey?: string;
    from?: string;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<ResendEmailResult> {
  const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
  const from = options.from ?? process.env.HAL_SENDER_EMAIL;
  if (!apiKey) {
    throw new EmailProviderConfigurationError('Resend is not configured. Set RESEND_API_KEY on the server.');
  }
  const senderAddress = from?.match(/<([^<>]+)>\\s*$/)?.[1]?.trim() || from?.trim();
  if (!senderAddress || !EMAIL_PATTERN.test(senderAddress)) {
    throw new EmailProviderConfigurationError('A verified HAL_SENDER_EMAIL address is required for Resend.');
  }

  const to = input.to.trim();
  const subject = input.subject.trim();
  const text = input.text.trim();
  if (!EMAIL_PATTERN.test(to)) {
    throw new EmailProviderConfigurationError('A valid recipient email address is required.');
  }
  if (!subject || subject.length > 200) {
    throw new EmailProviderConfigurationError('Email subject must contain 1–200 characters.');
  }
  if (!text || text.length > 20000) {
    throw new EmailProviderConfigurationError('Email message must contain 1–20,000 characters.');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(text)}</div>`,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new EmailProviderRequestError('Resend could not be reached. No delivery confirmation was received.');
  }

  if (!response.ok) {
    // Do not forward provider response bodies; they may contain account metadata.
    throw new EmailProviderRequestError(`Resend rejected the request (HTTP ${response.status}).`);
  }

  let payload: { id?: unknown };
  try {
    payload = await response.json() as { id?: unknown };
  } catch {
    throw new EmailProviderRequestError('Resend returned an unreadable response; delivery status is unknown.');
  }
  if (typeof payload.id !== 'string' || !payload.id) {
    throw new EmailProviderRequestError('Resend did not return a message ID; delivery status is unknown.');
  }

  return {
    provider: 'resend',
    status: 'submitted',
    providerMessageId: payload.id,
  };
}
