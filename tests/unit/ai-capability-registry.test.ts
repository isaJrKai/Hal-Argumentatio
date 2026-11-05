import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const registry = readFileSync('src/services/ai/capabilityRegistry.ts', 'utf8');
const server = readFileSync('server.ts', 'utf8');
const dispatcher = readFileSync('src/services/mcp/dispatcher.ts', 'utf8');

describe('HAL provider-agnostic capability registry', () => {
  it('routes provider tool exposure through one central registry', () => {
    expect(server).toContain('getProviderCapabilityTools');
    expect(server).toContain('tools: getProviderCapabilityTools()');
    expect(registry).toContain('HAL_CAPABILITY_REGISTRY');
    expect(registry).toContain('ACTIVE_TOOL_NAMES');
  });

  it('backs every active capability tool with a dispatcher implementation', () => {
    const names = ['hal_get_operational_context', 'hal_create_work_task', 'hal_list_work_tasks', 'hal_execute_hermes_work_task', 'hal_get_financial_health', 'hal_inspect_campaign_anomalies', 'hal_run_what_if_simulation', 'hal_get_loop_context', 'hal_attach_loop_intelligence'];
    for (const name of names) {
      expect(registry).toContain("'" + name + "'");
      expect(dispatcher).toContain("name: '" + name + "'");
    }
  });

  it('keeps website audit, redesign and publishing unavailable until real executors exist', () => {
    expect(registry).toContain("id: 'websites.audit'");
    expect(registry).toContain("id: 'websites.redesign'");
    expect(registry).toContain("id: 'websites.publish'");
    expect(registry).toContain("risk: 'approval_gated'");
    expect(registry).toContain("status: 'planned'");
  });
});
