import { describe, expect, it } from 'vitest';
import { classifyHermesToolResult } from '../../src/lib/hermesExecution';

describe('Hermes MCP tool outcome classification', () => {
  it('marks evidence-bearing read results as successful', () => {
    expect(classifyHermesToolResult({ rows: [{ id: 'lead_1' }], evidenceRows: 1 })).toBe('succeeded');
    expect(classifyHermesToolResult({ success: true, result: { totalRevenue: 1200 } })).toBe('succeeded');
  });

  it('does not report a capability that explicitly returned unavailable as successful', () => {
    expect(classifyHermesToolResult({
      status: 'unavailable',
      simulationStored: false,
      executionEnabled: false
    })).toBe('unavailable');
    expect(classifyHermesToolResult({ available: false, reason: 'provider_not_configured' })).toBe('unavailable');
    expect(classifyHermesToolResult({ requiresApproval: true, status: 'blocked' })).toBe('unavailable');
  });

  it('preserves explicit tool failures', () => {
    expect(classifyHermesToolResult({ success: false, error: 'query failed' })).toBe('failed');
    expect(classifyHermesToolResult({ status: 'failed' })).toBe('failed');
    expect(classifyHermesToolResult({ isError: true })).toBe('failed');
    expect(classifyHermesToolResult(null)).toBe('failed');
    expect(classifyHermesToolResult('not a structured result')).toBe('failed');
  });

  it('keeps a completed tool invocation distinct from unavailable business capability', () => {
    const unavailable = { status: 'unavailable', message: 'No validated marginal-response model is connected.' };
    expect(classifyHermesToolResult(unavailable)).not.toBe('succeeded');
  });
});
