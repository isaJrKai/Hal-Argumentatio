import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const pricingMarginCalculatorSkill: Skill = {
  id: 'pricing_margin_calculator',
  name: 'Pricing & Margin Calculator Scoper',
  description: "Evaluates the unit economics, worker pay spreads, and markups of Talent Arbitrage and Automation-Ops agency offerings using NEMOTRON.",
  category: 'general',
  icon: 'DollarSign',
  inputs: [
    {
      name: 'modelType',
      label: 'Model Type (arbitrage or ops)',
      type: 'select',
      required: true,
      defaultValue: 'arbitrage',
      options: ['arbitrage', 'ops']
    },
    {
      name: 'workerPay',
      label: 'Worker Hourly Pay (USD) / SaaS Overhead',
      type: 'string',
      required: true,
      defaultValue: '8',
    },
    {
      name: 'markupPercentOrRetainer',
      label: 'Markup % (for Arbitrage) or Client Monthly Retainer (for Ops)',
      type: 'string',
      required: true,
      defaultValue: '50',
    },
    {
      name: 'weeklyHoursOrAdminHours',
      label: 'Weekly Work Hours (for Arbitrage) or Admin Maint. Hours/mo (for Ops)',
      type: 'string',
      required: true,
      defaultValue: '30',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { modelType, workerPay, markupPercentOrRetainer, weeklyHoursOrAdminHours } = inputs;

    const pay = parseFloat(workerPay) || 8;
    const markupOrRetainer = parseFloat(markupPercentOrRetainer) || 50;
    const hours = parseFloat(weeklyHoursOrAdminHours) || 30;

    let marginAnalysis = '';

    if (modelType === 'arbitrage') {
      const clientHourlyRate = pay * (1 + markupOrRetainer / 100);
      const profitPerKeyHour = clientHourlyRate - pay;
      const weeklyCost = pay * hours;
      const weeklyRevenue = clientHourlyRate * hours;
      const weeklyProfit = weeklyRevenue - weeklyCost;
      const annualProfit = weeklyProfit * 52;
      const margin = (profitPerKeyHour / clientHourlyRate) * 100;

      marginAnalysis = `### TALENT ARBITRAGE FINANCIAL FEASIBILITY REPORT

**Unit Economics Summary:**
- **Talent Compensation:** $${pay.toFixed(2)}/hr
- **Markup Applied:** ${markupOrRetainer}%
- **Client End-Price:** $${clientHourlyRate.toFixed(2)}/hr
- **Gross Profit Margin:** ${margin.toFixed(1)}%
- **Your Net Spread:** $${profitPerKeyHour.toFixed(2)}/hr

**Weekly Forecast (Single Placement):**
- **Hours Committed:** ${hours} hours/week
- **Revenue Generated:** $${weeklyRevenue.toFixed(2)}/week
- **Fulfillment Cost:** $${weeklyCost.toFixed(2)}/week
- **Net Spread Revenue:** $${weeklyProfit.toFixed(2)}/week

**Scaling Model Projections (Annual Net Profit Run-rate):**
- **1 Active Placement:** $${annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
- **5 Active Placements:** $${(annualProfit * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
- **10 Active Placements:** $${(annualProfit * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year`;
    } else {
      // Ops
      const monthlySoftwareOverhead = pay; // Software cost (entered in workerPay)
      const retainer = markupOrRetainer; // Retainer (entered in markupPercentOrRetainer)
      const maintenanceHours = hours; // Maintenance hours (entered in weeklyHoursOrAdminHours)
      const adminInternalHourlyRate = 15; // standard assumption
      const maintenanceCost = maintenanceHours * adminInternalHourlyRate;
      const totalCostPerClient = monthlySoftwareOverhead + maintenanceCost;
      const netProfitPerClient = retainer - totalCostPerClient;
      const margin = (netProfitPerClient / retainer) * 100;
      const annualProfit = netProfitPerClient * 12;

      marginAnalysis = `### AUTOMATION OPS PRODUCT ECONOMIC PROFILE

**Unit Economics Summary:**
- **Client Monthly Retainer:** $${retainer.toFixed(2)}/mo
- **Software/API Infrastructure Overhead:** $${monthlySoftwareOverhead.toFixed(2)}/mo
- **Admin Maintenance Costs (${maintenanceHours} hrs @ $${adminInternalHourlyRate}/hr):** $${maintenanceCost.toFixed(2)}/mo
- **Total Operational Overhead per Client:** $${totalCostPerClient.toFixed(2)}/mo
- **Net Monthly Profit Spread per Client:** $${netProfitPerClient.toFixed(2)}/mo
- **Gross Retainer Margin:** ${margin.toFixed(1)}%

**Scaling Model Projections (Annual Net Profit Run-rate):**
- **1 Active Client Retainer:** $${annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
- **10 Active Client Retainers:** $${(annualProfit * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
- **25 Active Client Retainers:** $${(annualProfit * 25).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year`;
    }

    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Provide highly structured, Swiss-style corporate analysis regarding talent arbitrage and operational products. No conversational filler.`;

    const userPrompt = `Review these unit economics inputs and compile a rigorous pricing/margin optimization strategy.
OPERATIONAL METRIC FEEDBACK:
${marginAnalysis}

Please outline a 3-step action plan to maximize gross margins without compromising worker welfare or service delivery standards. Use highly professional corporate prose.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON calculation failed, using fallback report.', err);
    }

    if (!reportText) {
      reportText = `### ACTION PLAN FOR MARGIN OPTIMIZATION

1. **Implement Retainer-Based Billing with Built-In Hour Caps:**
   - Transition overseas clients from fluid hourly billings to fixed-price monthly retainers with predefined hour caps (e.g. 30 hours per week). Any overage is charged at a premium rate. This stabilizes cash flow and guarantees profit spread.

2. **Upsell High-Leverage Automation Add-ons:**
   - Bundle low-maintenance software automations with raw talent placements. Incorporating workflow scripts can justify a higher markup while actually reducing the manual hours remote workers have to spend on repetitive chores, elevating client perceived value.

3. **Recruit from High-Competency, Competitive Geographies:**
   - Focus sourcing efforts specifically on regional hubs with top-tier technical universities and reliable infrastructure, ensuring high quality control, near-zero churn, and long client retention rates.`;
    }

    return {
      success: true,
      marginAnalysis,
      strategyActionPlan: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
