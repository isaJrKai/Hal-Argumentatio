import { describe, it, expect } from 'vitest';

// Explicit scope for tests that exercise MCP tools; never use this value outside tests.
process.env.HAL_MCP_CONTRACTOR_ID ||= 'test_mcp_scope';
import crypto from 'node:crypto';
import express from 'express';
import supertest from 'supertest';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildHalMcpServer } from '../../src/services/mcp/halMcpServer';

describe('HAL Read-Only MCP Endpoint (/mcp/:secret)', () => {
  const TEST_VALID_SECRET = 'this-is-a-valid-test-mcp-secret-24chars';

  function createTestApp(secretEnvValue: string | undefined) {
    const app = express();

    app.post('/mcp/:secret', express.json(), async (req, res) => {
      const expected = secretEnvValue ?? '';
      const a = Buffer.from(req.params.secret);
      const b = Buffer.from(expected);
      if (expected.length < 24 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(404).json({ error: 'Not found' });
      }
      const server = buildHalMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });

    app.all('/mcp/:secret', (_req, res) => res.status(405).json({ error: 'Use POST' }));
    return app;
  }

  it('rejects with 404 if MCP_SECRET is missing from environment', async () => {
    const app = createTestApp(undefined);
    const res = await supertest(app)
      .post('/mcp/some-random-secret-key-1234')
      .send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('rejects with 404 if MCP_SECRET is shorter than 24 characters', async () => {
    const app = createTestApp('short-secret-123');
    const res = await supertest(app)
      .post('/mcp/short-secret-123')
      .send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('rejects with 404 if provided secret does not match MCP_SECRET', async () => {
    const app = createTestApp(TEST_VALID_SECRET);
    const res = await supertest(app)
      .post('/mcp/wrong-secret-token-that-is-over-24-chars-long')
      .send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns 405 on non-POST requests to /mcp/:secret', async () => {
    const app = createTestApp(TEST_VALID_SECRET);
    const getRes = await supertest(app).get(`/mcp/${TEST_VALID_SECRET}`);
    expect(getRes.status).toBe(405);
    expect(getRes.body).toEqual({ error: 'Use POST' });

    const putRes = await supertest(app).put(`/mcp/${TEST_VALID_SECRET}`);
    expect(putRes.status).toBe(405);
  });

  it('registers all required read-only tools on buildHalMcpServer', () => {
    const server = buildHalMcpServer();
    const tools = (server as any)._registeredTools;

    expect(tools).toHaveProperty('hal_status');
    expect(tools).toHaveProperty('hal_list_prospects');
    expect(tools).toHaveProperty('hal_get_prospect');
    expect(tools).toHaveProperty('hal_pipeline_summary');
    expect(tools).toHaveProperty('hal_list_outreach');
    expect(tools).toHaveProperty('hal_list_campaigns');
    expect(tools).toHaveProperty('hal_list_missions');
    expect(tools).toHaveProperty('hal_list_client_projects');
    expect(tools).toHaveProperty('hal_list_events');
    expect(tools).toHaveProperty('hal_list_audits');
    expect(tools).toHaveProperty('hal_list_tasks');
    expect(tools).toHaveProperty('hal_list_recommendations');
    expect(tools).toHaveProperty('hal_list_forecasts');
    expect(tools).toHaveProperty('hal_list_revenue');
    expect(tools).toHaveProperty('hal_list_debriefs');
    expect(tools).toHaveProperty('hal_list_loops');
    expect(tools).toHaveProperty('hal_list_incidents');
    expect(tools).toHaveProperty('hal_list_artifacts');
    expect(tools).toHaveProperty('hal_list_notifications');

    // Confirm annotations are read-only and non-destructive
    for (const toolName of Object.keys(tools)) {
      const tool = tools[toolName];
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.destructiveHint).toBe(false);
      expect(tool.annotations.idempotentHint).toBe(true);
      expect(tool.annotations.openWorldHint).toBe(false);
    }
  });

  it('successfully executes hal_status and returns db row counts', async () => {
    const server = buildHalMcpServer();
    const statusTool = (server as any)._registeredTools['hal_status'];
    const res = await statusTool.handler({});
    expect(res).toHaveProperty('content');
    expect(res.content[0].type).toBe('text');
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed).toHaveProperty('table_row_counts');
  });

  it('successfully executes hal_list_prospects and respects limit and offset', async () => {
    const server = buildHalMcpServer();
    const listTool = (server as any)._registeredTools['hal_list_prospects'];
    const res = await listTool.handler({ limit: 3, offset: 0 });
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('prospects');
    expect(parsed.count).toBeLessThanOrEqual(3);
  });

  it('fails closed when no explicit MCP account scope or account can be resolved', async () => {
    const originalEnv = process.env.HAL_MCP_CONTRACTOR_ID;
    try {
      delete process.env.HAL_MCP_CONTRACTOR_ID;
      const { getEffectiveContractorId } = await import('../../src/services/mcp/halMcpServer');
      await expect(getEffectiveContractorId()).rejects.toThrow(/HAL_MCP_CONTRACTOR_ID/);
    } finally {
      if (originalEnv !== undefined) {
        process.env.HAL_MCP_CONTRACTOR_ID = originalEnv;
      }
    }
  });

  it('uses HAL_MCP_CONTRACTOR_ID override when explicitly provided', async () => {
    const originalEnv = process.env.HAL_MCP_CONTRACTOR_ID;
    try {
      process.env.HAL_MCP_CONTRACTOR_ID = 'custom_tenant_override';
      const { getEffectiveContractorId } = await import('../../src/services/mcp/halMcpServer');
      const resolved = await getEffectiveContractorId();
      expect(resolved).toBe('custom_tenant_override');
    } finally {
      if (originalEnv !== undefined) {
        process.env.HAL_MCP_CONTRACTOR_ID = originalEnv;
      } else {
        delete process.env.HAL_MCP_CONTRACTOR_ID;
      }
    }
  });
});

