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
    expect(route).toContain('void authenticate(req, res, () =>');
    expect(route).toContain('(req as any).contractorId');
    expect(route).toContain('const decoded = verifyToken(token)');
    expect(route).toContain("res.setHeader('Cache-Control', 'no-store");
    expect(route).toContain("res.setHeader('Referrer-Policy', 'no-referrer')");
  });

  it('revalidates token expiry, logout revocation and account suspension while the stream is open', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const routeStart = source.indexOf("app.get('/api/events', (req, res) => {");
    const routeEnd = source.indexOf('// Apply a small, independent IP budget', routeStart);
    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const route = source.slice(routeStart, routeEnd);
    expect(route).toContain('setInterval(async () =>');
    expect(route).toContain('const decoded = verifyToken(token)');
    expect(route).toContain('decoded.contractorId !== contractorId');
    expect(route).toContain('.from(revokedTokens)');
    expect(route).toContain('.from(contractors)');
    expect(route).toContain("account.accountStatus === 'suspended'");
    expect(route).toContain('closeStream();');
    expect(route).toContain('res.end()');
  });
});
