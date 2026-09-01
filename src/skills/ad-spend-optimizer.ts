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
      defaultValue: 1500,
    },
    {
      name: 'costPerLead',
      label: 'Current Cost Per Lead ($)',
      type: 'number',
      required: true,
      defaultValue: 75,
    },
    {
      name: 'conversionRate',
      label: 'Lead-to-Job Conversion (%)',
      type: 'number',
      required: true,
      defaultValue: 15,
    },
    {
      name: 'averageContractValue',
      label: 'Average Job Value ($)',
      type: 'number',
      required: true,
      defaultValue: 1200,
    }
  ],
  execute: async (inputs, contractorId) => {
    const monthlyBudget = Number(inputs.monthlyBudget || 1500);
    const costPerLead = Number(inputs.costPerLead || 75);
    const conversionRate = Number(inputs.conversionRate || 15) / 100;
    const averageContractValue = Number(inputs.averageContractValue || 1200);

    // Calculate baseline math
    const expectedLeads = Math.floor(monthlyBudget / costPerLead);
    const expectedJobs = Math.floor(expectedLeads * conversionRate);
    const grossRevenue = expectedJobs * averageContractValue;
    const adSpendRoi = monthlyBudget > 0 ? (grossRevenue - monthlyBudget) / monthlyBudget : 0;

    const systemPrompt = `You are HAL, the premier Financial and Marketing Analytics Optimizer. 
You generate Swiss-style, objective, highly precise cost-efficiency recommendations. No fluff, no exclamation marks.`;

    const userPrompt = `Analyze the following performance metrics and write a highly analytical budget-optimization report:
- Monthly Budget: $${monthlyBudget}
- Cost Per Lead (CPL): $${costPerLead}
- Lead-to-Job Conversion Rate: ${(conversionRate * 100).toFixed(1)}%
- Average Job Value: $${averageContractValue}
- Generated Leads: ${expectedLeads}
- Converted Jobs: ${expectedJobs}
- Gross Revenue Projection: $${grossRevenue}
- Net ROI Factor: ${(adSpendRoi * 100).toFixed(1)}%

Please compile the report following this strict structure:
1. COST ACCRUAL ASSESSMENT: Evaluate if the current CPL of $${costPerLead} is healthy for their industry niche, and outline conversion-funnel bottlenecks.
2. OPTIMAL RE-ALLOCATION RATIOS: Recommend a split of the budget between Google Local Services Ads (LSA), standard Google Search Ads, and organic SEO.
3. 90-DAY FORECAST MATRIX: A Markdown table demonstrating expected leads, jobs, and ROI improvements if conversion rate is increased by 5%.`;

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

The primary friction point is the **Conversion Rate**. At **${(conversionRate * 100).toFixed(0)}%**, you are losing up to 85% of inbound inquiries due to delays in lead response or lack of automated text-back systems.

### OPTIMAL RE-ALLOCATION RATIOS
To maximize customer acquisition value, we recommend restructuring the budget as follows:
- **Local Services Ads (LSA) (50%)**: Direct $${(monthlyBudget * 0.5).toFixed(0)} to pay-per-booked-job campaigns. This lowers booking risk.
- **Google Search Ads (30%)**: Allocate $${(monthlyBudget * 0.3).toFixed(0)} for high-intent transactional keywords (e.g. "emergency services near me").
- **Speed Optimization & Local SEO (20%)**: Reinvest $${(monthlyBudget * 0.2).toFixed(0)} into page speed and review capture pipelines to lift organic traffic and conversion rates.

### 90-DAY FORECAST MATRIX (WITH +5% CONVERSION RATE UPLIFT)
| Metric | Current State | Proposed (+5% Conversion Uplift) | Net Delta |
| :--- | :--- | :--- | :--- |
| **Monthly Budget** | $${monthlyBudget} | $${monthlyBudget} | $0 |
| **Leads Sourced** | ${expectedLeads} | ${expectedLeads} | 0 |
| **Conversion Rate** | ${(conversionRate * 100).toFixed(1)}% | ${(conversionRate * 100 + 5).toFixed(1)}% | +5.0% |
| **Jobs Completed** | ${expectedJobs} | ${Math.floor(expectedLeads * (conversionRate + 0.05))} | +${Math.floor(expectedLeads * (conversionRate + 0.05)) - expectedJobs} |
| **Gross Revenue** | $${grossRevenue} | $${Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue} | +$${(Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - grossRevenue} |
| **Net ROI** | ${(adSpendRoi * 100).toFixed(0)}% | ${(((Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - monthlyBudget) / monthlyBudget * 100).toFixed(0)}% | +${((((Math.floor(expectedLeads * (conversionRate + 0.05)) * averageContractValue) - monthlyBudget) / monthlyBudget) - adSpendRoi).toFixed(2).replace('-', '')}% |`;
    }

    return {
      success: true,
      monthlyBudget,
      costPerLead,
      conversionRate,
      averageContractValue,
      grossRevenue,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
