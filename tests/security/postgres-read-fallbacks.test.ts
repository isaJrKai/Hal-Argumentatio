import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync('server.ts', 'utf8');

function routeBetween(startMarker: string, endMarker: string): string {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate route markers: ${startMarker}`);
  return serverSource.slice(start, end);
}

describe('PostgreSQL-authoritative read failure behavior', () => {
  const routes = [
    routeBetween("app.get('/api/leads'", "app.post('/api/leads'"),
    routeBetween("app.get('/api/revenues'", "// ─── CAMPAIGNS & PERFORMANCE"),
    routeBetween("app.get('/api/campaigns'", "app.get('/api/campaigns/:id/performance'"),
    routeBetween("app.get('/api/recommendations'", "app.post('/api/recommendations/:id/approve'"),
    routeBetween("app.get('/api/forecasts'", "app.get('/api/learning-insights'"),
    routeBetween("app.get('/api/learning-insights'", "// ─── SKILL SYSTEM ENDPOINTS"),
    routeBetween("app.get('/api/scheduler/jobs'", "app.post('/api/scheduler'")
  ];

  it('never reports stale local JSON data as a successful PostgreSQL response', () => {
    for (const route of routes) {
      expect(route).toContain("res.status(503)");
      expect(route).toContain("X-HAL-Data-Source', 'postgres-unavailable");
      expect(route).not.toContain('tenant-local-json-fallback');
      expect(route).not.toContain('return res.status(200).json(db.');
    }
  });

  it('includes password-reset storage in application readiness checks', () => {
    const readinessRoute = routeBetween("app.get('/api/ready'", '// Public Link & Community Sandbox Status & Controls');
    expect(readinessRoute).toContain("to_regclass('public.password_reset_tokens')");
  });
});
