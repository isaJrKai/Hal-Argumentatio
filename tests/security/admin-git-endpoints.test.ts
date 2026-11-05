import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Administrative Git endpoint security', () => {
  it('requires administrator authorization to inspect server Git state', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(source).toContain("app.get('/api/admin/git/status', authenticate, requireRole('admin')");
  });

  it('does not execute request-controlled Git commands from the application server', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const routeStart = source.indexOf("app.post('/api/admin/git/push', authenticate, requireRole('admin')");
    const routeEnd = source.indexOf('// ─── WHITE-LABEL CLIENT PROPOSAL GENERATOR', routeStart);
    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const route = source.slice(routeStart, routeEnd);
    expect(route).toContain("res.status(410)");
    expect(route).toContain("GIT_PUSH_DISABLED");
    expect(route).not.toContain('execSync(');
    expect(route).not.toContain('execFileSync(');
  });
});
