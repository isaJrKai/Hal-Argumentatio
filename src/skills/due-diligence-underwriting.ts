import { Skill } from './types';

export const dueDiligenceUnderwritingSkill: Skill = {
  id: 'due_diligence_underwriting',
  name: 'Corporate Due Diligence Preparation',
  description: 'Builds a jurisdiction-aware due-diligence request checklist. It does not query corporate registries, court records, sanctions lists, financial statements, or adverse-media databases.',
  category: 'research',
  icon: 'ShieldAlert',
  inputs: [
    { name: 'entityName', label: 'Target Entity / Business Name', type: 'string', required: true, defaultValue: '' },
    { name: 'jurisdiction', label: 'Corporate Jurisdiction', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const entityName = String(inputs.entityName || '').trim();
    const jurisdiction = String(inputs.jurisdiction || '').trim();
    if (!entityName || !jurisdiction) {
      throw new Error('Entity Name and Corporate Jurisdiction are required.');
    }

    const report = [
      '### DUE-DILIGENCE SCOPE',
      '- **Target entity:** ' + entityName,
      '- **Jurisdiction:** ' + jurisdiction,
      '- **External checks performed:** None. HAL has not queried a registry, court database, financial record, sanctions list, PEP source, or adverse-media provider.',
      '',
      '### CORPORATE AND LEGAL RECORDS TO OBTAIN',
      '- Official registration extract, legal entity number, current status, registered address, and filing history.',
      '- Current operating licences, permits, insurance certificates, and material regulatory correspondence.',
      '- Ownership chart, beneficial-owner declarations, director/officer list, and authority to sign.',
      '- Litigation, insolvency, liens, tax, employment, and material contract disclosures supported by jurisdiction-specific searches.',
      '',
      '### FINANCIAL AND OPERATIONAL RECORDS TO OBTAIN',
      '- Three years of signed financial statements and current management accounts.',
      '- Bank statements, debt schedules, tax filings, receivables/payables ageing, and cash-flow forecasts.',
      '- Customer concentration, supplier dependencies, recurring revenue evidence, churn, backlog, and pipeline definitions.',
      '- Employee roster, key-person dependencies, compensation liabilities, and critical operating procedures.',
      '',
      '### RISK REVIEW FRAMEWORK',
      '- Reconcile reported revenue and EBITDA to source financial records; document normalization adjustments.',
      '- Verify material customers, contracts, licences, insurance, assets, liabilities, and related-party transactions.',
      '- Search official litigation and insolvency records for the applicable jurisdiction.',
      '- Conduct authorized sanctions, PEP, beneficial-owner, and adverse-media screening.',
      '- Record each finding with source, date, reviewer, confidence, and unresolved questions.',
      '',
      '### UNDERWRITING DECISION',
      '**Status: REVIEW REQUIRED — NOT SCREENED.** No approve/decline recommendation, liquidity rating, litigation conclusion, or AML clearance can be supported by the information supplied to this skill.'
    ].join('\n');

    return {
      success: true,
      entityName,
      jurisdiction,
      dueDiligencePerformed: false,
      evidenceStatus: 'checklist_only_no_external_records_queried',
      underwritingDecision: 'REVIEW_REQUIRED',
      verifiedRegistryStatus: null,
      verifiedFinancials: null,
      litigationFindings: null,
      sanctionsFindings: null,
      report,
      executedAt: new Date().toISOString()
    };
  }
};
