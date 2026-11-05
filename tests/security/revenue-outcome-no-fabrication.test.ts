import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
const start = server.indexOf("app.post('/api/revenue/outcomes/measure'");
const end = server.indexOf("\n  });", start);
const handler = server.slice(start, end);

describe('revenue outcome measurement integrity', () => {
  it('does not seed synthetic baseline, expected, or actual business metrics', () => {
    expect(handler).not.toMatch(/revenue:\s*5000|revenue:\s*5200|roas:\s*2\.5|roas:\s*3\.0|cpl:\s*45|cac:\s*350/);
    expect(handler).toContain('const baselineMetrics = {};');
    expect(handler).toContain('const expectedMetrics = {};');
    expect(handler).toContain('const actualMetrics = {};');
  });

  it('does not attribute all tenant revenue to an unrelated recommendation', () => {
    expect(handler).not.toContain('from(revenueRecords)');
    expect(handler).toContain("'insufficient_data'");
    expect(handler).toContain('No verified recommendation-to-outcome attribution record exists');
  });

  it('does not manufacture an execution reference or default confidence', () => {
    expect(handler).not.toContain('Exec-Ref-Auto');
    expect(handler).toContain('rec.executionReference || null');
    expect(handler).toContain('rec.confidenceScore ?? 0');
  });
});

const evaluateStart = server.indexOf("app.post('/api/revenue/outcomes/:id/evaluate'");
const evaluateEnd = server.indexOf("\\n  });", evaluateStart);
const evaluateHandler = server.slice(evaluateStart, evaluateEnd);

describe('revenue outcome evaluation integrity', () => {
  it('requires a measured outcome before evaluation', () => {
    expect(evaluateHandler).toContain("outcome.outcomeStatus !== 'measured'");
    expect(evaluateHandler).toContain("return res.status(409)");
  });

  it('requires comparable finite numeric evidence and has no synthetic defaults', () => {
    expect(evaluateHandler).toContain('Number.isFinite(expected[key])');
    expect(evaluateHandler).toContain('Number.isFinite(actual[key])');
    expect(evaluateHandler).not.toMatch(/revenue:\\s*5000|roas:\\s*3\\.0|expected\\.revenue \\|\\| 5000/);
    expect(evaluateHandler).toContain('comparable verified numeric metrics');
  });
});
