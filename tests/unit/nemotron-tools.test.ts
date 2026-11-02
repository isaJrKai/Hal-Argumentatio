import { afterEach, describe, expect, it, vi } from 'vitest';
import { callNemotronWithTools } from '../../src/services/nemotron';

const tool = {
  name: 'hal_get_operational_context',
  description: 'Read tenant-scoped business context.',
  inputSchema: { type: 'object', properties: {} }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Nemotron authenticated function calling', () => {
  it('executes a declared tool and returns its result to the model', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        choices: [{ message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 'call_1', type: 'function', function: { name: tool.name, arguments: '{}' } }]
        } }]
      }))
      .mockResolvedValueOnce(jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'I found the latest workspace records.' } }]
      }));
    vi.stubGlobal('fetch', fetchMock);
    const execute = vi.fn().mockResolvedValue({ recentLeads: [{ id: 'lead_1' }] });

    const result = await callNemotronWithTools(
      [{ role: 'system', content: 'You are HAL.' }, { role: 'user', content: 'Inspect my workspace.' }],
      [tool],
      execute
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(tool.name, {});
    expect(result.text).toBe('I found the latest workspace records.');
    expect(result.toolCalls).toHaveLength(1);
    const secondPayload = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondPayload.messages.some((message: any) => message.role === 'tool' && message.tool_call_id === 'call_1')).toBe(true);
  });

  it('does not repeat a completed tool action when the provider fails afterward', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        choices: [{ message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 'call_2', type: 'function', function: { name: tool.name, arguments: '{}' } }]
        } }]
      }))
      .mockResolvedValueOnce(jsonResponse({ error: 'temporary outage' }, 503));
    vi.stubGlobal('fetch', fetchMock);
    const execute = vi.fn().mockResolvedValue({ tasks: [] });

    const result = await callNemotronWithTools(
      [{ role: 'user', content: 'Inspect tasks.' }],
      [tool],
      execute
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.text).toContain('no additional actions were retried');
  });
});
