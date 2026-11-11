import { Skill } from './types';
import { validateDomainAndDns } from '../lib/networkVerification';

export const securityAuditorSkill: Skill = {
  id: 'security_auditor',
  name: 'Domain & TLS Verification',
  description: "Performs a live DNS, HTTP reachability, and HTTPS connection check. Response headers are not scanned by this tool.",
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
  execute: async (inputs, contractorId) => {
    const { websiteUrl } = inputs;
    if (!websiteUrl) {
      throw new Error('Website URL is required for security audit');
    }

    const checkedAt = new Date().toISOString();
    let evidence: Awaited<ReturnType<typeof validateDomainAndDns>> | null = null;
    let checkError: string | null = null;

    try {
      evidence = await validateDomainAndDns(websiteUrl, { probeHttp: true, timeoutMs: 5000 });
    } catch (error) {
      checkError = error instanceof Error ? error.message : 'Network verification failed';
    }

    const lines = [
      '### Live infrastructure checks',
      `- **Target:** ${websiteUrl}`,
      `- **Hostname:** ${evidence?.hostname || 'Not measured in this run'}`,
      `- **DNS resolution:** ${evidence ? (evidence.dnsResolved ? 'Resolved' : 'Failed') : 'Not measured in this run'}`,
      `- **HTTP reachability:** ${evidence ? (evidence.httpReachable ? 'Reachable' : 'Not reachable') : 'Not measured in this run'}`,
      `- **HTTP status:** ${evidence?.httpStatus ?? 'Not measured in this run'}`,
      `- **HTTPS/TLS probe:** ${evidence ? (evidence.sslSecured ? 'HTTPS connection established' : 'HTTPS connection not established') : 'Not measured in this run'}`,
      `- **Resolved public IPs:** ${evidence?.dnsResolved ? (evidence.ipAddresses?.join(', ') || 'Not returned') : 'Not available'}`,
      `- **Check time (UTC):** ${checkedAt}`,
      `- **Probe error:** ${checkError || evidence?.rejectionReason || 'None reported'}`,
      '',
      '### Response header inventory',
      'Not measured in this run. HSTS, Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options have not been fetched or evaluated.',
      '',
      '### Remediation guidance',
      '1. Configure HTTPS and redirect HTTP requests to HTTPS after confirming the application supports it.',
      '2. Define a Content-Security-Policy based on the application’s actual script, style, image, and connection origins.',
      '3. Configure HSTS only after HTTPS is consistently available across the intended hostnames.',
      '4. Set X-Content-Type-Options: nosniff and an appropriate frame-ancestors policy; verify the deployed response headers afterward.',
      '',
      'Recommendations are general guidance, not findings from a header scan.'
    ];

    return {
      success: true,
      websiteUrl,
      report: lines.join('\n'),
      evidence: evidence ? {
        hostname: evidence.hostname,
        dnsResolved: evidence.dnsResolved,
        httpReachable: evidence.httpReachable,
        httpStatus: evidence.httpStatus,
        sslSecured: evidence.sslSecured,
        ...(evidence.dnsResolved && evidence.ipAddresses ? { ipAddresses: evidence.ipAddresses } : {}),
        rejectionReason: evidence.rejectionReason
      } : null,
      executedAt: checkedAt
    };
  }
};
