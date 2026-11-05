import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const adSpendBreakevenSkill: Skill = {
  id: 'ad_spend_breakeven',
  name: 'Ad Spend Break-Even Scoper',
  description: "Models cost per lead, meeting conversions, and average contract values to map the exact break-even point for advertising campaigns using NEMOTRON.",
  category: 'general',
  icon: 'TrendingUp',
  inputs: [
    {
      name: 'monthlyAdSpend',
      label: 'Monthly Ad Spend Budget (USD)',
      type: 'string',
      required: true,
      defaultValue: ''
    },
    {
      name: 'cpl',
      label: 'Estimated Cost Per Lead (USD)',
      type: 'string',
      required: true,
      defaultValue: ''
    },
    {
      name: 'meetingRate',
      label: 'Lead-to-Meeting Rate (%)',
      type: 'string',
      required: true,
      defaultValue: ''
    },
    {
      name: 'dealRate',
      label: 'Meeting-to-Deal Close Rate (%)',
      type: 'string',
      required: true,
      defaultValue: ''
    },
    {
      name: 'dealValue',
      label: 'Average Deal Value / Client LTV (USD)',
      type: 'string',
      required: true,
      defaultValue: ''
    },
    {
      name: 'serviceMargin',
      label: 'Service Gross Fulfillment Margin (%)',
      type: 'string',
      required: true,
      defaultValue: ''
    }
  ],
  execute: async (inputs, contractorId) => {
    const { monthlyAdSpend, cpl, meetingRate, dealRate, dealValue, serviceMargin } = inputs;

    const adSpend = Number(monthlyAdSpend);
    const costPerLead = Number(cpl);
    const meetRate = Number(meetingRate);
    const dRate = Number(dealRate);
    const dValue = Number(dealValue);
    const sMargin = Number(serviceMargin);
    if (![adSpend, costPerLead, meetRate, dRate, dValue, sMargin].every(Number.isFinite) ||
        adSpend <= 0 || costPerLead <= 0 || dValue <= 0 ||
        meetRate < 0 || meetRate > 100 || dRate < 0 || dRate > 100 ||
        sMargin <= 0 || sMargin > 100) {
      throw new Error('Enter positive spend, CPL and deal value, with meeting, close and gross-margin percentages between 0 and 100.');
    }

    const leads = adSpend / costPerLead;
    const meetings = leads * (meetRate / 100);
    const closedDeals = meetings * (dRate / 100);
    const grossRevenue = closedDeals * dValue;
    const netCampaignProfit = (grossRevenue * (sMargin / 100)) - adSpend;
    const roas = adSpend > 0 ? grossRevenue / adSpend : 0;

    // Break-even revenue and deals
    const breakEvenRevenueNeeded = adSpend / (sMargin / 100);
    const breakEvenDealsNeeded = dValue > 0 ? breakEvenRevenueNeeded / dValue : 0;
    const breakEvenLeadsNeeded = leads > 0 && closedDeals > 0 ? (breakEvenDealsNeeded / closedDeals) * leads : 0;

    const adEconomicsReport = `### AD CAMPAIGN ECONOMIC MODEL SUMMARY

**Illustrative scenario from user-supplied assumptions (not measured campaign results):**
- **Monthly Budget:** $${adSpend.toFixed(2)}
- **Estimated Leads Generated:** ${leads.toFixed(1)} leads
- **Estimated Scheduled Meetings:** ${meetings.toFixed(1)} opportunities
- **Estimated Closed Deals:** ${closedDeals.toFixed(2)} contracts
- **Scenario Gross Revenue:** $${grossRevenue.toFixed(2)}
- **Fulfillment Margin Share:** $${(grossRevenue * (sMargin / 100)).toFixed(2)}
- **Return on Ad Spend (ROAS):** ${roas.toFixed(2)}x
- **Scenario Campaign Contribution After Ad Spend:** $${netCampaignProfit.toFixed(2)}

**Critical Break-Even Analysis:**
- **Revenue Needed to Cover Ad Spend & Fulfillment Costs:** $${breakEvenRevenueNeeded.toFixed(2)}
- **Deals Needed to Break Even:** ${breakEvenDealsNeeded.toFixed(2)} deals
- **Leads Needed to Break Even:** ${breakEvenLeadsNeeded.toFixed(1)} leads`;

    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Analyze client ad campaigns with cold, objective, mathematical precision. Offer Swiss-style executive directives.`;

    const userPrompt = `A business prospect is evaluating an ad budget with these metrics:
${adEconomicsReport}

Draft a neutral scenario explanation. Clearly state that the model is arithmetic based on user-entered assumptions, not a prediction or measured result. Do not guarantee ROI or say the budget is proven to make sense.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON calculations failed, using fallback report.', err);
    }

    if (!reportText) {
      reportText = `### PROPOSAL BRIEF: MATHEMATICAL PROJECTIONS

Dear Executive,

Using the assumptions entered, a **${adSpend} monthly spend** produces the following illustrative scenario. This is not a measured campaign result or a guarantee. With an average cost per lead of **$${costPerLead}**, the campaign generates **${leads.toFixed(0)} top-funnel leads**. 

Using the assumed **${meetRate}% lead-to-meeting rate** and **${dRate}% closing rate**, the arithmetic scenario produces **${closedDeals.toFixed(1)} new closed deals** with an average contract value of **$${dValue}**. This generates a gross pipeline value of **$${grossRevenue.toLocaleString()}** and a solid **${roas.toFixed(1)}x Return on Ad Spend**.

**Risk Mitigation Metrics:**
For this scenario, the break-even threshold is calculated from the supplied gross-margin assumption. Adjusting for your **${sMargin}% gross profit margin**, you only need to close **${breakEvenDealsNeeded.toFixed(1)} deals** out of the expected campaign leads to completely offset both your marketing budget and delivery fulfillment costs. This represents a minuscule **${(breakEvenDealsNeeded / leads * 100).toFixed(1)}% necessary conversion rate** of incoming leads to be entirely break-even. 

We recommend proceeding with this allocation.`;
    }

    return {
      success: true,
      adEconomicsReport,
      proposalBrief: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
