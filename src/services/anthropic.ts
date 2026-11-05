/**
 * Anthropic Messages adapter for HAL's authenticated, tenant-scoped AI gateway.
 * Tool execution is delegated only to the server-supplied HAL MCP runtime.
 */
export type AnthropicChatMessage = { role: 'user' | 'assistant'; content: string | any[] };

export async function callAnthropicWithTools(args: {
  apiKey: string;
  system: string;
  messages: AnthropicChatMessage[];
  tools?: Array<{ name: string; description: string; inputSchema: { type: 'object'; properties: Record<string, any>; required?: string[] } }>;
  execute?: (name: string, input: Record<string, any>) => Promise<any>;
  model?: string;
}): Promise<{ text: string; toolCalls: Array<{ name: string; result: any }>; model: string }> {
  const model = args.model || process.env.HAL_ANTHROPIC_MODEL || 'claude-haiku-5-5';
  const tools = (args.tools || []).map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema
  }));
  const messages: AnthropicChatMessage[] = args.messages.map(message => ({ ...message }));
  const toolCalls: Array<{ name: string; result: any }> = [];

  for (let round = 0; round < 4; round += 1) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': args.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        system: args.system,
        messages,
        ...(tools.length && args.execute ? { tools, tool_choice: { type: 'auto' } } : {})
      })
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Anthropic Messages API failed (${response.status}): ${detail}`);
    }

    const payload: any = await response.json();
    const blocks = Array.isArray(payload.content) ? payload.content : [];
    const text = blocks.filter((block: any) => block.type === 'text' && typeof block.text === 'string')
      .map((block: any) => block.text).join('\n').trim();
    const calls = blocks.filter((block: any) => block.type === 'tool_use' && typeof block.name === 'string');

    if (!calls.length || !args.execute) {
      return { text, toolCalls, model: payload.model || model };
    }

    messages.push({ role: 'assistant', content: blocks });
    const results: any[] = [];
    for (const call of calls.slice(0, 4)) {
      let result: any;
      try {
        result = await args.execute(call.name, call.input && typeof call.input === 'object' ? call.input : {});
      } catch (error: any) {
        result = { success: false, error: String(error?.message || 'HAL tool execution failed.').slice(0, 500) };
      }
      toolCalls.push({ name: call.name, result });
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify(result ?? null).slice(0, 12000),
        ...(result?.success === false ? { is_error: true } : {})
      });
    }
    messages.push({ role: 'user', content: results });
  }

  return {
    text: toolCalls.length
      ? 'HAL completed the available approved tool calls. The agent reached its four-round response limit; review Work History for each recorded result.'
      : '',
    toolCalls,
    model
  };
}
