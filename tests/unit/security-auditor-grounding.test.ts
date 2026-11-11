import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/networkVerification', () => ({
  validateDomainAndDns: vi.fn()
}));

import { validateDomainAndDns } from '../../src/lib/networkVerification';
import { securityAuditorSkill } from '../../src/skills/security-auditor';

const validateMock = vi.mocked(validateDomainAndDns);

describe('security auditor evidence grounding', () => {
  beforeEach(() => validateMock.mockReset());

  it('reports only measured network evidence and explicitly excludes unmeasured headers', async () => {
    validateMock.mockResolvedValue({
      hostname: 'example.com',
      dnsResolved: true,
      httpReachable: true,
      httpStatus: 200,
      sslSecured: true,
      ipAddresses: ['93.184.216.34']
    });

    const result = await securityAuditorSkill.execute({ websiteUrl: 'https://example.com' }, 'tenant-1');

    expect(result.report).toContain('DNS resolution:** Resolved');
    expect(result.report).toContain('HTTP status:** 200');
    expect(result.report).toContain('HTTPS/TLS probe:** HTTPS connection established');
    expect(result.report).toContain('Not measured in this run');
    expect(result.report).toContain('Recommendations are general guidance');
    expect(result.report).not.toContain('HSTS (Strict-Transport-Security) | Missing');
    expect(result.report).not.toContain('TLS v1.2 / TLS v1.3 Active');
  });

  it('does not expose IP addresses when DNS verification fails', async () => {
    validateMock.mockResolvedValue({
      hostname: 'private.example.com',
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      rejectionReason: 'DNS resolution failed'
    });

    const result = await securityAuditorSkill.execute({ websiteUrl: 'https://private.example.com' }, 'tenant-1');

    expect(result.report).toContain('DNS resolution:** Failed');
    expect(result.report).toContain('Resolved public IPs:** Not available');
    expect(result.evidence).not.toHaveProperty('ipAddresses');
  });

  it('reports a failed network probe without inventing findings', async () => {
    validateMock.mockResolvedValue({
      hostname: 'example.com',
      dnsResolved: true,
      httpReachable: false,
      sslSecured: false,
      rejectionReason: 'HTTPS and HTTP probes failed'
    });

    const result = await securityAuditorSkill.execute({ websiteUrl: 'https://example.com' }, 'tenant-1');

    expect(result.report).toContain('HTTP reachability:** Not reachable');
    expect(result.report).toContain('Probe error:** HTTPS and HTTP probes failed');
    expect(result.report).not.toContain('Missing | High');
  });
});
