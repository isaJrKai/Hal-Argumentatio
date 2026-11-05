import { Skill } from './types';

export const talentArbitrageBridgeSkill: Skill = {
  id: 'talent_arbitrage_bridge',
  name: 'Managed Remote Talent Service Planner',
  description: 'Creates an operating plan for a managed remote-talent service from user-supplied assumptions. It does not verify local wages, overseas demand, candidate quality, or buyer willingness to pay.',
  category: 'general',
  icon: 'Cpu',
  inputs: [
    { name: 'serviceCategory', label: 'Service Category', type: 'string', required: true, defaultValue: '' },
    { name: 'talentLocation', label: 'Talent Location / Region', type: 'string', required: true, defaultValue: '' },
    { name: 'targetOverseasMarket', label: 'Target Overseas Market', type: 'string', required: true, defaultValue: '' },
    { name: 'pricingMarkupPercent', label: 'Proposed Managed Markup (%)', type: 'string', required: true, defaultValue: '' },
    { name: 'riskMitigationOffer', label: 'Proposed Pilot Offer', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const serviceCategory = String(inputs.serviceCategory || '').trim();
    const talentLocation = String(inputs.talentLocation || '').trim();
    const targetOverseasMarket = String(inputs.targetOverseasMarket || '').trim();
    const markup = Number(inputs.pricingMarkupPercent);
    const pilotOffer = String(inputs.riskMitigationOffer || '').trim();

    if (!serviceCategory || !talentLocation || !targetOverseasMarket || !pilotOffer) {
      throw new Error('Service category, talent location, target market, and pilot offer are required.');
    }
    if (!Number.isFinite(markup) || markup < 0 || markup > 1000) {
      throw new Error('Enter a proposed markup between 0 and 1000 percent.');
    }

    const report = [
      '### SERVICE SCOPE',
      '- Service category: ' + serviceCategory,
      '- Talent location supplied: ' + talentLocation,
      '- Target client market supplied: ' + targetOverseasMarket,
      '- Proposed markup assumption: ' + markup + '% over talent pay',
      '- Pilot offer supplied: ' + pilotOffer,
      '',
      '### OPERATING MODEL TO VALIDATE',
      '1. Define a narrow deliverable with measurable acceptance criteria and a sample task.',
      '2. Recruit through lawful channels and assess role-specific skills using consistent, paid or otherwise lawful tests.',
      '3. Verify identity, references, work eligibility, data-handling capability, communication expectations, and contractual terms.',
      '4. Run a supervised pilot with written scope, hours, quality criteria, confidentiality, data access, and exit conditions.',
      '5. Maintain human account management, quality reviews, backup coverage, incident escalation, and transparent client reporting.',
      '',
      '### FAIR PRICING FRAMEWORK',
      '- Calculate the client rate from verified talent pay plus the proposed markup assumption.',
      '- Include management time, recruiting, payment fees, taxes, currency conversion, leave, non-billable time, replacement risk, and support costs.',
      '- Disclose the talent compensation and service responsibilities clearly; do not describe the model as risk-free.',
      '',
      '### MARKET VALIDATION REQUIRED',
      '- No wage survey, candidate assessment, client-demand research, competitor pricing, or buyer interviews were performed.',
      '- Validate local pay expectations and applicable employment/contractor rules before quoting rates.',
      '- Validate buyer demand and willingness to pay through real interviews and paid pilots; do not infer demand from this plan.',
      '',
      '**Evidence status:** Planning only. No candidates were sourced or vetted, no clients were contacted, and no pricing benchmark was retrieved.'
    ].join('\n');

    return {
      success: true,
      serviceCategory,
      talentLocation,
      targetOverseasMarket,
      pricingMarkupPercent: markup,
      pilotOffer,
      scenarioOnly: true,
      evidenceStatus: 'planning_only_no_market_data_or_candidates_verified',
      candidateVettingPerformed: false,
      buyerResearchPerformed: false,
      report,
      executedAt: new Date().toISOString()
    };
  }
};
