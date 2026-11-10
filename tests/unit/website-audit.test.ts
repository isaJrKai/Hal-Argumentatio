import { describe, expect, it } from 'vitest';
import { websiteAuditSkill } from '../../src/skills/website-audit';

describe('Website review checklist evidence boundaries', () => {
  it('returns explicitly unmeasured results instead of inventing audit scores', async () => {
    const result = await websiteAuditSkill.execute({
      websiteUrl: 'https://example.test',
      businessName: 'Fixture Business'
    }, 'test-contractor');

    expect(result).toMatchObject({
      success: true,
      status: 'not_measured',
      businessName: 'Fixture Business',
      websiteUrl: 'https://example.test/',
      seoScore: null,
      performanceScore: null,
      sslStatus: 'not_checked',
      auditedAt: null
    });
    expect(result.report).toContain('not a live audit');
    expect(result.report).toContain('HTTP status / reachability:** Not checked');
    expect(result.report).toContain('Core Web Vitals / page speed:** Not measured');
  });

  it.each([
    '',
    'not a url',
    'javascript:alert(1)',
    'https://user:password@example.test'
  ])('rejects unsafe or invalid submitted URL: %s', async (websiteUrl) => {
    await expect(websiteAuditSkill.execute({
      websiteUrl,
      businessName: 'Fixture Business'
    }, 'test-contractor')).rejects.toThrow();
  });

  it('does not silently upgrade an HTTPS URL into proof of TLS validity', async () => {
    const result = await websiteAuditSkill.execute({
      websiteUrl: 'https://example.test',
      businessName: 'Fixture Business'
    }, 'test-contractor');

    expect(result.sslStatus).toBe('not_checked');
    expect(result.report).toContain('do not infer certificate status from the URL scheme');
  });
});
