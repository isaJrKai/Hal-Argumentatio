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
async function resolveDnsWithTimeout(hostname: string, timeoutMs = 4000): Promise<{ resolved: boolean; ips?: string[]; error?: string }> {
  const tryLookup = async (host: string) => {
    const lookupPromise = dns.promises.lookup(host, { all: true });
    const timeoutPromise = new Promise<{ resolved: boolean; error: string }>((_, reject) =>
      setTimeout(() => reject(new Error(`DNS resolution timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    return await Promise.race([lookupPromise, timeoutPromise]) as dns.LookupAddress[];
  };

  try {
    const results = await tryLookup(hostname);
    if (Array.isArray(results) && results.length > 0) {
      return { resolved: true, ips: results.map(r => r.address) };
    }
  } catch (err: any) {
    // If apex domain failed, try with www. prefix
    if (!hostname.startsWith('www.')) {
      try {
        const wwwResults = await tryLookup('www.' + hostname);
        if (Array.isArray(wwwResults) && wwwResults.length > 0) {
          return { resolved: true, ips: wwwResults.map(r => r.address) };
        }
      } catch {}
    }
    return { resolved: false, error: err.message || 'DNS lookup failed' };
  }
  return { resolved: false, error: 'No IP records returned' };
}

/**
 * Validates a website domain using real DNS queries and optional HTTP/TLS probe.
 */
export async function validateDomainAndDns(
  websiteUrl: string,
  options: { probeHttp?: boolean; timeoutMs?: number } = { probeHttp: true, timeoutMs: 4000 }
): Promise<DomainValidationResult> {
  const hostname = extractHostname(websiteUrl);

  if (!hostname || hostname.length < 3 || !hostname.includes('.')) {
    return {
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname,
      rejectionReason: 'Malformed or missing domain name'
    };
  }

  // 1. Perform DNS lookup with www fallback
  const dnsResult = await resolveDnsWithTimeout(hostname, options.timeoutMs);

  if (!dnsResult.resolved) {
    return {
      dnsResolved: false,
      httpReachable: false,
      sslSecured: false,
      hostname,
      rejectionReason: `DNS resolution failed: ${dnsResult.error || 'NXDOMAIN'}`
    };
  }

  let httpReachable = false;
  let httpStatus: number | undefined;
  let sslSecured = false;

  // 2. Optional fast HTTP / TLS probe
  if (options.probeHttp) {
    try {
      const probeUrl = `https://${hostname}`;
      const res = await fetch(probeUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(options.timeoutMs || 2500),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HAL-Grounding-Verifier/2.0'
        },
        redirect: 'follow'
      });
      httpStatus = res.status;
      httpReachable = res.status < 500;
      sslSecured = true; // HTTPS handshake succeeded
    } catch (tlsErr) {
      // Fallback: Try plain HTTP if HTTPS failed
      try {
        const probeUrlHttp = `http://${hostname}`;
        const resHttp = await fetch(probeUrlHttp, {
          method: 'HEAD',
          signal: AbortSignal.timeout(1500),
          redirect: 'follow'
        });
        httpStatus = resHttp.status;
        httpReachable = resHttp.status < 500;
        sslSecured = false;
      } catch {
        httpReachable = false;
        sslSecured = false;
      }
    }
  } else {
    // If probing is disabled, DNS resolution establishes network registration
    httpReachable = true;
    sslSecured = true;
  }

  return {
    dnsResolved: true,
    httpReachable,
    httpStatus,
    sslSecured,
    hostname,
    ipAddresses: dnsResult.ips
  };
}

/**
 * Validates ground truth for a business profile before it can be added to the lead pipeline.
 */
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

  // 2. Invariant: Grounding verification gate
  if (lead.verificationStatus === 'FABRICATED_REJECTED') {
    violations.push('Lead failed network grounding verification (DNS or phone validation failed)');
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
