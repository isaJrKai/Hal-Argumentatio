import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const verifiedLeadListsSkill: Skill = {
  id: 'verified_lead_lists',
  name: 'Verified Lead List Packager',
  description: "Scopes, builds, verifies, and packages high-intent business contact lists (enriched with review count, ad status, and web presence) to sell as a data product using NEMOTRON.",
  category: 'research',
  icon: 'Database',
  inputs: [
    {
      name: 'niche',
      label: 'Target Niche',
      type: 'string',
      required: true,
      defaultValue: 'Plumbing & Drainage Contractors',
    },
    {
      name: 'geography',
      label: 'Geography / Target Cities',
      type: 'string',
      required: true,
      defaultValue: 'Fredericton, New Brunswick',
    },
    {
      name: 'verificationSources',
      label: 'Verification Sources',
      type: 'string',
      required: true,
      defaultValue: 'Google Business Profile, BBB, Yelp, Chamber of Commerce, Company Websites',
    },
    {
      name: 'enrichmentSignals',
      label: 'Enrichment Signals (e.g. Review count, ad status)',
      type: 'string',
      required: true,
      defaultValue: 'Review count, Google Ads active status, website speed, years in business',
    },
    {
      name: 'pricingStrategy',
      label: 'Product Packaging & Pricing (e.g. $149/city pack)',
      type: 'string',
      required: true,
      defaultValue: '$199 per city/niche combo, recurring list updates at $49/month',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { niche, geography, verificationSources, enrichmentSignals, pricingStrategy } = inputs;
    if (!niche || !geography) {
      throw new Error('Target Niche and Geography are required to package verified lead lists.');
    }



    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Your operational guidance is Swiss-style, objective, highly professional, precise, confident, and free of fluff or conversational filler.
You are scoping a data business under the "Verified Lead Lists" model.`;

    const userPrompt = `Generate a highly detailed operational guide and product scoping document for packaging and selling a verified lead list.

INPUT CONSTANTS:
- Target Niche: ${niche}
- Geography: ${geography}
- Sourced directories / verification sites: ${verificationSources}
- Signals tracked & enriched: ${enrichmentSignals}
- Distribution / Pricing strategy: ${pricingStrategy}

YOUR PLAN MUST STRICTLY INCORPORATE AND EXPAND UPON THESE CORE PRINCIPLES:
1. **Verification Before Inclusion (Non-Negotiable)**: Define the rigorous verification workflow to guarantee zero guessed or fabricated emails/phones. Explain how to document verification dates and live sources.
2. **Deep Enrichment and Signal Tracking**: Detail how the signals (${enrichmentSignals}) raise the list value above cheap web scrapes, enabling high-value tiering.
3. **KAISO Multi-Tier Lead Scoring**: Apply a precise Tier A/B/C tiering model for this niche and geography to save buyers hours of sorting.
4. **Data Privacy and Maintenance Cadence**: Detail guidelines for respecting CAN-SPAM, GDPR, or CASL (since it is Canada-based if New Brunswick), and how the update frequency (${pricingStrategy}) protects client outreach reputation.
5. **A Sample Enriched List Table**: Present a mock-up of 3 sample records for "${niche}" in "${geography}" based on real directories, showing exactly how verified data, source URLs, and enrichment signals must be structured in the final delivery sheet.

Format your output in beautifully clean, highly professional, hierarchical Markdown. Deliver immediate, actionable directives.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Lead List scoping. Using fallback.', err);
    }

    if (!reportText) {
      reportText = `### 1. RIGOROUS VERIFICATION WORKFLOW (NON-NEGOTIABLE)
A single bounce or guessed contact pattern damages trust permanently. Our list compilation protocol establishes strict verification rules:
- **Direct Domain Sourcing**: Confirm emails against the actual live business domains found on **${verificationSources}**.
- **Source Logging**: Every single record must store a verified source link (e.g., Google Maps link, BBB directory profile, or company contact page URL).
- **Temporal Integrity**: Every record is tagged with the precise date of verification (e.g., "Verified July 2026").
- **Unverified Handling**: If a contact cannot be programmatically or manually verified but the business is high-value, it must be labeled explicitly as "Unverified Contact Form Only" rather than guessed.

### 2. DEEP ENRICHMENT & VALUE MULTIPLIERS
Standard scraping yields low-value sheets. The premium value is in our enriched signals: **${enrichmentSignals}**.
- **Ad Spend Signal**: Identifies if the business is actively running Google Ads (budget signal).
- **Reputation Profile**: Reviews count and average score to gauge their market dominance or digital marketing neglect.
- **Site Performance**: Speed score to identify candidates needing technical SEO support.

### 3. KAISO MULTI-TIER LEAD SCORING FOR ${geography.toUpperCase()}
We separate the list into actionable, value-based tiers:
- **Tier A (High-Budget, High-Value)**: Established businesses with >25 Google reviews, active website, running paid ads, and dedicated marketing contacts.
- **Tier B (Mid-Market Opportunities)**: Functional websites, 5-25 reviews, not running ads, obvious website speed or schema gaps.
- **Tier C (Offline-First / Neglected Profiles)**: Low or zero reviews, no website or placeholder only, no active marketing.

### 4. COMPLIANCE & REVENUE STRATEGY (${pricingStrategy.toUpperCase()})
- **Regulatory Framework**: Align list compiling strictly with CAN-SPAM, CASL (since New Brunswick is Canada), and GDPR. Only publicly available commercial business contact vectors are cataloged.
- **Pricing Strategy**: Packaged as requested: **${pricingStrategy}**. High-margin data product sold directly to outreach agencies, web developers, and marketing freelancers.`;
    }

    return {
      success: true,
      niche,
      geography,
      verificationSources,
      enrichmentSignals,
      pricingStrategy,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
