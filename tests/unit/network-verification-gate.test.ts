import { describe, expect, it } from 'vitest';
import {
  enforceFailClosedOutreachGate,
  FailClosedOutreachError,
} from '../../src/lib/networkVerification';

describe('fail-closed outreach grounding gate', () => {
  const verifiedLead = {
    id: 'lead_verified',
    businessName: 'Verified Contractor',
    isSynthetic: false,
    sourceType: 'live_harvest',
    verificationStatus: 'VERIFIED',
    dnsVerified: true,
    websiteUrl: 'https://contractor.example.org',
    email: 'owner@contractor.example.org',
    channel: 'email' as const,
  };

  it('blocks unverified leads even when DNS is marked resolved', () => {
    expect(() => enforceFailClosedOutreachGate({
      ...verifiedLead,
      verificationStatus: 'UNVERIFIED_STAGING',
    })).toThrow(FailClosedOutreachError);
  });

  it('blocks synthetic leads even if other verification fields look valid', () => {
    expect(() => enforceFailClosedOutreachGate({
      ...verifiedLead,
      isSynthetic: true,
    })).toThrow(FailClosedOutreachError);
  });

  it('allows a verified, non-synthetic lead with a usable email address', () => {
    expect(() => enforceFailClosedOutreachGate(verifiedLead)).not.toThrow();
  });

  it('blocks placeholder email addresses', () => {
    expect(() => enforceFailClosedOutreachGate({
      ...verifiedLead,
      email: 'dummy@example.com',
    })).toThrow(FailClosedOutreachError);
  });
});
