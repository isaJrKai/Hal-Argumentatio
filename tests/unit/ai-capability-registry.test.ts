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

  it('only exposes active capabilities backed by registered dispatcher tools', () => {
    const activeNames = [...registry.matchAll(/status: 'active',[\\s\\S]*?toolNames: \\[([^\\]]*)\\]/g)]
      .flatMap(match => [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]));
    const dispatcherNames = new Set([...dispatcher.matchAll(/name: '([^']+)'/g)].map(match => match[1]));
    expect(activeNames.length).toBeGreaterThan(0);
    for (const name of activeNames) expect(dispatcherNames.has(name)).toBe(true);
    expect(registry).toContain("status: 'planned'");
    expect(registry).toContain("id: 'websites.publish'");
    expect(registry).toContain("risk: 'approval_gated'");
  });

  it('keeps website audit, redesign and publishing unavailable until real executors exist', () => {
    for (const id of ['websites.audit', 'websites.redesign', 'websites.publish']) {
      const start = registry.indexOf(`id: '${id}'`);
      const block = registry.slice(start, registry.indexOf('  },', start));
      expect(block).toContain("status: 'planned'");
      expect(block).toContain('toolNames: []');
    }
  });
});
