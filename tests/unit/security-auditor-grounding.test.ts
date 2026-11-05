import { beforeEach, describe, expect, it, vi } from 'vitest';

const { validateDomainAndDns } = vi.hoisted(() => ({
  validateDomainAndDns: vi.fn()
}));

vi.mock('../../src/lib/networkVerification', () => ({
  validateDomainAndDns
}));

import { securityAuditorSkill } from '../../src/skills/security-auditor';

describe('HAL passive website security auditor', () => {
  beforeEach(() => {
    validateDomainAndDns.mockReset();
  });

  it('reports only DNS and pinned HTTP/TLS evidence actually returned by the verifier', async () => {
    validateDomainAndDns.mockResolvedValue({
      dnsResolved: true,
      httpReachable: true,
      httpStatus: 200,
      sslSecured: true,
      hostname: 'prospect.example',
      ipAddresses: ['93.184.216.34']
    });

    const result = await securityAuditorSkill.execute({ websiteUrl: 'https://prospect.example/path' }, 'tenant-a');

    expect(validateDomainAndDns).toHaveBeenCalledWith('https://prospect.example/path', {
      probeHttp: true,
      timeoutMs: 5000
    });
    expect(result.success).toBe(true);
    expect(result.coverage).toMatchObject({
      dns: 'measured',
      httpReachability: 'measured',
      https: 'measured_success',
      responseHeaders: 'not_measured',
      applicationVulnerabilities: 'not_measured',
      pageContent: 'not_measured'
    });
    expect(result.report).toContain('Successful TLS connection');
    expect(result.report).toContain('HTTP response security headers');
    expect(result.report).toContain('Missing security headers and application vulnerabilities remain unknown.');
    expect(result.report).not.toContain('CSP | Missing | Critical');
    expect(result.report).not.toContain('TLS v1.2 / TLS v1.3 Active');
  });

  it('rejects malformed, credential-bearing and custom-port targets before any network request', async () => {
    await expect(securityAuditorSkill.execute({ websiteUrl: 'not a url' }, 'tenant-a')).rejects.toThrow('valid website URL');
    await expect(securityAuditorSkill.execute({ websiteUrl: 'https://user:pass@example.com' }, 'tenant-a')).rejects.toThrow('without credentials');
    await expect(securityAuditorSkill.execute({ websiteUrl: 'https://example.com:8443' }, 'tenant-a')).rejects.toThrow('without credentials');
    expect(validateDomainAndDns).not.toHaveBeenCalled();
  });

  it('does not turn failed probes into invented security findings', async () => {
    validateDomainAndDns.mockResolvedValue({
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname: 'unknown.example',
      rejectionReason: 'DNS resolution failed: NXDOMAIN'
    });

    const result = await securityAuditorSkill.execute({ websiteUrl: 'https://unknown.example' }, 'tenant-a');

    expect(result.coverage.dns).toBe('failed');
    expect(result.coverage.https).toBe('not_confirmed');
    expect(result.evidence.rejectionReason).toContain('NXDOMAIN');
    expect(result.report).toContain('Not confirmed');
    expect(result.report).toContain('Not measured in this run');
    expect(result.report).not.toContain('Detected contact forms');
  });
});
