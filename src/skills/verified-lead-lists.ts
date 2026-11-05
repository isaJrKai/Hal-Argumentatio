import { Skill } from './types';

export const verifiedLeadListsSkill: Skill = {
  id: 'verified_lead_lists',
  name: 'Lead List Verification & Packaging Plan',
  description: 'Creates a data schema and verification workflow for a lead-list product. It does not retrieve, verify, or enrich prospect records from external directories.',
  category: 'research',
  icon: 'Database',
  inputs: [
    { name: 'niche', label: 'Target Niche', type: 'string', required: true, defaultValue: '' },
    { name: 'geography', label: 'Geography / Target Cities', type: 'string', required: true, defaultValue: '' },
    { name: 'verificationSources', label: 'Potential Verification Sources', type: 'string', required: false, defaultValue: '' },
    { name: 'enrichmentSignals', label: 'Desired Enrichment Signals', type: 'string', required: false, defaultValue: '' },
    { name: 'pricingStrategy', label: 'Proposed Packaging & Pricing', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const niche = String(inputs.niche || '').trim();
    const geography = String(inputs.geography || '').trim();
    const verificationSources = String(inputs.verificationSources || '').trim();
    const enrichmentSignals = String(inputs.enrichmentSignals || '').trim();
    const pricingStrategy = String(inputs.pricingStrategy || '').trim();
    if (!niche || !geography) throw new Error('Target Niche and Geography are required.');

    const report = [
      '### LEAD LIST PRODUCT SCOPE',
      '- **Niche:** ' + niche,
      '- **Geography:** ' + geography,
      '- **External records retrieved:** 0',
      '- **Records verified by this skill:** 0',
      '- **Potential sources supplied:** ' + (verificationSources || 'None supplied'),
      '- **Desired enrichment signals:** ' + (enrichmentSignals || 'None supplied'),
      '- **Pricing proposal:** ' + (pricingStrategy || 'Not supplied'),
      '',
      '### REQUIRED RECORD SCHEMA',
      '| Field | Required evidence |',
      '|---|---|',
      '| Business name | Official business page or authoritative directory URL |',
      '| Website | Public URL, fetched date, HTTP status, and matching business identity |',
      '| Phone / email | Source URL and date; format validation alone is not proof of ownership |',
      '| Location | Source-backed locality; city-centroid coordinates must not be presented as street coordinates |',
      '| Services | Business page or directory evidence |',
      '| Review / ad signals | Provider URL, exact value, observation date, and collection method |',
      '| Verification status | Human/source confirmation plus technical checks; never infer from DNS alone |',
      '',
      '### VERIFICATION WORKFLOW',
      '1. Discover candidate businesses from permitted public sources and retain source URLs.',
      '2. Deduplicate by normalized business name, city, and website domain.',
      '3. Verify that each source page identifies the same business and that contact details match.',
      '4. Run DNS/HTTP and phone-format checks as technical signals only; do not treat them as identity proof.',
      '5. Require human review for identity and record reviewer, date, evidence URL, and notes.',
      '6. Recheck contact details before delivery and record stale or failed results.',
      '',
      '### SAMPLE OUTPUT FORMAT (EMPTY TEMPLATE — NOT REAL PROSPECT DATA)',
      '| Business | City | Website | Phone | Source URL | Verified at | Status |',
      '|---|---|---|---|---|---|---|',
      '| — | — | — | — | — | — | NOT COLLECTED |',
      '',
      '**Important:** No sample businesses or contact details have been fabricated. This capability currently produces a packaging plan only; a live source connector and a record-level verification workflow are required before selling a list as verified.'
    ].join('\n');

    return {
      success: true,
      niche,
      geography,
      records: [],
      retrievedRecordsCount: 0,
      verifiedRecordsCount: 0,
      liveSourcesQueried: false,
      evidenceStatus: 'plan_only_no_records_retrieved',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
