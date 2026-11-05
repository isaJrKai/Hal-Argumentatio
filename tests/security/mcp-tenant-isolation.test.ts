import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Legacy MCP tenant isolation', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'src/services/mcp/halMcpServer.ts'), 'utf8');

  it('scopes status event and scheduler counts to the configured contractor', () => {
    expect(source).toContain('.from(leadEvents).innerJoin(leads, eq(leadEvents.leadId, leads.id)).where(eq(leads.contractorId, contractorId))');
    expect(source).toContain('.from(schedulerJobs).where(eq(schedulerJobs.contractorId, contractorId))');
  });

  it('joins lead events to their owning tenant before returning event history', () => {
    const start = source.indexOf("server.registerTool('hal_list_events'");
    const end = source.indexOf("server.registerTool('hal_list_audits'", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const route = source.slice(start, end);
    expect(route).toContain('.innerJoin(leads, eq(leadEvents.leadId, leads.id))');
    expect(route).toContain('.where(eq(leads.contractorId, contractorId))');
  });

  it('retains contractor ownership in Hermes artifact update writes', () => {
    const hermes = readFileSync(path.resolve(process.cwd(), 'src/services/hermesLab.ts'), 'utf8');
    expect(hermes).toContain('eq(hermesLabArtifacts.id, currentArtifact.id)');
    expect(hermes).toContain('eq(hermesLabArtifacts.contractorId, contractorId)');
    expect(hermes).toContain('.where(and(');
  });

  it('filters scheduled jobs by contractor before pagination', () => {
    const start = source.indexOf("server.registerTool('hal_list_tasks'");
    const end = source.indexOf("server.registerTool('hal_list_recommendations'", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const route = source.slice(start, end);
    expect(route).toContain('.where(eq(schedulerJobs.contractorId, contractorId))');
  });
});
