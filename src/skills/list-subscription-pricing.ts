import { Skill } from './types';

export const listSubscriptionPricingSkill: Skill = {
  id: 'list_subscription_pricing',
  name: 'Lead List Pricing Scenario Calculator',
  description: 'Calculates illustrative list-product pricing and build-cost scenarios from user-supplied assumptions. It does not retrieve leads, validate contacts, or measure market willingness to pay.',
  category: 'general',
  icon: 'Database',
  inputs: [
    { name: 'listHours', label: 'Hours Spent Compiling & Verifying List', type: 'string', required: true, defaultValue: '' },
    { name: 'hourlyRate', label: 'Hourly Labor Valuation Rate (USD/hr)', type: 'string', required: true, defaultValue: '' },
    { name: 'toolCosts', label: 'Software & Tool Overhead Costs (USD)', type: 'string', required: true, defaultValue: '' },
    { name: 'modelType', label: 'Sales Model', type: 'select', required: true, defaultValue: 'subscription', options: ['one-time', 'subscription'] },
    { name: 'unitPrice', label: 'Unit Sale Price / Monthly Subscription Rate (USD)', type: 'string', required: true, defaultValue: '' },
    { name: 'volume', label: 'Target Licenses Sold / Active Subscribers', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const hours = Number(inputs.listHours);
    const rate = Number(inputs.hourlyRate);
    const tools = Number(inputs.toolCosts);
    const price = Number(inputs.unitPrice);
    const volume = Number(inputs.volume);
    const modelType = String(inputs.modelType || 'subscription');

    if (!['one-time', 'subscription'].includes(modelType)) throw new Error('Choose one-time or subscription.');
    if (![hours, rate, tools, price, volume].every(Number.isFinite) ||
        hours <= 0 || rate <= 0 || tools < 0 || price <= 0 || volume <= 0) {
      throw new Error('Enter positive hours, labor rate, unit price and volume; tool costs may be zero but not negative.');
    }

    const buildCost = hours * rate + tools;
    const breakEvenUnits = Math.ceil(buildCost / price);
    let revenue = 0;
    let contribution = 0;
    let periodLabel = '';

    if (modelType === 'one-time') {
      revenue = price * volume;
      contribution = revenue - buildCost;
      periodLabel = 'one-time sales';
    } else {
      const monthlyRevenue = price * volume;
      revenue = monthlyRevenue * 12;
      contribution = revenue - buildCost;
      periodLabel = '12-month gross subscription revenue scenario';
    }
    const rotiPercent = buildCost > 0 ? contribution / buildCost * 100 : 0;

    const report = [
      '### LEAD LIST PRODUCT PRICING SCENARIO',
      '- Sales model: ' + modelType,
      '- Labor hours assumption: ' + hours,
      '- Hourly labor valuation assumption: $' + rate.toFixed(2),
      '- Tool-cost assumption: $' + tools.toFixed(2),
      '- One-time build cost: $' + buildCost.toFixed(2),
      '- Unit price assumption: $' + price.toFixed(2) + (modelType === 'subscription' ? '/month' : ''),
      '- Volume assumption: ' + volume,
      '- ' + periodLabel + ': $' + revenue.toFixed(2),
      '- Contribution after one-time build cost: $' + contribution.toFixed(2),
      '- Scenario return on build cost: ' + rotiPercent.toFixed(1) + '%',
      '- Break-even units at the assumed price: ' + breakEvenUnits,
      '',
      '**Important limitations:** This calculation excludes ongoing list refresh and verification labor, customer acquisition, payment fees, support, refunds, churn, taxes, legal compliance, and the cost of acquiring source data. A subscription model must include recurring update costs before being treated as profitable.',
      '**Evidence boundary:** No records were collected or verified, and no market pricing or demand data was queried. These are user-entered assumptions, not a forecast.'
    ].join('\n');

    return {
      success: true,
      modelType,
      assumptions: { hours, hourlyRateUsd: rate, toolCostsUsd: tools, unitPriceUsd: price, volume },
      calculations: { buildCostUsd: buildCost, revenueScenarioUsd: revenue, contributionScenarioUsd: contribution, rotiScenarioPercent: rotiPercent, breakEvenUnits },
      scenarioOnly: true,
      evidenceStatus: 'user_supplied_assumptions_only_no_lead_data_retrieved',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
