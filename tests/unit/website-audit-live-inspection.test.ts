import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchPublicWebsitePage } = vi.hoisted(() => ({
  fetchPublicWebsitePage: vi.fn()
}));

vi.mock('../../src/lib/networkVerification', () => ({
  fetchPublicWebsitePage
}));

import { websiteAuditSkill } from '../../src/skills/website-audit';

describe('HAL live website audit', () => {
  beforeEach(() => fetchPublicWebsitePage.mockReset());

  it('inspects real fetched HTML and reports only observed page and header signals', async () => {
    fetchPublicWebsitePage.mockResolvedValue({
      requestedUrl: 'https://contractor.example/',
      finalUrl: 'https://contractor.example/',
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      headers: {
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff'
      },
      body: '<!doctype html><html lang="en"><head><title>ABC Roofing | Kampala</title><meta name="description" content="Roof repair and installation in Kampala"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="/"></head><body><h1>Roofing services</h1><h2>Repairs</h2><img src="/roof.jpg"><img src="/team.jpg" alt="Roofing team"><a href="/contact">Contact</a><a href="https://supplier.example">Supplier</a><form><input></form><script type="application/ld+json">{}</script></body></html>',
      fetchedAt: '2026-11-05T12:00:00.000Z',
      resolvedHostname: 'contractor.example',
      resolvedIps: ['93.184.216.34']
    });

    const result = await websiteAuditSkill.execute({
      websiteUrl: 'https://contractor.example/',
      businessName: 'ABC Roofing'
    }, 'tenant-a');

    expect(fetchPublicWebsitePage).toHaveBeenCalledWith('https://contractor.example/', {
      timeoutMs: 7000,
      maxBytes: 512 * 1024
    });
    expect(result.status).toBe('measured');
    expect(result.measurements).toMatchObject({
      title: 'ABC Roofing | Kampala',
      metaDescription: 'Roof repair and installation in Kampala',
      viewportConfigured: true,
      h1Count: 1,
      h2Count: 1,
      imageCount: 2,
      imagesMissingAlt: 1,
      linkCount: 2,
      internalLinkCount: 1,
      externalLinkCount: 1,
      formCount: 1,
      structuredDataPresent: true
    });
    expect(result.securityHeaders.hsts).toBe(true);
    expect(result.securityHeaders.contentSecurityPolicy).toBe(false);
    expect(result.seoScore).toBeNull();
    expect(result.performanceScore).toBeNull();
    expect(result.report).toContain('1 of 2 images');
    expect(result.report).toContain('Google rankings');
    expect(result.report).not.toContain('Search volume:');
  });

  it('does not follow redirects and does not claim page content was inspected', async () => {
    fetchPublicWebsitePage.mockResolvedValue({
      requestedUrl: 'https://contractor.example/',
      finalUrl: 'https://contractor.example/',
      statusCode: 302,
      contentType: 'text/html',
      headers: { location: 'https://new.example/' },
      body: '',
      fetchedAt: '2026-11-05T12:00:00.000Z',
      resolvedHostname: 'contractor.example',
      resolvedIps: ['93.184.216.34']
    });

    const result = await websiteAuditSkill.execute({ websiteUrl: 'contractor.example' }, 'tenant-a');

    expect(result.status).toBe('redirect_not_followed');
    expect(result.report).toContain('https://new.example/');
    expect(result.report).toContain('No page-content, SEO, or security-header conclusions were drawn.');
  });

  it('rejects empty URLs without attempting a fetch', async () => {
    await expect(websiteAuditSkill.execute({ websiteUrl: '' }, 'tenant-a')).rejects.toThrow('Website URL is required');
    expect(fetchPublicWebsitePage).not.toHaveBeenCalled();
  });
});
