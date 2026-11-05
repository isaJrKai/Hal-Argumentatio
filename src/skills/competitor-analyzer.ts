import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const competitorAnalyzerSkill: Skill = {
  id: 'competitor_analyzer',
  name: 'Local Competitor & Maps Analyzer',
  description: "Builds a competitor research plan from user-supplied competitor names. Does not query live Google Maps, rankings, reviews, or market-share data.",
  category: 'research',
  icon: 'Map',
  inputs: [
    {
      name: 'city',
      label: 'Target Location (City)',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'niche',
      label: 'Business Niche',
      type: 'string',
      required: true,
      defaultValue: 'Plumber',
    },
    {
      name: 'competitorNames',
      label: 'Direct Competitors (Comma separated)',
      type: 'string',
      required: false,
      defaultValue: '',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { city, niche, competitorNames } = inputs;
    if (!city || !niche) {
      throw new Error('Target Location (City) and Business Niche are required inputs.');
    }



    const systemPrompt = `You are HAL, the premier Local Market Penetration Planner. 
Your analysis is Swiss-style, objective, data-driven, and highly actionable. No fluff or conversational filler.`;

    const userPrompt = `Generate a localized competitor research plan, not a claim that a live audit has been run:
- Target Territory: ${city}
- Industry Niche: ${niche}
- Provided Competitor Names: ${competitorNames || 'Unspecified'}

Compile the report following this structure:
1. TERRITORY PENETRATION DIFFICULTY: Map the baseline competition volume in ${city} for ${niche} services and determine if the market is saturated or open.
2. COMPETITIVE DEFICIT MATRIX: Contrast the main visual indicators (Review counts, rating averages, website speed, photo density, and GMB posting activity).
3. MAPS PACK PENETRATION PLAN: A 4-step tactical blueprint on how to secure a top-3 spot in the local maps pack.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Competitor Analyzer. Using fallback.', err);
    }

    if (!reportText) {
      const names = String(competitorNames || '').split(',').map(name => name.trim()).filter(Boolean);
      reportText = [
        '### RESEARCH SCOPE',
        'No live Google Maps or search-results data was queried. The names below are user-supplied and have not been independently verified.',
        '',
        '### COMPETITOR COMPARISON TEMPLATE',
        ...(names.length ? names.map(name => '- ' + name + ': rating unknown; review count unknown; recent review activity unknown; website and service area require checking.') : ['- No competitor names were supplied. Identify nearby providers from current public listings before comparing them.']),
        '',
        '### TESTABLE OPPORTUNITIES',
        '- Compare service coverage, contact options, project evidence, accessibility, and clarity of service pages using current public sources.',
        '- Record source URLs and observation dates. Do not infer customer dissatisfaction from review counts alone.',
        '',
        '### LOCAL SEO PLAN',
        '- Complete the business profile accurately and keep hours, categories, services, and contact details current.',
        '- Publish genuine project photos and useful service-area information.',
        '- Request honest reviews from all eligible customers without incentives or review gating.',
        '- Track actual enquiries and outcomes before attributing revenue or ranking changes.',
        '',
        '**Unavailable:** market saturation, Maps rankings, competitor ratings, review volumes, backlink counts, and share of voice.'
      ].join('\n');
    }

    return {
      success: true,
      city,
      niche,
      competitorNames,
      evidenceStatus: 'no_live_competitor_data_queried',
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
