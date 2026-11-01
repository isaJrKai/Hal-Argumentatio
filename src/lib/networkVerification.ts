/**
 * HAL Network-Verified Grounding & Fail-Closed Pipeline Engine
 * 
 * Enforces HAL Constitution Law #1 & #2:
 * 1. "Never Fabricate Reality" — Prohibits mock seed masquerading as live intelligence.
 * 2. Real Network Grounding — Verifies DNS resolution, HTTP/TLS reachability, and NANP/E.164 phone legitimacy.
 * 3. Fail-Closed Invariant — Silently generating synthetic fake leads when models fail is strictly blocked.
 *    Any unverified or synthetic data is cryptographically quarantined and barred from outreach dispatch.
 */

import dns from 'dns';
import http from 'http';
import https from 'https';
import { isIP } from 'node:net';
import { URL } from 'url';

export interface PhoneValidationResult {
  isValid: boolean;
  isDummyFictional: boolean;
  formatted?: string;
  rejectionReason?: string;
}

export interface DomainValidationResult {
  dnsResolved: boolean;
  httpReachable: boolean;
  httpStatus?: number;
  sslSecured: boolean;
  hostname: string;
  ipAddresses?: string[];
  rejectionReason?: string;
}

export interface GroundingVerificationResult {
  status: 'VERIFIED' | 'UNVERIFIED_STAGING' | 'FABRICATED_REJECTED';
  isGroundTruth: boolean;
  evidence: {
    hostname: string;
    dnsResolved: boolean;
    httpReachable: boolean;
    httpStatus?: number;
    sslSecured: boolean;
    phoneValid: boolean;
    isDummyPhone: boolean;
    reasons: string[];
    verifiedAt: string;
  };
}

/**
 * Fictional / Mock phone detection (NANP 555-0100 through 555-0199 and known dummy patterns)
 */
const FICTIONAL_555_REGEX = /(?:555[-. ]?01\d\d|555[-. ]?0192|555[-. ]?0100|555[-. ]?0000|555[-. ]?0199)/;
const OBVIOUS_TEST_PATTERNS = [
  /000[-. ]?000[-. ]?0000/,
  /111[-. ]?111[-. ]?1111/,
  /123[-. ]?456[-. ]?7890/,
  /999[-. ]?999[-. ]?9999/
];

/**
 * Known placeholder mock domain stems used in previous mock seeds
 */
const MOCK_DOMAIN_PATTERNS = [
  /signaturebuilders/i,
  /redriver.*\.com/i,
  /prairie.*\.ca/i,
  /apex.*\.ca/i,
  /example\.com/i,
  /test\.com/i,
  /localhost/i,
  /placeholder/i
];

/**
 * Validates a telephone number against real telecom conventions and checks for dummy numbers.
 */
export function validatePhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, isDummyFictional: false, rejectionReason: 'Phone number is empty or missing' };
  }

  const cleaned = rawPhone.trim();

  // 1. Check for reserved fictional numbers (TV/film reserved range 555-0100 to 555-0199)
  if (FICTIONAL_555_REGEX.test(cleaned)) {
    return {
      isValid: false,
      isDummyFictional: true,
      rejectionReason: 'North American fictional telephone reservation (555-01xx detected)'
    };
  }

  // 2. Check for obvious repetitive test patterns
  for (const pattern of OBVIOUS_TEST_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        isValid: false,
        isDummyFictional: true,
        rejectionReason: 'Repeated or sequential test digit sequence detected'
      };
    }
  }

  // 3. Extract purely numeric digits
  const digits = cleaned.replace(/\D/g, '');

  // 4. Validate standard 10-digit NANP (North America) or E.164
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);

    // NANP area code cannot start with 0 or 1
    if (areaCode[0] === '0' || areaCode[0] === '1') {
      return {
        isValid: false,
        isDummyFictional: true,
        rejectionReason: `Invalid NANP area code '${areaCode}' (cannot start with 0 or 1)`
      };
    }

    // NANP exchange cannot start with 0 or 1
    if (exchange[0] === '0' || exchange[0] === '1') {
      return {
        isValid: false,
        isDummyFictional: true,
        rejectionReason: `Invalid central office exchange '${exchange}' (cannot start with 0 or 1)`
      };
    }

    const formatted = `+1 (${areaCode}) ${exchange}-${digits.slice(6)}`;
    return { isValid: true, isDummyFictional: false, formatted };
  } else if (digits.length === 11 && digits[0] === '1') {
    // 11 digits starting with 1
    const areaCode = digits.slice(1, 4);
    const exchange = digits.slice(4, 7);
    if (areaCode[0] === '0' || areaCode[0] === '1' || exchange[0] === '0' || exchange[0] === '1') {
      return {
        isValid: false,
        isDummyFictional: true,
        rejectionReason: 'Invalid NANP area code or exchange in 11-digit format'
      };
    }
    const formatted = `+1 (${areaCode}) ${exchange}-${digits.slice(7)}`;
    return { isValid: true, isDummyFictional: false, formatted };
  } else if (digits.length >= 7 && digits.length <= 15) {
    // International valid digit range
    return { isValid: true, isDummyFictional: false, formatted: cleaned };
  }

  return {
    isValid: false,
    isDummyFictional: false,
    rejectionReason: `Invalid phone digit count: ${digits.length} digits found`
  };
}

