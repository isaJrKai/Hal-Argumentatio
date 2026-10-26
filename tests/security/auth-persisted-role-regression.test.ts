import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// These checks guard the server's authorization boundary without importing
// server.ts, which starts the HTTP listener as a side effect.
const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const authStart = serverSource.indexOf('async function authenticate(');
const authEnd = serverSource.indexOf('// Middleware: Require Admin Role', authStart);
const authMiddleware = serverSource.slice(authStart, authEnd);
const meStart = serverSource.indexOf("app.get('/api/auth/me'");
const meEnd = serverSource.indexOf("app.post('/api/auth/register'", meStart);
const authMeRoute = serverSource.slice(meStart, meEnd);

describe('Security: persisted account authorization', () => {
  it('checks the current persisted account before authorizing a protected request', () => {
    expect(authStart).toBeGreaterThanOrEqual(0);
    expect(authEnd).toBeGreaterThan(authStart);
    expect(authMiddleware).toContain('await pgDb.select().from(contractors)');
    expect(authMiddleware).toContain('if (!contractor)');
    expect(authMiddleware).toContain("return res.status(503)");
    expect(authMiddleware).toContain("return res.status(401)");
    expect(authMiddleware).toContain("contractor.role === 'admin' ? 'admin' : 'user'");
  });

  it('does not trust stale JWT role claims or grant admin based on email or seed IDs', () => {
    expect(authMiddleware).not.toContain('decoded.role');
    expect(authMiddleware).not.toContain("contractorId === 'con_admin_seed'");
    expect(authMiddleware).not.toContain("contractorId === 'con_isaac_seed'");
    expect(authMeRoute).not.toContain("email.includes('admin')");
    expect(authMeRoute).not.toContain("email.includes('kaiso')");
    expect(authMeRoute).not.toContain("contractorId === 'con_admin_seed'");
    expect(authMeRoute).not.toContain("contractorId === 'con_isaac_seed'");
    expect(authMeRoute).not.toContain('db.getContractorById');
  });

  it('fails closed when /api/auth/me cannot verify the current database record', () => {
    expect(authMeRoute).toContain('await pgDb.select().from(contractors)');
    expect(authMeRoute).toContain("return res.status(401)");
    expect(authMeRoute).toContain("return res.status(503)");
  });
});
