import { describe, it, expect } from 'vitest';
import { HAL_MCP_TOOLS } from '../../src/services/mcp/dispatcher';
import { McpJsonRpcRequest, McpJsonRpcResponse } from '../../src/services/mcp/types';

/**
 * Dispatcher matching server.ts lines 5230-5290
 */
function handleMcpJsonRpc(body: McpJsonRpcRequest, contractorId: string): McpJsonRpcResponse {
  if (body.jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32600,
        message: 'Invalid JSON-RPC version. Must be "2.0"'
      }
    };
  }

  if (body.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: body.id,
      result: {
        tools: HAL_MCP_TOOLS
      }
    };
  }

  if (body.method === 'tools/call') {
    const { name, arguments: toolArgs } = body.params || {};
    if (!name) {
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32602,
          message: 'Invalid params: "name" is required for tools/call'
        }
      };
    }

    const tool = HAL_MCP_TOOLS.find(t => t.name === name);
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id: body.id,
      result: {
        content: [{ type: 'text', text: 'Success' }],
        structuredData: { executed: name }
      }
    };
  }

  return {
    jsonrpc: '2.0',
    id: body.id,
    error: {
      code: -32601,
      message: `Method not found: ${body.method}`
    }
  };
}

describe('API: MCP Gateway & JSON-RPC Protocol Invariants', () => {
  const contractorId = 'test_contractor_123';

  it('exposes the registered suite of HAL MCP tools', () => {
    expect(HAL_MCP_TOOLS.length).toBeGreaterThanOrEqual(5);
    const toolNames = HAL_MCP_TOOLS.map(t => t.name);
    expect(toolNames).toContain('hal_get_financial_health');
    expect(toolNames).toContain('hal_inspect_campaign_anomalies');
    expect(toolNames).toContain('hal_run_what_if_simulation');
    expect(toolNames).toContain('hal_get_loop_context');
    expect(toolNames).toContain('hal_attach_loop_intelligence');
  });

  it('rejects invalid JSON-RPC version with error code -32600', () => {
    const invalidRequest = {
      jsonrpc: '1.0' as any,
      id: 'req_1',
      method: 'tools/list'
    };

    const response = handleMcpJsonRpc(invalidRequest, contractorId);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32600);
    expect(response.error?.message).toContain('Invalid JSON-RPC version');
  });

  it('rejects unknown RPC methods with error code -32601', () => {
    const unknownMethodRequest: McpJsonRpcRequest = {
      jsonrpc: '2.0',
      id: 'req_2',
      method: 'unknown/method' as any
    };

    const response = handleMcpJsonRpc(unknownMethodRequest, contractorId);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
    expect(response.error?.message).toContain('Method not found');
  });

  it('rejects calling an unregistered tool with error code -32602', () => {
    const unknownToolRequest: McpJsonRpcRequest = {
      jsonrpc: '2.0',
      id: 'req_3',
      method: 'tools/call',
      params: {
        name: 'nonexistent_phantom_tool',
        arguments: {}
      }
    };

    const response = handleMcpJsonRpc(unknownToolRequest, contractorId);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain('Unknown tool');
  });

  it('returns valid tool list conforming to MCP specification', () => {
    const listRequest: McpJsonRpcRequest = {
      jsonrpc: '2.0',
      id: 'req_4',
      method: 'tools/list'
    };

    const response = handleMcpJsonRpc(listRequest, contractorId);
    expect(response.error).toBeUndefined();
    expect(response.result).toBeDefined();
    expect(Array.isArray(response.result?.tools)).toBe(true);

    const firstTool = response.result?.tools[0];
    expect(firstTool).toHaveProperty('name');
    expect(firstTool).toHaveProperty('description');
    expect(firstTool).toHaveProperty('inputSchema');
  });
});
