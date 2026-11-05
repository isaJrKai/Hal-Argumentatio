import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync('server.ts', 'utf8');
const panelSource = readFileSync('src/components/SystemHealthPanel.tsx', 'utf8');

function routeBetween(startMarker: string, endMarker: string): string {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate route markers: ${startMarker}`);
  return serverSource.slice(start, end);
}

describe('live AI provider diagnostics', () => {
  const route = routeBetween(
    "app.post('/api/system/diagnostics/ai-providers'",
    "app.get('/api/ai/engine-status'"
  );

  it('requires administrator access and probes configured Gemini and Nemotron providers', () => {
    expect(route).toContain("contractorRole !== 'admin'");
    expect(route).toContain('Boolean(process.env.GEMINI_API_KEY)');
    expect(route).toContain('Boolean(process.env.NVIDIA_API_KEY)');
    expect(route).toContain('callGemini(');
    expect(route).toContain('callNemotron(');
  });

  it('returns status and latency only, never provider credentials or raw model output', () => {
    expect(route).toContain('latencyMs');
    expect(route).toContain('errorCode');
    expect(route).toContain('overall:');
    expect(route).not.toContain('apiKey:');
    expect(route).not.toContain('process.env.GEMINI_API_KEY,');
    expect(route).not.toContain('process.env.NVIDIA_API_KEY,');
  });

  it('runs billable live inference only from a manual diagnostics scan', () => {
    expect(panelSource).toContain('const providerProbe = silent');
    expect(panelSource).toContain("requestJson('/api/system/diagnostics/ai-providers', true, 'POST')");
    expect(panelSource).toContain('Live inference verified');
  });
});
