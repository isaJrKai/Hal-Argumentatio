import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync('server.ts', 'utf8');

function routeBetween(startMarker: string, endMarker: string): string {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate route markers: ${startMarker}`);
  return serverSource.slice(start, end);
}

describe('Authentication route security regressions', () => {
  const registrationRoute = routeBetween(
    "app.post('/api/auth/register'",
    "app.post('/api/auth/login'"
  );
  const passwordLoginRoute = routeBetween(
    "app.post('/api/auth/login'",
    "// Google sign-in: verify Firebase's signed ID token"
  );
  const googleLoginRoute = routeBetween(
    "app.post('/api/auth/google'",
    "app.post('/api/auth/logout'"
  );

  it('keeps registration PostgreSQL-backed and fails closed on database errors', () => {
    expect(registrationRoute).toContain('pgDb.insert(contractors)');
    expect(registrationRoute).toContain('Registration service unavailable');
    expect(registrationRoute).not.toContain('db.addContractor');
  });

  it('does not issue password sessions from local-only accounts or bootstrap admins during login', () => {
    expect(passwordLoginRoute).toContain('pgDb.select()');
    expect(passwordLoginRoute).toContain('checkRateLimit(req, res, cleanEmail)');
    expect(passwordLoginRoute).not.toContain('db.getContractorByEmail');
    expect(passwordLoginRoute).not.toContain('db.addContractor');
    expect(passwordLoginRoute).not.toContain('admin@kaislead.com');
  });

  it('requires server-side Firebase verification and never promotes a first Google user to admin', () => {
    expect(googleLoginRoute).toContain('verifyFirebaseGoogleIdToken(idToken, firebaseApiKey)');
    expect(googleLoginRoute).toContain('identity.email');
    expect(googleLoginRoute).not.toContain('isFirstAccount');
    expect(googleLoginRoute).not.toContain("isFirstAccount");
    expect(googleLoginRoute).not.toContain("cleanEmail === 'admin@kaislead.com'");
  });
});
