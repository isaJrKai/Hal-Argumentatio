import { Skill } from './types';

export const patentLandscapeSkill: Skill = {
  id: 'patent_landscape',
  name: 'IP Search Preparation & Landscape Plan',
  description: 'Prepares a trademark, patent, and regulatory research plan. It does not query trademark registries, patent databases, or issue legal clearance.',
  category: 'research',
  icon: 'Globe',
  inputs: [
    { name: 'proposedBrand', label: 'Proposed Brand / Product Name', type: 'string', required: true, defaultValue: '' },
    { name: 'industrySector', label: 'Industry / Product Sector', type: 'string', required: true, defaultValue: '' },
    { name: 'jurisdiction', label: 'Target Jurisdictions', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const proposedBrand = String(inputs.proposedBrand || '').trim();
    const industrySector = String(inputs.industrySector || '').trim();
    const jurisdiction = String(inputs.jurisdiction || '').trim();
    if (!proposedBrand || !industrySector) throw new Error('Proposed Brand and Industry Sector are required.');

    const report = [
      '### IP RESEARCH SCOPE',
      '- **Proposed mark:** ' + proposedBrand,
      '- **Industry:** ' + industrySector,
      '- **Jurisdictions:** ' + (jurisdiction || 'Not supplied'),
      '- **Registry searches performed:** No',
      '- **Trademark clearance:** Not assessed',
      '- **Patent freedom-to-operate:** Not assessed',
      '- **Regulatory determination:** Not assessed',
      '',
      '### TRADEMARK SEARCH PLAN',
      '- Search exact, phonetic, visual, and conceptually similar marks in each target jurisdiction.',
      '- Check relevant goods/services classes and related classes.',
      '- Review pending, registered, expired, opposed, and cancelled records.',
      '- Retain registry URLs, application numbers, status, owner, filing date, and retrieval date.',
      '- Escalate confusingly similar marks to qualified trademark counsel; do not rely on a name-only search.',
      '',
      '### PATENT LANDSCAPE PLAN',
      '- Search relevant patent databases using product functions, technical features, inventors, assignees, and classifications.',
      '- Review claim scope, priority dates, family members, legal status, and jurisdictions.',
      '- Separate expired patents, pending applications, and active granted claims.',
      '- Obtain a professional freedom-to-operate opinion before commercial launch where appropriate.',
      '',
      '### REGULATORY AND LICENSING PLAN',
      '- Identify applicable sector regulators and product/service-specific licences in each target jurisdiction.',
      '- Map privacy, consumer protection, safety, labelling, and certification obligations to the actual product.',
      '- Record official regulator sources and effective dates.',
      '',
      '**Decision status: NOT CLEARED.** No USPTO, WIPO, patent-office, or regulator database was queried by this skill. No absence of conflicts or legal safety can be inferred.'
    ].join('\n');

    return {
      success: true,
      proposedBrand,
      industrySector,
      jurisdiction: jurisdiction || null,
      searchPerformed: false,
      clearanceStatus: 'NOT_ASSESSED',
      trademarkMatches: null,
      patentFindings: null,
      regulatoryFindings: null,
      evidenceStatus: 'research_plan_only_no_registry_queries',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