/**
 * Extracts and cleans a hostname from a raw website string or URL.
 */
export function extractHostname(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim().toLowerCase();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Performs asynchronous DNS lookup with a strict safety timeout.
 */
export function isPubliclyRoutableIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split('.').map(Number);
    if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false;
    const a = octets[0], b = octets[1], c = octets[2];
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) return false;
    return true;
  }

  if (family !== 6 || address.includes('%')) return false;
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice(7);
    if (mapped.includes('.')) return isPubliclyRoutableIp(mapped);
    const parts = mapped.split(':');
    if (parts.length === 2) {
      const high = parseInt(parts[0], 16);
      const low = parseInt(parts[1], 16);
      if (Number.isFinite(high) && Number.isFinite(low)) {
        return isPubliclyRoutableIp([
          high >> 8, high & 255, low >> 8, low & 255
        ].join('.'));
      }
    }
    return false;
  }

  const firstHextet = parseInt(normalized.split(':')[0] || '0', 16);
  // Only global-unicast 2000::/3 addresses are eligible for outbound probes.
  if (!Number.isFinite(firstHextet) || firstHextet < 0x2000 || firstHextet > 0x3fff) return false;
  if (normalized.startsWith('2001:db8:') || normalized.startsWith('2002:') || normalized.startsWith('2001:0000:')) return false;
  return true;
}

async function resolveDnsWithTimeout(hostname: string, timeoutMs = 4000): Promise<{ resolved: boolean; ips?: string[]; resolvedHostname?: string; error?: string }> {
  const tryLookup = async (host: string) => {
    const lookupPromise = dns.promises.lookup(host, { all: true, verbatim: true });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS resolution timed out after ' + timeoutMs + 'ms')), timeoutMs)
    );
    const results = await Promise.race([lookupPromise, timeoutPromise]);
    return Array.isArray(results) ? results.map((item: any) => item.address as string) : [];
  };

  try {
    const ips = await tryLookup(hostname);
    if (ips.length > 0) return { resolved: true, ips, resolvedHostname: hostname };
  } catch (err: any) {
    if (!hostname.startsWith('www.')) {
      try {
        const wwwHostname = 'www.' + hostname;
        const ips = await tryLookup(wwwHostname);
        if (ips.length > 0) return { resolved: true, ips, resolvedHostname: wwwHostname };
      } catch (wwwError: any) {
        return { resolved: false, error: wwwError?.message || err?.message || 'DNS lookup failed' };
      }
    }
    return { resolved: false, error: err?.message || 'DNS lookup failed' };
  }
  if (!hostname.startsWith('www.')) {
    try {
      const wwwHostname = 'www.' + hostname;
      const ips = await tryLookup(wwwHostname);
      if (ips.length > 0) return { resolved: true, ips, resolvedHostname: wwwHostname };
    } catch (err: any) {
      return { resolved: false, error: err?.message || 'DNS lookup failed' };
    }
  }
  return { resolved: false, error: 'No IP records returned' };
}

function requestHeadPinned(
  hostname: string,
  address: string,
  protocol: 'http:' | 'https:',
  timeoutMs: number
): Promise<number> {
  const transport = protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = transport.request({
      protocol,
      hostname,
      path: '/',
      method: 'HEAD',
      agent: false,
      servername: protocol === 'https:' ? hostname : undefined,
      headers: {
        Host: hostname,
        'User-Agent': 'HAL-Grounding-Verifier/3.0'
      },
      lookup: (_host: string, _options: any, callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
        callback(null, address, isIP(address));
      }
    } as any, (response) => {
      const status = response.statusCode || 0;
      response.resume();
      resolve(status);
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error('HTTP probe timed out')));
    request.on('error', reject);
    request.end();
  });
}

