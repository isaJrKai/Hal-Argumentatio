import { Skill } from './types';

export const maTargetIntelSkill: Skill = {
  id: 'ma_target_intel',
  name: 'M&A Target Scenario Model',
  description: 'Calculates an illustrative valuation range from user-supplied revenue, EBITDA margin, and multiple assumptions. It does not retrieve company financials, comparable transactions, or verified synergy data.',
  category: 'forecast',
  icon: 'TrendingUp',
  inputs: [
    { name: 'targetCompany', label: 'Target Company Name', type: 'string', required: true, defaultValue: '' },
    { name: 'estimatedRevenue', label: 'User-supplied Annual Revenue Assumption (USD)', type: 'number', required: true, defaultValue: '' },
    { name: 'industry', label: 'Industry Niche', type: 'string', required: true, defaultValue: '' },
    { name: 'ebitdaMarginPercent', label: 'Assumed EBITDA Margin (%)', type: 'number', required: true, defaultValue: '' },
    { name: 'lowMultiple', label: 'Low EBITDA Multiple Assumption (x)', type: 'number', required: true, defaultValue: '' },
    { name: 'highMultiple', label: 'High EBITDA Multiple Assumption (x)', type: 'number', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const targetCompany = String(inputs.targetCompany || '').trim();
    const industry = String(inputs.industry || '').trim();
    const revenue = Number(inputs.estimatedRevenue);
    const marginPercent = Number(inputs.ebitdaMarginPercent);
    const lowMultiple = Number(inputs.lowMultiple);
    const highMultiple = Number(inputs.highMultiple);

    if (!targetCompany || !industry) throw new Error('Target Company and Industry are required.');
    if (![revenue, marginPercent, lowMultiple, highMultiple].every(Number.isFinite) ||
        revenue <= 0 || marginPercent <= 0 || marginPercent > 100 ||
        lowMultiple <= 0 || highMultiple <= 0 || lowMultiple > highMultiple) {
      throw new Error('Enter positive revenue and multiples, an EBITDA margin from 0 to 100, and a low multiple no greater than the high multiple.');
    }

    const ebitda = revenue * marginPercent / 100;
    const enterpriseValueLow = ebitda * lowMultiple;
    const enterpriseValueHigh = ebitda * highMultiple;
    const currency = (value: number) => '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });

    const report = [
      '### ILLUSTRATIVE VALUATION SCENARIO',
      '- **Target:** ' + targetCompany,
      '- **Industry supplied:** ' + industry,
      '- **Revenue assumption:** ' + currency(revenue),
      '- **EBITDA margin assumption:** ' + marginPercent + '%',
      '- **Calculated EBITDA scenario:** ' + currency(ebitda),
      '- **Low multiple assumption:** ' + lowMultiple + 'x',
      '- **High multiple assumption:** ' + highMultiple + 'x',
      '- **Illustrative enterprise value range:** ' + currency(enterpriseValueLow) + ' – ' + currency(enterpriseValueHigh),
      '',
      '**These are arithmetic scenarios, not a valuation opinion.** HAL did not verify revenue, EBITDA, debt, cash, working capital, comparable transactions, market multiples, or the target company identity.',
      '',
      '### SYNERGY QUESTIONS TO VALIDATE',
      '- Which customer segments, service areas, suppliers, and contracts genuinely overlap?',
      '- Can dispatch density, procurement, or shared administration reduce cost without harming service?',
      '- What customer retention, employee retention, technology migration, and contract-consent risks exist?',
      '- What one-time integration costs and ongoing costs offset any proposed savings?',
      '',
      '### REQUIRED EVIDENCE BEFORE AN OFFER',
      '- Reconcile revenue and EBITDA to signed financial statements, tax records, and bank evidence.',
      '- Normalize owner compensation, one-off costs, deferred maintenance, and related-party transactions.',
      '- Verify debt, cash, working capital, leases, tax liabilities, litigation, licences, and customer concentration.',
      '- Support selected multiples with current comparable transactions and explain differences in size, growth, geography, and risk.',
      '- Calculate enterprise value to equity value bridge using verified debt, cash, and working capital.',
      '',
      '**Decision status:** Diligence required. Do not use this scenario alone to make an offer or represent a target value.'
    ].join('\n');

    return {
      success: true,
      targetCompany,
      industry,
      assumptions: {
        revenueUsd: revenue,
        ebitdaMarginPercent: marginPercent,
        lowMultiple,
        highMultiple
      },
      calculated: {
        ebitdaUsd: ebitda,
        enterpriseValueLowUsd: enterpriseValueLow,
        enterpriseValueHighUsd: enterpriseValueHigh
      },
      scenarioOnly: true,
      evidenceStatus: 'user_supplied_assumptions_only',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
