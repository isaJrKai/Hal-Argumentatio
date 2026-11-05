import { Skill } from './types';
import { validateDomainAndDns } from '../lib/networkVerification';

export const securityAuditorSkill: Skill = {
  id: 'security_auditor',
  name: 'SSL & Header Security Auditor',
  description: 'Performs a bounded, passive DNS and HTTPS reachability check. Response-header and application vulnerability checks are reported as not yet measured.',
  category: 'research',
  icon: 'Globe',
  inputs: [
    {
      name: 'websiteUrl',
      label: 'Website URL',
      type: 'string',
      required: true,
      defaultValue: '',
    }
  ],
  execute: async (inputs) => {
    const rawWebsiteUrl = String(inputs.websiteUrl || '').trim();
    if (!rawWebsiteUrl) {
      throw new Error('Website URL is required for security audit');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(/^https?:\/\//i.test(rawWebsiteUrl) ? rawWebsiteUrl : `https://${rawWebsiteUrl}`);
    } catch {
      throw new Error('Enter a valid website URL.');
    }

    if (
      !['http:', 'https:'].includes(parsedUrl.protocol) ||
      parsedUrl.username ||
      parsedUrl.password ||
      !parsedUrl.hostname ||
      parsedUrl.port
    ) {
      throw new Error('Enter a public HTTP or HTTPS website URL without credentials or a custom port.');
    }

    // The shared verifier resolves DNS, rejects non-public/reserved destinations,
    // pins the selected public IP for the request, and does not follow redirects.
    // Keep this capability passive: no port scans, exploit attempts, form submits,
    // authentication tests, or arbitrary path crawling.
    const evidence = await validateDomainAndDns(parsedUrl.toString(), {
      probeHttp: true,
      timeoutMs: 5000
    });

    const lines = [
      '## Passive website security connectivity report',
      '',
      '**Scope:** DNS resolution and a pinned HTTP/TLS reachability probe only.',
      '**Evidence rule:** A successful connectivity check is not a full security audit. No vulnerability or exploitability claim is made.',
      '',
      `- **Submitted URL:** ${parsedUrl.origin}`,
      `- **Resolved hostname:** ${evidence.hostname || 'Not resolved'}`,
      `- **Public DNS resolution:** ${evidence.dnsResolved ? 'Passed' : 'Failed / unavailable'}`,
      `- **HTTP reachability:** ${evidence.httpReachable ? 'Reachable' : 'Not confirmed'}`,
      `- **Observed response status:** ${evidence.httpStatus ?? 'Not available'}`,
      `- **HTTPS probe:** ${evidence.sslSecured ? 'Successful TLS connection' : 'Not confirmed'}`,
      `- **Resolved IPs:** ${evidence.ipAddresses?.join(', ') || 'Not available'}`,
      '',
      '### Not measured in this run',
      '- HTTP response security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)',
      '- TLS protocol and cipher-suite inventory or certificate expiry details',
      '- Page content, forms, authentication, application dependencies or known CVEs',
      '- SEO, accessibility, mobile usability, performance or conversion metrics',
      '',
      '### Result interpretation',
      evidence.rejectionReason
        ? `- **Probe limitation:** ${evidence.rejectionReason}`
        : '- Only the measurements listed above are verified. Missing security headers and application vulnerabilities remain unknown.',
      '',
      '### Safe next step',
      'Obtain the website owner\'s written authorization before any intrusive security testing. A deeper passive header and page audit must separately validate redirects, DNS changes and every outbound destination.'
    ];

    return {
      success: true,
      websiteUrl: parsedUrl.toString(),
      coverage: {
        dns: evidence.dnsResolved ? 'measured' : 'failed',
        httpReachability: evidence.httpReachable ? 'measured' : 'not_confirmed',
        https: evidence.sslSecured ? 'measured_success' : 'not_confirmed',
        responseHeaders: 'not_measured',
        applicationVulnerabilities: 'not_measured',
        pageContent: 'not_measured'
      },
      evidence,
      report: lines.join('\n'),
      executedAt: new Date().toISOString()
    };
  }
};
