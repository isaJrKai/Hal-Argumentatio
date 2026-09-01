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
      defaultValue: '1000'
    },
    {
      name: 'cpl',
      label: 'Estimated Cost Per Lead (USD)',
      type: 'string',
      required: true,
      defaultValue: '50'
    },
    {
      name: 'meetingRate',
      label: 'Lead-to-Meeting Rate (%)',
      type: 'string',
      required: true,
      defaultValue: '20'
    },
    {
      name: 'dealRate',
      label: 'Meeting-to-Deal Close Rate (%)',
      type: 'string',
      required: true,
      defaultValue: '25'
    },
    {
      name: 'dealValue',
      label: 'Average Deal Value / Client LTV (USD)',
      type: 'string',
      required: true,
      defaultValue: '2500'
    },
    {
      name: 'serviceMargin',
      label: 'Service Gross Fulfillment Margin (%)',
      type: 'string',
      required: true,
      defaultValue: '60'
    }
  ],
  execute: async (inputs, contractorId) => {
    const { monthlyAdSpend, cpl, meetingRate, dealRate, dealValue, serviceMargin } = inputs;

    const adSpend = parseFloat(monthlyAdSpend) || 1000;
    const costPerLead = parseFloat(cpl) || 50;
    const meetRate = parseFloat(meetingRate) || 20;
    const dRate = parseFloat(dealRate) || 25;
    const dValue = parseFloat(dealValue) || 2500;
    const sMargin = parseFloat(serviceMargin) || 60;

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

**Core Metrics Projection:**
- **Monthly Budget:** $${adSpend.toFixed(2)}
- **Estimated Leads Generated:** ${leads.toFixed(1)} leads
- **Estimated Scheduled Meetings:** ${meetings.toFixed(1)} opportunities
- **Estimated Closed Deals:** ${closedDeals.toFixed(2)} contracts
- **Projected Gross Revenue:** $${grossRevenue.toFixed(2)}
- **Fulfillment Margin Share:** $${(grossRevenue * (sMargin / 100)).toFixed(2)}
- **Return on Ad Spend (ROAS):** ${roas.toFixed(2)}x
- **Projected Campaign Net Profit:** $${netCampaignProfit.toFixed(2)}

**Critical Break-Even Analysis:**
- **Revenue Needed to Cover Ad Spend & Fulfillment Costs:** $${breakEvenRevenueNeeded.toFixed(2)}
- **Deals Needed to Break Even:** ${breakEvenDealsNeeded.toFixed(2)} deals
- **Leads Needed to Break Even:** ${breakEvenLeadsNeeded.toFixed(1)} leads`;

    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Analyze client ad campaigns with cold, objective, mathematical precision. Offer Swiss-style executive directives.`;

    const userPrompt = `A business prospect is evaluating an ad budget with these metrics:
${adEconomicsReport}

Draft a highly persuasive, numbers-driven proposal brief proving why this budget makes absolute mathematical sense. Clearly address their risk threshold (break-even point) to secure their buy-in.`;

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

Based on your target parameters, committing to a **$${adSpend} monthly spend** carries a highly optimized risk profile. With an average cost per lead of **$${costPerLead}**, the campaign generates **${leads.toFixed(0)} top-funnel leads**. 

Assuming a conservative **${meetRate}% lead-to-meeting rate** and a standard **${dRate}% closing rate**, we anticipate converting **${closedDeals.toFixed(1)} new closed deals** with an average contract value of **$${dValue}**. This generates a gross pipeline value of **$${grossRevenue.toLocaleString()}** and a solid **${roas.toFixed(1)}x Return on Ad Spend**.

**Risk Mitigation Metrics:**
To satisfy a absolute risk-neutral commitment, we have calculated your precise break-even threshold. Adjusting for your **${sMargin}% gross profit margin**, you only need to close **${breakEvenDealsNeeded.toFixed(1)} deals** out of the expected campaign leads to completely offset both your marketing budget and delivery fulfillment costs. This represents a minuscule **${(breakEvenDealsNeeded / leads * 100).toFixed(1)}% necessary conversion rate** of incoming leads to be entirely break-even. 

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
