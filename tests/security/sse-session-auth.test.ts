import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('SSE authentication security regression', () => {
  it('routes EventSource query tokens through persisted authentication and revocation checks', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const routeStart = source.indexOf("app.get('/api/events', (req, res) => {");
    const routeEnd = source.indexOf('// Apply a small, independent IP budget', routeStart);
    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(routeEnd).toBeGreaterThan(routeStart);

    const route = source.slice(routeStart, routeEnd);
    expect(route).toContain('authenticate(req, res');
    expect(route).toContain('(req as any).contractorId');
    expect(route).not.toContain('verifyToken(token)');
    expect(route).toContain("res.setHeader('Cache-Control', 'no-store");
    expect(route).toContain("res.setHeader('Referrer-Policy', 'no-referrer')");
  });
});
