import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const listSubscriptionPricingSkill: Skill = {
  id: 'list_subscription_pricing',
  name: 'Lead List Pricing Optimizer',
  description: "Calculates compilation and verification labor costs versus licensing or subscription pricing models to maximize Return on Time Invested (ROTI) using NEMOTRON.",
  category: 'general',
  icon: 'Database',
  inputs: [
    {
      name: 'listHours',
      label: 'Hours Spent Compiling & Verifying List',
      type: 'string',
      required: true,
      defaultValue: '6'
    },
    {
      name: 'hourlyRate',
      label: 'Hourly Labor Valuation Rate (USD/hr)',
      type: 'string',
      required: true,
      defaultValue: '50'
    },
    {
      name: 'toolCosts',
      label: 'Software & Proxy Overhead Costs (USD)',
      type: 'string',
      required: true,
      defaultValue: '20'
    },
    {
      name: 'modelType',
      label: 'Sales Model (one-time or subscription)',
      type: 'select',
      required: true,
      defaultValue: 'subscription',
      options: ['one-time', 'subscription']
    },
    {
      name: 'unitPrice',
      label: 'Unit Sale Price / Monthly Subscription Rate (USD)',
      type: 'string',
      required: true,
      defaultValue: '99'
    },
    {
      name: 'volume',
      label: 'Target Volume (Licenses sold or Subscribers signed)',
      type: 'string',
      required: true,
      defaultValue: '12'
    }
  ],
  execute: async (inputs, contractorId) => {
    const { listHours, hourlyRate, toolCosts, modelType, unitPrice, volume } = inputs;

    const hours = parseFloat(listHours) || 6;
    const rate = parseFloat(hourlyRate) || 50;
    const tools = parseFloat(toolCosts) || 20;
    const price = parseFloat(unitPrice) || 99;
    const targetVolume = parseFloat(volume) || 12;

    const totalBuildCost = (hours * rate) + tools;
    let grossRevenue = 0;
    let netProfit = 0;
    let breakEvenSales = 0;
    let roti = 0;
    let modelDetailLine = '';

    if (modelType === 'one-time') {
      grossRevenue = price * targetVolume;
      netProfit = grossRevenue - totalBuildCost;
      breakEvenSales = price > 0 ? Math.ceil(totalBuildCost / price) : 0;
      roti = totalBuildCost > 0 ? (netProfit / totalBuildCost) * 100 : 0;
      modelDetailLine = `- **Target License Sales Count:** ${targetVolume} licenses at $${price} each`;
    } else {
      // subscription monthly and annualization
      const monthlyRevenue = price * targetVolume;
      grossRevenue = monthlyRevenue * 12; // Annual projections
      netProfit = grossRevenue - totalBuildCost;
      breakEvenSales = price > 0 ? Math.ceil(totalBuildCost / price) : 0;
      roti = totalBuildCost > 0 ? (netProfit / totalBuildCost) * 100 : 0;
      modelDetailLine = `- **Target Active Subscribers:** ${targetVolume} subscribers at $${price}/mo
- **Monthly Recurring Revenue (MRR):** $${monthlyRevenue.toFixed(2)}
- **Projected Annualized Gross Revenue:** $${grossRevenue.toFixed(2)}`;
    }

    const unitEconomicsSummary = `### LEAD LIST DATABASE PRODUCT UNIT ECONOMICS

**Internal Creation Costs (Asset Build):**
- **Labor Valuation (${hours} hrs @ $${rate}/hr):** $${(hours * rate).toFixed(2)}
- **API, Enrichment, Scraper Costs:** $${tools.toFixed(2)}
- **Total Asset Cost to Build:** $${totalBuildCost.toFixed(2)}

**Distribution Models Metrics:**
- **Product Model:** ${modelType === 'one-time' ? 'One-time Database Purchase' : 'Monthly Recurring Database Subscription'}
${modelDetailLine}
- **Projected Net Profit Run-rate:** $${netProfit.toFixed(2)}
- **Return on Time Invested (ROTI):** ${roti.toFixed(1)}%
- **Break-Even Volume Required:** ${breakEvenSales} accounts/licenses`;

    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Evaluate the market viability of digital information products and curated data lists. Outline Swiss-style, highly strategic action steps.`;

    const userPrompt = `A digital entrepreneur is preparing to launch a verified lead-list product with these parameters:
${unitEconomicsSummary}

Analyze this business model and detail a 3-step marketing and launch playbook designed to secure the target active subscriber or license sales volume with maximum velocity. Keep it concise, high-impact, and fully custom-tailored to selling curated list databases.`;

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
      reportText = `### LEAD-LIST PACKAGING & LAUNCH PLAYBOOK

1. **Offer a Sample Teaser Database (The Cold Outreach Hook):**
   - Package a 10-line, 100% verified sample list of elite leads in your chosen city/niche. Deliver this sample directly to prospects in your outreach. Let them verify the email delivery rates themselves to prove your lists have 0% bounce rate.

2. **Position as "Trigger Event" Enrichment:**
   - Rather than selling a static list, market the subscription as a live stream of "Trigger Events" (e.g. newly registered LLCs, businesses running heavy ads but lacking active websites). This converts a commodities purchase into high-value strategic trigger insights, reducing subscription churn.

3. **Deploy "Found Money" Risk-Free Trials:**
   - Offer a pilot group of 5 agencies the list with a guarantee: "If you do not book at least 1 meeting from this 100-contact list, your subscription is free." This builds overwhelming case studies, enabling you to scale the subscriber base rapidly.`;
    }

    return {
      success: true,
      unitEconomicsSummary,
      launchPlaybook: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