/**
 * Validates a public website domain using DNS and a pinned, non-redirecting HTTP/TLS probe.
 * Private, loopback, link-local, reserved, and non-global IP destinations are rejected.
 */
export async function validateDomainAndDns(
  websiteUrl: string,
  options: { probeHttp?: boolean; timeoutMs?: number } = { probeHttp: true, timeoutMs: 4000 }
): Promise<DomainValidationResult> {
  const hostname = extractHostname(websiteUrl);
  if (!hostname || hostname.length < 3 || !hostname.includes('.') || isIP(hostname)) {
    return {
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname,
      rejectionReason: 'Malformed domain name or IP-literal targets are not permitted'
    };
  }

  const timeoutMs = options.timeoutMs || 4000;
  const dnsResult = await resolveDnsWithTimeout(hostname, timeoutMs);
  if (!dnsResult.resolved || !dnsResult.ips?.length) {
    return {
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname,
      rejectionReason: 'DNS resolution failed: ' + (dnsResult.error || 'NXDOMAIN')
    };
  }

  const unsafeAddresses = dnsResult.ips.filter(address => !isPubliclyRoutableIp(address));
  if (unsafeAddresses.length > 0) {
    return {
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname,
      ipAddresses: dnsResult.ips,
      rejectionReason: 'DNS resolved to a non-public or reserved network address'
    };
  }

  if (!options.probeHttp) {
    return {
      dnsResolved: true,
      httpReachable: false,
      sslSecured: false,
      hostname,
      ipAddresses: dnsResult.ips
    };
  }

  const probeHostname = dnsResult.resolvedHostname || hostname;
  const pinnedAddress = dnsResult.ips[0];
  let httpStatus: number | undefined;
  let httpReachable = false;
  let sslSecured = false;

  try {
    httpStatus = await requestHeadPinned(probeHostname, pinnedAddress, 'https:', timeoutMs);
    httpReachable = httpStatus > 0 && httpStatus < 500;
    sslSecured = true;
  } catch {
    try {
      httpStatus = await requestHeadPinned(probeHostname, pinnedAddress, 'http:', timeoutMs);
      httpReachable = httpStatus > 0 && httpStatus < 500;
      sslSecured = false;
    } catch {
      httpReachable = false;
      sslSecured = false;
    }
  }

  return {
    dnsResolved: true,
    httpReachable,
    httpStatus,
    sslSecured,
    hostname: probeHostname,
    ipAddresses: dnsResult.ips
  };
}

export async function verifyLeadGrounding(lead: {
  businessName?: string;
  websiteUrl?: string;
  phone?: string;
  isSynthetic?: boolean;
}): Promise<GroundingVerificationResult> {
  const reasons: string[] = [];

  // Flag if explicitly marked synthetic
  if (lead.isSynthetic) {
    reasons.push('Lead is explicitly marked as synthetic/simulated');
  }

  // 1. Validate Phone
  const phoneValidation = validatePhoneNumber(lead.phone || '');
  if (!phoneValidation.isValid) {
    reasons.push(`Phone validation failed: ${phoneValidation.rejectionReason}`);
  }

  // 2. Validate Domain
  const domainValidation = await validateDomainAndDns(lead.websiteUrl || '');
  if (!domainValidation.dnsResolved) {
    reasons.push(`Domain validation failed: ${domainValidation.rejectionReason}`);
  }

  const isGroundTruth = phoneValidation.isValid && domainValidation.dnsResolved && !lead.isSynthetic;

  let status: GroundingVerificationResult['status'] = 'VERIFIED';
  if (lead.isSynthetic || phoneValidation.isDummyFictional || !domainValidation.dnsResolved) {
    status = 'FABRICATED_REJECTED';
  } else if (!phoneValidation.isValid || !domainValidation.httpReachable) {
    status = 'UNVERIFIED_STAGING';
  }

  return {
    status,
    isGroundTruth,
    evidence: {
      hostname: domainValidation.hostname,
      dnsResolved: domainValidation.dnsResolved,
      httpReachable: domainValidation.httpReachable,
      httpStatus: domainValidation.httpStatus,
      sslSecured: domainValidation.sslSecured,
      phoneValid: phoneValidation.isValid,
      isDummyPhone: phoneValidation.isDummyFictional,
      reasons,
      verifiedAt: new Date().toISOString()
    }
  };
}

