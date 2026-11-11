import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const seoSkill: Skill = {
  id: 'seo_analytics',
  name: 'SEO & Keyword Strategy',
  description: 'Creates a localized SEO hypothesis and site-structure plan. Search volume, rankings, competitor positions, backlinks, and difficulty are not measured unless a verified search-data provider is connected.',
  category: 'seo',
  icon: 'TrendingUp',
  inputs: [
    { name: 'businessName', label: 'Business Name', type: 'string', required: true, defaultValue: '' },
    { name: 'websiteUrl', label: 'Website URL', type: 'string', required: false, defaultValue: '' },
    { name: 'niche', label: 'Niche Service', type: 'string', required: true, defaultValue: '' },
    { name: 'city', label: 'Target City', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const businessName = String(inputs.businessName || '').trim();
    const websiteUrl = String(inputs.websiteUrl || '').trim();
    const niche = String(inputs.niche || '').trim();
    const city = String(inputs.city || '').trim();
    if (!businessName || !niche || !city) {
      throw new Error('Business Name, Niche, and Target City are required for SEO strategy.');
    }

    const phrases = [
      `${niche} services in ${city}`,
      `${niche} contractor ${city}`,
      `${niche} quote ${city}`
    ];
    const userPrompt = `Create a localized SEO planning hypothesis for this business:
Business: ${businessName}
Website: ${websiteUrl || 'Not supplied'}
Service: ${niche}
City: ${city}

Use these candidate search phrases as hypotheses, not verified demand:
${phrases.map((phrase, index) => `${index + 1}. ${phrase}`).join('\n')}

Suggest page structure, useful service-page content, title/description ideas, and what evidence should be collected next.
Strict evidence rules:
- Do not invent search volume, keyword difficulty, rankings, competitor names/positions, backlink counts, domain authority, traffic, conversion rates, or performance scores.
- Do not claim that you checked Google or a search-results page.
- Clearly label all keyword phrases and competitor ideas as hypotheses requiring validation.
- State that no live search-volume or competitor-data provider was queried.
- Do not assert that the named business has a specific SEO defect unless that defect is supplied as evidence.
Return concise Markdown with sections: Candidate keyword hypotheses, Recommended site structure, Content opportunities, Evidence still needed.`;

    let reportText = '';
    let providerUsed = false;
    try {
      reportText = await generateResponse(
        userPrompt,
        'You are HAL SEO planning assistant. Be precise and evidence-bound. Never manufacture external search or competitor measurements.',
        0.2
      );
      providerUsed = Boolean(reportText);
    } catch (error) {
      console.error('NEMOTRON SEO strategy request failed; using deterministic planning template.', error);
    }

    if (!reportText) {
      reportText = [
        '### Candidate keyword hypotheses',
        ...phrases.map((phrase, index) => `${index + 1}. “${phrase}” — suggested phrase only; search demand and difficulty have not been measured.`),
        '',
        '### Recommended site structure',
        `- /services/${slug(niche)} — primary service overview`,
        `- /locations/${slug(city)}/${slug(niche)} — location-specific service page`,
        '- /contact — clear enquiry options and business contact details',
        '- /frequently-asked-questions — answers based on real customer questions',
        '',
        '### Content opportunities',
        '- Explain the actual services, service area, process, credentials and warranty terms supplied by the business.',
        '- Add clear calls to action and consistent business contact information.',
        '',
        '### Evidence still needed',
        '- Search-volume and keyword-difficulty data from a connected, verified search-data provider.',
        '- Current Google search results and competitor URLs for the target location.',
        '- Search Console or analytics data before making traffic or conversion claims.',
        '- A measured website audit before describing specific technical SEO defects.'
      ].join('\n');
    }

    return {
      success: true,
      businessName,
      websiteUrl: websiteUrl || null,
      city,
      niche,
      evidenceStatus: 'planning_hypotheses_only',
      liveSearchDataQueried: false,
      providerUsed,
      metrics: {
        searchVolume: null,
        keywordDifficulty: null,
        rankingPosition: null,
        competitorBacklinks: null,
        organicTraffic: null
      },
      candidateKeywords: phrases,
      report: reportText,
      compiledAt: new Date().toISOString()
    };
  }
};
