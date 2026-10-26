import { Skill } from './types';

export const websiteAuditSkill: Skill = {
  id: 'website_audit',
  name: 'Website Review Checklist',
  description: 'Provides a review checklist only. Live SEO, performance, SSL, ranking, and conversion metrics are not measured by this workflow.',
  category: 'website',
  icon: 'Globe',
  inputs: [
    {
      name: 'websiteUrl',
      label: 'Website URL',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'string',
      required: true,
      defaultValue: '',
    }
  ],
  execute: async (inputs) => {
    const websiteUrl = String(inputs.websiteUrl || '').trim();
    const businessName = String(inputs.businessName || '').trim();

    if (!websiteUrl) {
      throw new Error('Website URL is required.');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      throw new Error('Enter a valid website URL.');
    }

    if (!['https:', 'http:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
      throw new Error('Enter a valid HTTP or HTTPS website URL without embedded credentials.');
    }

    // This skill intentionally does not claim to crawl or measure the submitted site.
    // Do not replace these unknown values with generated or heuristic scores.
    const report = [
      '## Website review checklist — not a live audit',
      '',
      '**Evidence status:** Not measured. This workflow has not fetched or inspected the website.',
      '',
      `- **Business:** ${businessName || 'Not provided'}`,
      `- **Submitted URL:** ${parsedUrl.toString()}`,
      '- **HTTP status / reachability:** Not checked',
      '- **TLS certificate / HTTPS configuration:** Not checked',
      '- **Technical SEO / indexability:** Not checked',
      '- **Core Web Vitals / page speed:** Not measured',
      '- **Mobile layout / accessibility:** Not checked',
      '- **Search ranking / reviews / conversion rate:** Not measured',
      '',
      '### Suggested manual review',
      '1. Open the site on desktop and a real mobile device; record the pages and viewport tested.',
      '2. Run Google PageSpeed Insights or Lighthouse and attach the measured report before assigning a performance score.',
      '3. Inspect page titles, canonical URLs, robots directives, sitemap, structured data, and broken links before reporting SEO findings.',
      '4. Verify HTTPS and certificate validity with a real TLS check; do not infer certificate status from the URL scheme alone.',
      '5. Test contact links and forms end-to-end. Do not estimate conversion loss without analytics or controlled experiment data.',
      '',
      '**Important:** No numerical scores, competitor claims, traffic estimates, or conversion outcomes have been generated because no measurements were collected.'
    ].join('\n');

    return {
      success: true,
      status: 'not_measured',
      businessName,
      websiteUrl: parsedUrl.toString(),
      seoScore: null,
      performanceScore: null,
      sslStatus: 'not_checked',
      report,
      auditedAt: null
    };
  }
};
