import { Skill } from './types';
import { fetchPublicWebsitePage } from '../lib/networkVerification';

function cleanText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function getMetaContent(html: string, name: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (key !== name.toLowerCase()) continue;
    return cleanText(tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] || '');
  }
  return null;
}

function getTagText(html: string, tagName: string): string[] {
  const matches = [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}\\s*>`, 'gi'))];
  return matches.map(match => cleanText((match[1] || '').replace(/<[^>]+>/g, ''))).filter(Boolean);
}

function getAttributeValues(html: string, tagName: string, attribute: string): string[] {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || [];
  return tags.map(tag => tag.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] || '');
}

function analyzeHtml(html: string, pageUrl: string) {
  const title = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.replace(/<[^>]+>/g, '') || '');
  const description = getMetaContent(html, 'description');
  const robots = getMetaContent(html, 'robots');
  const viewport = getMetaContent(html, 'viewport');
  const canonicalHref = (html.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i) ||
    html.match(/<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["']/i))?.[1] || null;
  const h1 = getTagText(html, 'h1');
  const h2 = getTagText(html, 'h2');
  const images = getAttributeValues(html, 'img', 'alt');
  const links = getAttributeValues(html, 'a', 'href').filter(Boolean);
  const forms = (html.match(/<form\b/gi) || []).length;
  const scriptsRemoved = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  const visibleText = cleanText(scriptsRemoved.replace(/<[^>]+>/g, ' '));
  const wordCount = visibleText ? visibleText.split(/\s+/).filter(Boolean).length : 0;
  const url = new URL(pageUrl);
  const internalLinks = links.filter(href => {
    try { return new URL(href, url).hostname === url.hostname; } catch { return false; }
  }).length;
  const externalLinks = links.length - internalLinks;
  const htmlLang = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1] || null;
  const hasStructuredData = /application\/ld\+json/i.test(html) || /itemscope/i.test(html);
  const hasNoindex = /(?:^|[,\s])noindex(?:$|[,\s])/i.test(robots || '');

  return {
    title: title || null,
    titleLength: title.length,
    metaDescription: description,
    metaDescriptionLength: description?.length ?? null,
    canonicalUrl: canonicalHref ? (() => { try { return new URL(canonicalHref, url).toString(); } catch { return null; } })() : null,
    robotsDirective: robots,
    noindex: hasNoindex,
    viewportConfigured: Boolean(viewport),
    htmlLanguage: htmlLang,
    h1Count: h1.length,
    h1Headings: h1.slice(0, 5),
    h2Count: h2.length,
    imageCount: images.length,
    imagesMissingAlt: images.filter(alt => !alt.trim()).length,
    linkCount: links.length,
    internalLinkCount: internalLinks,
    externalLinkCount: externalLinks,
    formCount: forms,
    visibleWordCount: wordCount,
    structuredDataPresent: hasStructuredData
  };
}

export const websiteAuditSkill: Skill = {
  id: 'website_audit',
  name: 'Website Review & Technical Audit',
  description: 'Fetches one public website page and measures its HTTP response, page metadata, headings, mobile viewport, links, image alt coverage, forms, and structured data. Does not claim search rankings, traffic, Core Web Vitals, or conversion rates.',
  category: 'website',
  icon: 'Globe',
  inputs: [
    { name: 'websiteUrl', label: 'Website URL', type: 'string', required: true, defaultValue: '' },
    { name: 'businessName', label: 'Business Name', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const websiteUrl = String(inputs.websiteUrl || '').trim();
    const businessName = String(inputs.businessName || '').trim();
    if (!websiteUrl) throw new Error('Website URL is required.');

    const page = await fetchPublicWebsitePage(websiteUrl, { timeoutMs: 7000, maxBytes: 512 * 1024 });
    if (page.statusCode >= 300 && page.statusCode < 400) {
      return {
        success: true,
        status: 'redirect_not_followed',
        businessName: businessName || null,
        websiteUrl: page.requestedUrl,
        evidence: page,
        measurements: null,
        seoScore: null,
        performanceScore: null,
        report: [
          '## Website audit — redirect requires review',
          '',
          `- **Submitted URL:** ${page.requestedUrl}`,
          `- **HTTP status:** ${page.statusCode}`,
          `- **Redirect target:** ${page.headers.location || 'Not supplied'}`,
          '',
          'HAL did not follow this redirect. Review the destination and run a new audit against the approved public URL.',
          'No page-content, SEO, or security-header conclusions were drawn.'
        ].join('\n'),
        auditedAt: page.fetchedAt
      };
    }

    const measurements = analyzeHtml(page.body, page.finalUrl);
    const tls = new URL(page.requestedUrl).protocol === 'https:';
    const securityHeaders = {
      hsts: Boolean(page.headers['strict-transport-security']),
      contentSecurityPolicy: Boolean(page.headers['content-security-policy']),
      xFrameOptions: Boolean(page.headers['x-frame-options']),
      xContentTypeOptions: Boolean(page.headers['x-content-type-options']),
      referrerPolicy: Boolean(page.headers['referrer-policy']),
      permissionsPolicy: Boolean(page.headers['permissions-policy'])
    };
    const missingHeaders = Object.entries(securityHeaders).filter(([, present]) => !present).map(([name]) => name);
    const findings: string[] = [];
    if (!measurements.title) findings.push('No HTML title element was found.');
    else if (measurements.titleLength < 20 || measurements.titleLength > 60) findings.push(`The title is ${measurements.titleLength} characters; review whether it accurately describes the page and fits typical search snippets.`);
    if (!measurements.metaDescription) findings.push('No meta description was found in the fetched HTML.');
    if (!measurements.viewportConfigured) findings.push('No responsive viewport meta tag was found.');
    if (measurements.h1Count === 0) findings.push('No H1 heading was found in the fetched HTML.');
    if (measurements.imagesMissingAlt > 0) findings.push(`${measurements.imagesMissingAlt} of ${measurements.imageCount} images have no non-empty alt attribute.`);
    if (measurements.noindex) findings.push('The page includes a noindex directive; verify that this is intentional.');
    if (missingHeaders.length) findings.push(`Response headers not observed: ${missingHeaders.join(', ')}.`);
    if (!measurements.structuredDataPresent) findings.push('No JSON-LD or microdata structured data was detected in the fetched HTML.');

    const report = [
      '## Website audit — measured single-page inspection',
      '',
      `- **Business:** ${businessName || 'Not provided'}`,
      `- **Page:** ${page.requestedUrl}`,
      `- **HTTP status:** ${page.statusCode}`,
      `- **Fetched at:** ${page.fetchedAt}`,
      `- **Resolved host/IP:** ${page.resolvedHostname} / ${page.resolvedIps.join(', ')}`,
      `- **HTTPS request:** ${tls ? 'Successful TLS request' : 'Page was requested over HTTP; HTTPS was not established by this page fetch'}`,
      '',
      '### Measured page signals',
      `- Title: ${measurements.title || 'Missing'} (${measurements.titleLength} characters)`,
      `- Meta description: ${measurements.metaDescription ? `Present (${measurements.metaDescriptionLength} characters)` : 'Missing'}`,
      `- Canonical URL: ${measurements.canonicalUrl || 'Not found'}`,
      `- Robots directive: ${measurements.robotsDirective || 'Not specified'}`,
      `- Responsive viewport: ${measurements.viewportConfigured ? 'Present' : 'Missing'}`,
      `- H1/H2 headings: ${measurements.h1Count}/${measurements.h2Count}`,
      `- Images with missing alt: ${measurements.imagesMissingAlt} of ${measurements.imageCount}`,
      `- Links: ${measurements.linkCount} total; ${measurements.internalLinkCount} internal; ${measurements.externalLinkCount} external`,
      `- Forms: ${measurements.formCount} detected (not submitted or tested)`,
      `- Visible text estimate: ${measurements.visibleWordCount} words`,
      `- Structured data: ${measurements.structuredDataPresent ? 'Detected' : 'Not detected'}`,
      '',
      '### Observed response security headers',
      ...Object.entries(securityHeaders).map(([name, present]) => `- ${name}: ${present ? 'Present' : 'Not observed'}`),
      '',
      '### Evidence-based opportunities',
      ...(findings.length ? findings.map(item => `- ${item}`) : ['- No issues were identified within this limited single-page inspection.']),
      '',
      '### Not measured',
      '- Google rankings, keyword search volumes, organic traffic, backlinks or competitor positions',
      '- Lighthouse scores, Core Web Vitals, real-user performance or mobile rendering on physical devices',
      '- Accessibility conformance, form submission/delivery, conversion rate or revenue impact',
      '- Application vulnerabilities, authentication flaws, dependency CVEs or exploitability',
      '',
      '**Scope:** One public HTML page, one bounded GET request, no redirect following, no form submissions, no JavaScript execution, and no intrusive security testing. Findings describe only the fetched response and HTML.'
    ].join('\n');

    return {
      success: true,
      status: 'measured',
      businessName: businessName || null,
      websiteUrl: page.requestedUrl,
      evidence: {
        fetchedAt: page.fetchedAt,
        statusCode: page.statusCode,
        contentType: page.contentType,
        resolvedHostname: page.resolvedHostname,
        resolvedIps: page.resolvedIps,
        responseHeaders: page.headers
      },
      measurements,
      securityHeaders,
      missingSecurityHeaders: missingHeaders,
      findings,
      seoScore: null,
      performanceScore: null,
      report,
      auditedAt: page.fetchedAt
    };
  }
};
