import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyToken, signToken, getJwtSecret } from '../../src/lib/auth';

describe('Security: Authentication & Fail-Open Regression Tests', () => {
  describe('JWT Secret Audit', () => {
    it('verifies that a non-empty JWT secret is configured', () => {
      const secret = getJwtSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });
  });

  describe('Forged Token Rejection (Fail-Closed Verification)', () => {
    it('strictly rejects tokens with forged or invalid signatures', () => {
      const secret = getJwtSecret();
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        contractorId: 'tenant_victim_123',
        email: 'victim@target.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600
      })).toString('base64url');
      const forgedSignature = 'completely_invalid_forged_signature';
      const attackToken = `${header}.${payload}.${forgedSignature}`;

      const verified = verifyToken(attackToken, secret);

      // SECURITY AUDIT ASSERTION:
      // Must return null (rejected). No impersonation permitted!
      expect(verified).toBeNull();
    });
  });

  describe('Malformed Token Rejection (Fail-Closed Verification)', () => {
    it('strictly rejects malformed tokens without falling back to default admin', () => {
      const garbageToken = 'random_malformed_string_xyz';
      const session = verifyToken(garbageToken);

      // PROOF OF REMEDIATION:
      // Must return null, never fall back to default_contractor or admin!
      expect(session).toBeNull();
    });

    it('strictly rejects tokens with missing parts', () => {
      expect(verifyToken('part1.part2')).toBeNull();
      expect(verifyToken('')).toBeNull();
      expect(verifyToken('...')).toBeNull();
    });
  });

  describe('Mandatory Numeric Expiration (Fail-Closed exp)', () => {
    it('strictly rejects tokens with missing exp claim', () => {
      const secret = getJwtSecret();
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        contractorId: 'tenant_no_exp',
        email: 'test@target.com',
        role: 'user'
      })).toString('base64url');
      const signatureInput = `${header}.${payload}`;
      const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');
      const token = `${signatureInput}.${signature}`;

      const verified = verifyToken(token, secret);
      expect(verified).toBeNull();
    });

    it('strictly rejects tokens with non-numeric exp claim', () => {
      const secret = getJwtSecret();
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        contractorId: 'tenant_string_exp',
        email: 'test@target.com',
        role: 'user',
        exp: '2099-01-01T00:00:00Z' // String instead of number
      })).toString('base64url');
      const signatureInput = `${header}.${payload}`;
      const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');
      const token = `${signatureInput}.${signature}`;

      const verified = verifyToken(token, secret);
      expect(verified).toBeNull();
    });

    it('strictly rejects expired tokens (past exp)', () => {
      const secret = getJwtSecret();
      const expiredToken = signToken(
        { contractorId: 'test_tenant', email: 'test@example.com', role: 'user' },
        secret,
        -3600 // Expired in the past
      );

      const verified = verifyToken(expiredToken, secret);
      expect(verified).toBeNull();
    });

    it('accepts tokens with valid future numeric exp', () => {
      const secret = getJwtSecret();
      const validToken = signToken(
        { contractorId: 'test_tenant', email: 'test@example.com', role: 'user' },
        secret,
        3600 // 1 hour in future
      );

      const verified = verifyToken(validToken, secret);
      expect(verified).not.toBeNull();
      expect(verified?.contractorId).toBe('test_tenant');
      expect(typeof verified?.exp).toBe('number');
      expect(verified!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('Legitimate Authentication Flow', () => {
    it('verifies valid, active tokens created via signToken', () => {
      const secret = getJwtSecret();
      const validToken = signToken(
        { contractorId: 'tenant_apex_1', email: 'owner@apexroofing.com', role: 'admin' },
        secret,
        3600
      );

      const verified = verifyToken(validToken, secret);
      expect(verified).not.toBeNull();
      expect(verified?.contractorId).toBe('tenant_apex_1');
      expect(verified?.email).toBe('owner@apexroofing.com');
      expect(verified?.role).toBe('admin');
      expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});
