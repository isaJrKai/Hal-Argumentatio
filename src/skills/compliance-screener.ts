import { Skill } from './types';

export const complianceScreenerSkill: Skill = {
  id: 'compliance_screener',
  name: 'KYC/KYB Screening Preparation',
  description: 'Prepares a source-led compliance screening checklist. No sanctions, PEP, beneficial-ownership, or adverse-media database is queried by this capability; results remain unknown until an authorized screening provider is connected.',
  category: 'research',
  icon: 'Shield',
  inputs: [
    { name: 'subjectName', label: 'Subject / Company Name', type: 'string', required: true, defaultValue: '' },
    { name: 'country', label: 'Country of Operation', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const subjectName = String(inputs.subjectName || '').trim();
    const country = String(inputs.country || '').trim();
    if (!subjectName || !country) {
      throw new Error('Subject Name and Country of Operation are required.');
    }

    const report = [
      '### KYC / KYB SCREENING STATUS',
      '- **Subject:** ' + subjectName,
      '- **Country:** ' + country,
      '- **Screening performed:** No',
      '- **Sanctions result:** Unknown — no sanctions-list provider was queried.',
      '- **PEP result:** Unknown — no PEP data provider was queried.',
      '- **Adverse-media result:** Unknown — no news or adverse-media search was performed.',
      '- **Beneficial ownership:** Not established.',
      '',
      '### REQUIRED CHECKS BEFORE A DECISION',
      '- Verify the legal entity and registration number with the official corporate registry in the relevant jurisdiction.',
      '- Screen the exact legal name and known aliases against current official sanctions lists (including OFAC, UN, EU, and applicable national lists).',
      '- Identify and verify beneficial owners and relevant directors using authoritative records.',
      '- Screen relevant persons for PEP exposure and adverse media using a documented, authorized source.',
      '- Resolve potential name matches using date of birth, jurisdiction, identifiers, and source records; do not treat a name-only match as a confirmed hit.',
      '- Record source URLs, retrieval dates, reviewer, match rationale, and escalation outcome.',
      '',
      '### DECISION',
      '**No AML risk rating or clearance can be issued from this result.** Do not approve, reject, or onboard the subject on the basis of this checklist alone.'
    ].join('\n');

    return {
      success: true,
      subjectName,
      country,
      screeningPerformed: false,
      evidenceStatus: 'no_external_screening_provider_queried',
      sanctionsMatches: null,
      pepMatches: null,
      adverseMediaMatches: null,
      riskRating: null,
      report,
      executedAt: new Date().toISOString()
    };
  }
};
