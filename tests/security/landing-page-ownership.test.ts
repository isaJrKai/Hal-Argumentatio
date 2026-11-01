import { describe, expect, it } from 'vitest';
import { resolvePublishedLandingPageOwner } from '../../src/lib/landingPageOwnership';

describe('published landing-page ownership', () => {
  it('resolves tenant ownership from the saved artifact, not caller-supplied data', () => {
    const artifact = {
      id: 'lp_business_123',
      toolId: 'landing_page',
      status: 'ready',
      contractorId: 'business-owner-1',
      content: {
        pageConfig: {
          city: 'Austin',
          trade: 'Roofing'
        }
      }
    };

    const resolved = resolvePublishedLandingPageOwner(artifact);
    expect(resolved).toEqual({
      valid: true,
      pageId: 'lp_business_123',
      contractorId: 'business-owner-1',
      city: 'Austin',
      trade: 'Roofing'
    });
    // The helper intentionally has no contractorId request parameter to spoof.
  });

  it('rejects draft or otherwise unpublished pages', () => {
    const resolved = resolvePublishedLandingPageOwner({
      id: 'lp_draft_123',
      toolId: 'landing_page',
      status: 'draft',
      contractorId: 'business-owner-1'
    });
    expect(resolved).toEqual({ valid: false, reason: 'not_published' });
  });

  it('rejects artifacts belonging to other tools', () => {
    const resolved = resolvePublishedLandingPageOwner({
      id: 'artifact_123',
      toolId: 'proposal',
      status: 'ready',
      contractorId: 'business-owner-1'
    });
    expect(resolved).toEqual({ valid: false, reason: 'invalid_artifact' });
  });

  it('rejects artifacts without an owner', () => {
    const resolved = resolvePublishedLandingPageOwner({
      id: 'lp_orphan_123',
      toolId: 'landing_page',
      status: 'ready',
      contractorId: ''
    });
    expect(resolved).toEqual({ valid: false, reason: 'missing_owner' });
  });

  it('bounds business profile values read from stored page configuration', () => {
    const resolved = resolvePublishedLandingPageOwner({
      id: 'lp_long_123',
      toolId: 'landing_page',
      status: 'deployed',
      contractorId: 'business-owner-1',
      content: { pageConfig: { city: 'X'.repeat(200), trade: 'Y'.repeat(100) } }
    });
    expect(resolved.valid).toBe(true);
    if (resolved.valid) {
      expect(resolved.city).toHaveLength(120);
      expect(resolved.trade).toHaveLength(80);
    }
  });
});
