/**
 * Client for the official Nous Research Hermes Agent API server.
 * HAL remains the authorization boundary; the stable memory key is tenant-scoped
 * and the transcript ID is conversation-scoped.
 */
export async function callNousHermes(args: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tenantId: string;
  conversationId: string;
}): Promise<{ text: string; model: string }> {
  const baseUrl = (process.env.HERMES_AGENT_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.HERMES_AGENT_API_KEY || '').trim();
  if (!baseUrl || !apiKey) {
    throw new Error('Nous Hermes fallback is not configured. Set HERMES_AGENT_URL and HERMES_AGENT_API_KEY.');
  }
  if (!args.tenantId || !args.conversationId) {
    throw new Error('A verified tenant ID and conversation ID are required for Hermes memory isolation.');
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Key': `hal:tenant:${args.tenantId}`,
      'X-Hermes-Session-Id': `hal-chat:${args.conversationId}`
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: 'hermes-agent',
      messages: args.messages,
      stream: false
    })
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Nous Hermes API failed (${response.status}): ${detail}`);
  }
  const payload: any = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Nous Hermes returned no assistant text.');
  }
  return { text: text.trim(), model: payload.model || 'hermes-agent' };
}