/**
 * HAL Non-Negotiable Law: Fail-Closed Outreach Gate.
 * Enforces that no synthetic, unverified, or dummy lead can ever be dispatched to external channels.
 */
export class FailClosedOutreachError extends Error {
  public readonly leadId?: string;
  public readonly violations?: string[];

  constructor(message: string, leadId?: string, violations?: string[]) {
    super(`[FAIL-CLOSED GATE BLOCKED]: ${message}`);
    this.name = 'FailClosedOutreachError';
    this.leadId = leadId;
    this.violations = violations;
  }
}

export function enforceFailClosedOutreachGate(lead: {
  id?: string;
  businessName?: string;
  isSynthetic?: boolean;
  sourceType?: string;
  verificationStatus?: string;
  dnsVerified?: boolean;
  websiteUrl?: string;
  phone?: string;
  phoneEncrypted?: string;
  email?: string;
  channel?: 'phone' | 'email' | 'sms' | 'whatsapp';
}): void {
  const violations: string[] = [];

  // 1. Invariant: No synthetic leads dispatched
  if (lead.isSynthetic) {
    violations.push('Lead is flagged as synthetic/simulated data');
  }
  if (lead.sourceType === 'synthetic_fallback') {
    violations.push('Lead originated from synthetic fallback seed');
  }
  if (lead.sourceType === 'ai_discovery_unverified') {
    violations.push('Lead originated from unverified AI discovery and requires independent verification');
  }

  // 2. Invariant: Grounding verification gate
  if (lead.verificationStatus !== 'VERIFIED') {
    violations.push(
      lead.verificationStatus === 'FABRICATED_REJECTED'
        ? 'Lead failed network grounding verification (DNS or phone validation failed)'
        : 'Lead has not passed live grounding verification'
    );
  }

  // 3. Invariant: DNS verification check
  if (lead.websiteUrl && lead.dnsVerified === false) {
    violations.push('Lead domain failed live DNS ground-truth resolution');
  }

  // 4. Telephone checks (for phone/sms channels or when phone is provided)
  if (lead.phone) {
    if (FICTIONAL_555_REGEX.test(lead.phone)) {
      violations.push('Telephone contains reserved fictional exchange (555-01xx)');
    }
    for (const pattern of OBVIOUS_TEST_PATTERNS) {
      if (pattern.test(lead.phone)) {
        violations.push('Telephone is a dummy/repetitive test pattern');
        break;
      }
    }
  }

  // 5. Channel-specific gates
  if (lead.channel === 'phone' || lead.channel === 'sms' || lead.channel === 'whatsapp') {
    if (!lead.phone) {
      violations.push(`Cannot dispatch ${lead.channel} outreach without a verified telephone number`);
    }
  }

  if (lead.channel === 'email') {
    if (!lead.email) {
      violations.push('Cannot dispatch email outreach without a verified email address');
    } else {
      const emailLower = lead.email.toLowerCase();
      if (emailLower.includes('@example.com') || emailLower.includes('@placeholder') || emailLower.includes('dummy@') || emailLower.includes('test@test.com')) {
        violations.push(`Email address '${lead.email}' is a placeholder/mock domain`);
      }
    }
  }

  if (violations.length > 0) {
    throw new FailClosedOutreachError(
      `Outreach dispatch blocked for '${lead.businessName || lead.id || 'Unknown'}'. Violations: ${violations.join('; ')}`,
      lead.id,
      violations
    );
  }
}

/**
 * Real-time Grounding & Outreach Gate:
 * Verifies DNS and telecom validity on-the-fly if not already evaluated,
 * then enforces the Fail-Closed gate.
 */
export async function verifyAndGateLeadOutreach(lead: {
  id?: string;
  businessName?: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  isSynthetic?: boolean;
  sourceType?: string;
  verificationStatus?: string;
  dnsVerified?: boolean;
  channel?: 'phone' | 'email' | 'sms' | 'whatsapp';
}): Promise<void> {
  // If not yet verified or missing DNS status, run real-time network grounding
  if (!lead.verificationStatus || lead.dnsVerified === undefined) {
    const grounding = await verifyLeadGrounding({
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      phone: lead.phone,
      isSynthetic: lead.isSynthetic
    });
    lead.verificationStatus = grounding.status;
    lead.dnsVerified = grounding.evidence.dnsResolved;
    if (!grounding.isGroundTruth) {
      lead.isSynthetic = true;
    }
  }

  enforceFailClosedOutreachGate(lead);
}
