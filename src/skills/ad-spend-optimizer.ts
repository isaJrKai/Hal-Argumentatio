import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const adSpendOptimizerSkill: Skill = {
  id: 'ad_spend_optimizer',
  name: 'Ad Spend & ROI Optimizer',
  description: "Evaluates marketing acquisition costs (CPL), budget allocations, and models a 90-day ROI projection using NEMOTRON.",
  category: 'forecast',
  icon: 'TrendingUp',
  inputs: [
    {
      name: 'monthlyBudget',
      label: 'Monthly Ad Spend ($)',
      type: 'number',
      required: true,
      defaultValue: '',
    },
    {
      name: 'costPerLead',
      label: 'Current Cost Per Lead ($)',
      type: 'number',
      required: true,
      defaultValue: '',
    },
    {
      name: 'conversionRate',
      label: 'Lead-to-Job Conversion (%)',
      type: 'number',
      required: true,
      defaultValue: '',
    },
    {
      name: 'averageContractValue',
      label: 'Average Job Value ($)',
      type: 'number',
      required: true,
      defaultValue: '',
    }
  ],
  execute: async (inputs, contractorId) => {
    const monthlyBudget = Number(inputs.monthlyBudget);
    const costPerLead = Number(inputs.costPerLead);
    const conversionRateInput = Number(inputs.conversionRate);
    const conversionRate = conversionRateInput / 100;
    const averageContractValue = Number(inputs.averageContractValue);
    if (![monthlyBudget, costPerLead, conversionRateInput, averageContractValue].every(Number.isFinite) || monthlyBudget <= 0 || costPerLead <= 0 || conversionRateInput < 0 || conversionRateInput > 100 || averageContractValue <= 0) {
      throw new Error('Enter a positive budget, positive CPL, a conversion rate from 0 to 100, and a positive average job value.');
    }

    // Calculate baseline math
    const expectedLeads = Math.floor(monthlyBudget / costPerLead);
    const expectedJobs = Math.floor(expectedLeads * conversionRate);
    const grossRevenue = expectedJobs * averageContractValue;
    const adSpendRoi = monthlyBudget > 0 ? (grossRevenue - monthlyBudget) / monthlyBudget : 0;

    const systemPrompt = `You are HAL, the premier Financial and Marketing Analytics Optimizer. 
You generate careful scenario analysis. Do not describe user-entered assumptions as independently measured facts. Do not claim a CPL is healthy for an industry without verified industry benchmarks. Do not invent funnel causes or guaranteed improvement.`;

    const userPrompt = `Analyze the following user-supplied scenario assumptions. These are not independently verified campaign measurements. Write a budget scenario report:
- Monthly Budget: $${monthlyBudget}
- Cost Per Lead (CPL): $${costPerLead}
- Lead-to-Job Conversion Rate: ${(conversionRate * 100).toFixed(1)}%
- Average Job Value: $${averageContractValue}
- Generated Leads: ${expectedLeads}
- Converted Jobs: ${expectedJobs}
- Gross Revenue Projection: $${grossRevenue}
- Net ROI Factor: ${(adSpendRoi * 100).toFixed(1)}%

Please compile the report following this strict structure:
1. INPUT SCENARIO: Explain the arithmetic and assumptions; do not label CPL healthy/unhealthy without a benchmark or infer why leads fail to convert.
2. OPTIMAL RE-ALLOCATION RATIOS: Recommend a split of the budget between Google Local Services Ads (LSA), standard Google Search Ads, and organic SEO.
3. SENSITIVITY SCENARIO: A Markdown table showing the arithmetic if conversion rate increases by five percentage points. Clearly label this as hypothetical, not a forecast.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.1
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Ad Optimizer execute. Using fallback.', err);
    }

    if (!reportText) {
      reportText = `### COST ACCRUAL ASSESSMENT
The current acquisition metrics indicate a Cost Per Lead (CPL) of **$${costPerLead}**. With a budget of **$${monthlyBudget}**, this returns **${expectedLeads} leads/month**. The lead-to-job conversion rate of **${(conversionRate * 100).toFixed(0)}%** yields **${expectedJobs} completed jobs**, generating **$${grossRevenue} gross revenue** (${(adSpendRoi * 100).toFixed(0)}% ROI). 

This is a scenario calculation only. The conversion rate does not reveal why other leads did not become jobs; response delays or process issues would need separate evidence.

### OPTIMAL RE-ALLOCATION RATIOS
To maximize customer acquisition value, we recommend restructuring the budget as follows:
- **Local Services Ads (LSA) (50%)**: Direct $${(monthlyBudget * 0.5).toFixed(0)} to pay-per-booked-job campaigns. This lowers booking risk.
- **Google Search Ads (30%)**: Allocate $${(monthlyBudget * 0.3).toFixed(0)} for high-intent transactional keywords (e.g. "emergency services near me").
- **Speed Optimization & Local SEO (20%)**: Reinvest $${(monthlyBudget * 0.2).toFixed(0)} into page speed and review capture pipelines to lift organic traffic and conversion rates.

### HYPOTHETICAL SENSITIVITY SCENARIO (WITH +5 PERCENTAGE-POINT CONVERSION CHANGE)
| Metric | Current State | Proposed (+5% Conversion Uplift) | Net Delta |
| :--- | :--- | :--- | :--- |
| **Monthly Budget** | ${monthlyBudget} | ${monthlyBudget} | $0 |
| **Illustrative Leads** | ${expectedLeads} | ${expectedLeads} | 0 |
| **Conversion Rate** | ${(conversionRate * 100).toFixed(1)}% | ${(conversionRate * 100 + 5).toFixed(1)}% | +5.0% |
| **Illustrative Jobs** | ${expectedJobs} | ${Math.floor(expectedLeads * (conversionRate + 0.05))} | +${Math.floor(expectedLeads * (conversionRate + 0.05)) - expectedJobs} |
| **Illustrative Gross Revenue** | ${grossRevenue} | ${Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue} | +${(Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - grossRevenue} |
| **Net ROI** | ${(adSpendRoi * 100).toFixed(0)}% | ${(((Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - monthlyBudget) / monthlyBudget * 100).toFixed(0)}% | +${((((Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - monthlyBudget) / monthlyBudget) - adSpendRoi).toFixed(2).replace('-', '')}% |`;
    }

    return {
      success: true,
      monthlyBudget,
      costPerLead,
      conversionRate,
      averageContractValue,
      grossRevenue,
      evidenceStatus: 'user_supplied_scenario_assumptions',
      scenarioOnly: true,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
