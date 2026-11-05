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



    const systemPrompt = 'You are HAL, a careful local-market research planner. Do not invent live Google Maps results, competitor ratings, review counts, posting frequency, market saturation, rankings, or market share. Clearly distinguish supplied names from verified external facts.';
    const userPrompt = [
      'Create a localized competitor research plan, not a claim that a live audit has been run.',
      'Target territory: ' + city,
      'Industry niche: ' + niche,
      'User-supplied competitor names: ' + (competitorNames || 'None'),
      '',
      'Requirements:',
      '1. State that no live Google Maps or search results were queried.',
      '2. Provide a comparison template for rating, review count/date, website, service area, photos, and posting activity. Leave unknown values blank or unavailable.',
      '3. Suggest testable research questions without claiming market saturation or competitor weaknesses.',
      '4. Provide ethical local SEO steps without promising a top-three Maps position.',
      '5. Do not invent statistics, ratings, review counts, market share, backlinks, or ranking positions.',
      'Return concise Markdown.'
    ].join('\\n');

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
