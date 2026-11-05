import { afterEach, describe, expect, it, vi } from 'vitest';
import { callAnthropicWithTools } from '../../src/services/anthropic';

describe('HAL Anthropic adapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the tenant credential and returns the model actually reported by Anthropic', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: 'claude-haiku-5-5',
      content: [{ type: 'text', text: 'Ready.' }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await callAnthropicWithTools({
      apiKey: 'tenant-secret',
      system: 'HAL system',
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers['x-api-key']).toBe('tenant-secret');
    expect(result).toEqual({ text: 'Ready.', toolCalls: [], model: 'claude-haiku-5-5' });
  });

  it('executes only server-supplied tools and returns their receipts', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: 'claude-haiku-5-5',
        content: [{ type: 'tool_use', id: 'tool_1', name: 'read_workspace', input: { scope: 'summary' } }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: 'claude-haiku-5-5',
        content: [{ type: 'text', text: 'Workspace inspected.' }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const execute = vi.fn().mockResolvedValue({ success: true, count: 3 });

    const result = await callAnthropicWithTools({
      apiKey: 'tenant-secret',
      system: 'HAL system',
      messages: [{ role: 'user', content: 'Inspect the workspace' }],
      tools: [{ name: 'read_workspace', description: 'Read scoped workspace data', inputSchema: { type: 'object', properties: { scope: { type: 'string' } } } }],
      execute
    });

    expect(execute).toHaveBeenCalledWith('read_workspace', { scope: 'summary' });
    expect(result.text).toBe('Workspace inspected.');
    expect(result.toolCalls).toHaveLength(1);
  });
});
