import { describe, expect, it } from 'vitest';
import { websiteAuditSkill } from '../../src/skills/website-audit';

describe('Website Review Checklist evidence boundaries', () => {
  it('keeps every unmeasured website metric unavailable instead of inventing scores', async () => {
    const result = await websiteAuditSkill.execute({
      websiteUrl: 'https://example.test',
      businessName: 'Example Business'
    });

    expect(result).toMatchObject({
      success: true,
      status: 'not_measured',
      businessName: 'Example Business',
      websiteUrl: 'https://example.test/',
      seoScore: null,
      performanceScore: null,
      sslStatus: 'not_checked',
      auditedAt: null
    });
    expect(result.report).toContain('has not fetched or inspected the website');
    expect(result.report).toContain('No numerical scores');
    expect(result.report).toContain('HTTP status / reachability:** Not checked');
    expect(result.report).toContain('TLS certificate / HTTPS configuration:** Not checked');
  });

  it.each([
    ['javascript:alert(1)', 'Enter a valid website URL.'],
    ['https://user:pass@example.test', 'Enter a valid HTTP or HTTPS website URL without embedded credentials.'],
    ['ftp://example.test', 'Enter a valid HTTP or HTTPS website URL without embedded credentials.']
  ])('rejects unsafe or unsupported URL input %s', async (websiteUrl, message) => {
    await expect(websiteAuditSkill.execute({
      websiteUrl,
      businessName: 'Example Business'
    })).rejects.toThrow(message);
  });

  it('normalizes a bare domain to HTTPS without claiming that HTTPS was verified', async () => {
    const result = await websiteAuditSkill.execute({
      websiteUrl: 'example.test',
      businessName: ''
    });

    expect(result.websiteUrl).toBe('https://example.test/');
    expect(result.status).toBe('not_measured');
    expect(result.sslStatus).toBe('not_checked');
    expect(result.report).toContain('Submitted URL:** https://example.test/');
  });
});
