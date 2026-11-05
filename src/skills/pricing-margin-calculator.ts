import { Skill } from './types';

export const pricingMarginCalculatorSkill: Skill = {
  id: 'pricing_margin_calculator',
  name: 'Pricing & Margin Scenario Calculator',
  description: 'Calculates illustrative unit economics from user-supplied pay, markup, hours, retainer, and cost assumptions. Results are scenarios, not measured profitability or market benchmarks.',
  category: 'general',
  icon: 'DollarSign',
  inputs: [
    { name: 'modelType', label: 'Model Type', type: 'select', required: true, defaultValue: 'arbitrage', options: ['arbitrage', 'ops'] },
    { name: 'workerPay', label: 'Worker Hourly Pay (arbitrage) or Monthly Software Cost (ops), USD', type: 'string', required: true, defaultValue: '' },
    { name: 'markupPercentOrRetainer', label: 'Markup Percent (arbitrage) or Monthly Client Retainer (ops), USD', type: 'string', required: true, defaultValue: '' },
    { name: 'weeklyHoursOrAdminHours', label: 'Billable Hours per Week (arbitrage) or Admin Hours per Month (ops)', type: 'string', required: true, defaultValue: '' },
    { name: 'adminHourlyCost', label: 'Assumed Admin Hourly Cost (ops only), USD', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const modelType = String(inputs.modelType || 'arbitrage');
    const pay = Number(inputs.workerPay);
    const markupOrRetainer = Number(inputs.markupPercentOrRetainer);
    const hours = Number(inputs.weeklyHoursOrAdminHours);
    const adminHourlyCost = Number(inputs.adminHourlyCost);

    if (!['arbitrage', 'ops'].includes(modelType)) throw new Error('Choose arbitrage or ops.');
    if (![pay, markupOrRetainer, hours].every(Number.isFinite) || pay <= 0 || markupOrRetainer <= 0 || hours <= 0) {
      throw new Error('Enter positive pay/software cost, markup/retainer, and hours.');
    }

    let report: string;
    let calculations: Record<string, number>;
    if (modelType === 'arbitrage') {
      if (markupOrRetainer > 1000) throw new Error('Markup percentage must be no greater than 1000%.');
      const clientHourlyRate = pay * (1 + markupOrRetainer / 100);
      const spreadPerHour = clientHourlyRate - pay;
      const weeklyCost = pay * hours;
      const weeklyRevenue = clientHourlyRate * hours;
      const weeklySpread = weeklyRevenue - weeklyCost;
      const annualSpread = weeklySpread * 52;
      const grossSpreadMarginPercent = clientHourlyRate > 0 ? spreadPerHour / clientHourlyRate * 100 : 0;

      calculations = {
        clientHourlyRateUsd: clientHourlyRate,
        spreadPerHourUsd: spreadPerHour,
        weeklyCostUsd: weeklyCost,
        weeklyRevenueUsd: weeklyRevenue,
        weeklySpreadUsd: weeklySpread,
        annualizedSpreadBeforeOtherCostsUsd: annualSpread,
        grossSpreadMarginPercent
      };
      report = [
        '### ARBITRAGE PRICING SCENARIO',
        '- Worker pay assumption: $' + pay.toFixed(2) + '/hour',
        '- Markup assumption: ' + markupOrRetainer + '%',
        '- Illustrative client rate: $' + clientHourlyRate.toFixed(2) + '/hour',
        '- Gross spread: $' + spreadPerHour.toFixed(2) + '/hour',
        '- Billable hours assumption: ' + hours + ' per week',
        '- Weekly spread before other costs: $' + weeklySpread.toFixed(2),
        '- Annualized spread before other costs: $' + annualSpread.toFixed(2),
        '- Gross spread margin: ' + grossSpreadMarginPercent.toFixed(1) + '%',
        '',
        '**Excluded from this calculation:** taxes, payment fees, recruiting, management time, non-billable hours, leave, currency conversion, churn, bad debt, insurance, and overhead. Annualization assumes 52 weeks at the same billable hours and rate.'
      ].join('\n');
    } else {
      if (!Number.isFinite(adminHourlyCost) || adminHourlyCost <= 0) {
        throw new Error('Enter a positive assumed admin hourly cost for the ops model.');
      }
      const monthlySoftwareCost = pay;
      const monthlyRetainer = markupOrRetainer;
      const monthlyMaintenanceCost = hours * adminHourlyCost;
      const monthlyTotalCost = monthlySoftwareCost + monthlyMaintenanceCost;
      const monthlyContribution = monthlyRetainer - monthlyTotalCost;
      const contributionMarginPercent = monthlyRetainer > 0 ? monthlyContribution / monthlyRetainer * 100 : 0;

      calculations = {
        monthlySoftwareCostUsd: monthlySoftwareCost,
        monthlyRetainerUsd: monthlyRetainer,
        adminHoursPerMonth: hours,
        adminHourlyCostUsd: adminHourlyCost,
        monthlyMaintenanceCostUsd: monthlyMaintenanceCost,
        monthlyTotalCostUsd: monthlyTotalCost,
        monthlyContributionBeforeOtherCostsUsd: monthlyContribution,
        contributionMarginPercent,
        annualizedContributionBeforeOtherCostsUsd: monthlyContribution * 12
      };
      report = [
        '### AUTOMATION OPS PRICING SCENARIO',
        '- Client retainer assumption: $' + monthlyRetainer.toFixed(2) + '/month',
        '- Software/API cost assumption: $' + monthlySoftwareCost.toFixed(2) + '/month',
        '- Admin hours assumption: ' + hours + ' per month',
        '- Admin hourly cost assumption: $' + adminHourlyCost.toFixed(2),
        '- Calculated maintenance cost: $' + monthlyMaintenanceCost.toFixed(2) + '/month',
        '- Total modeled cost: $' + monthlyTotalCost.toFixed(2) + '/month',
        '- Contribution before other costs: $' + monthlyContribution.toFixed(2) + '/month',
        '- Contribution margin: ' + contributionMarginPercent.toFixed(1) + '%',
        '- Annualized contribution before other costs: $' + (monthlyContribution * 12).toFixed(2),
        '',
        '**Excluded from this calculation:** taxes, payment fees, customer support outside the entered hours, onboarding, churn, infrastructure overages, compliance, and other operating costs.'
      ].join('\n');
    }

    return {
      success: true,
      modelType,
      calculations,
      scenarioOnly: true,
      evidenceStatus: 'user_supplied_assumptions_only',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
