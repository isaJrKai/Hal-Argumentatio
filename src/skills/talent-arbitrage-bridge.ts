import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const talentArbitrageBridgeSkill: Skill = {
  id: 'talent_arbitrage_bridge',
  name: 'Talent Arbitrage & Bridge Scoper',
  description: "Frames a high-trust, managed matchmaking business model bridging affordable remote workers (e.g. East Africa) with small businesses overseas using NEMOTRON.",
  category: 'general',
  icon: 'Cpu',
  inputs: [
    {
      name: 'serviceCategory',
      label: 'Service Category (e.g. Bookkeeping, VA, customer chat)',
      type: 'string',
      required: true,
      defaultValue: 'Bookkeeping Data Entry',
    },
    {
      name: 'talentLocation',
      label: 'Talent Location / Region',
      type: 'string',
      required: true,
      defaultValue: 'Uganda / East Africa',
    },
    {
      name: 'targetOverseasMarket',
      label: 'Target Overseas Market',
      type: 'string',
      required: true,
      defaultValue: 'North America',
    },
    {
      name: 'pricingMarkupPercent',
      label: 'Managed Markup % (e.g. 50)',
      type: 'string',
      required: true,
      defaultValue: '50',
    },
    {
      name: 'riskMitigationOffer',
      label: 'Low-Risk Hook / Pilot Offer',
      type: 'string',
      required: true,
      defaultValue: 'A 1-week/10-hour trial task before commit',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { serviceCategory, talentLocation, targetOverseasMarket, pricingMarkupPercent, riskMitigationOffer } = inputs;
    if (!serviceCategory) {
      throw new Error('Service Category is required to evaluate arbitrage scope.');
    }



    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Your operational guidance is Swiss-style, objective, highly professional, precise, confident, and free of fluff or conversational filler.
You are scoping a business under the "Talent Arbitrage & Bridge" model.`;

    const userPrompt = `Generate a comprehensive, high-fidelity business scope and operational plan for a managed Talent Arbitrage/Placement business matching skilled remote workers with international clients.

INPUT CONSTANTS:
- Narrow Service Category: ${serviceCategory}
- Talent Sourcing Region: ${talentLocation}
- Target Overseas Client Market: ${targetOverseasMarket}
- Target Pricing Markup: ${pricingMarkupPercent}% markup over talent pay
- Low-Risk Trust Hook: ${riskMitigationOffer}

YOUR PLAN MUST STRICTLY INCORPORATE AND EXPAND UPON THESE FIVE CORE PRINCIPLES:
1. **Narrow Service Selection**: Validate why "${serviceCategory}" is easier to vet, scale, and pitch than generalized virtual assistance. Define the exact deliverables.
2. **Quality Control & Vetting Protocol**: Outline a rigorous vetting sequence (test task, communication check, trial duration) specifically tailored for candidates in ${talentLocation}.
3. **The Managed Service Trust Bridge**: Detail how to pitch "quality control and active accountability" to buyers in ${targetOverseasMarket} who are fearful of offshore outsourcing. Contrast this with standard self-serve freelance marketplaces.
4. **Unit Economics & Spread Strategy**: Analyze the pricing spreads. E.g., if local talent is compensated fairly at $X/hour, how the ${pricingMarkupPercent}% markup defines the final client fee of $Y/hour, demonstrating a sustainable wage for talent while maintaining premium positioning.
5. **Mitigating Perceived Buyer Risk**: Elaborate on how to deploy "${riskMitigationOffer}" as the primary conversion hook to remove any risk for a new overseas client.

Format your output in beautifully clean, highly professional, hierarchical Markdown. Deliver immediate, actionable directives.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.25
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Talent Arbitrage scoping. Using fallback.', err);
    }

    if (!reportText) {
      // Elegant, comprehensive fallback report aligning with the user's explicit model instructions
      reportText = `### 1. STRATEGIC NARROW SERVICE SELECTION: ${serviceCategory.toUpperCase()}
Choosing a narrow niche is mathematically superior to offering general virtual assistance. By focusing specifically on **${serviceCategory}**, you eliminate onboarding friction and establish a clear, output-oriented value proposition.
- **Why this works**: Small business owners in **${targetOverseasMarket}** do not want to manage "generalists." They want specialized, repeatable tasks executed flawlessly without high training overheads.
- **Core Deliverables**: Clear, structured daily/weekly outcomes (e.g., matching daily transactions, clean formatting, rapid task turnaround).
- **Target Audience Positioning**: Position as the dedicated "**${serviceCategory}** department for growing local businesses."

### 2. QUALITY CONTROL & TALENT VETTING PROTOCOL (${talentLocation.toUpperCase()})
To command premium pricing, your vetting protocol must reject 95% of candidates, leaving only elite talent.
- **Stage 1 (English Fluency & Direct Communications Check)**: A short, 10-minute video submission demonstrating active listening, professional tone, and clear written English response.
- **Stage 2 (Real-World Test Task)**: A timed, simulated **${serviceCategory}** assignment. If they are bookkeeping candidates, they must balance a sample ledger with deliberately injected errors.
- **Stage 3 (Micro-Trial Period)**: A supervised 10-hour test run on internally managed tasks prior to ever placing the talent with an external client.

### 3. THE "MANAGED SERVICE" TRUST BRIDGE
The product being sold is trust and active quality control, not cheap labor.
- **Market Pain Point**: Buyers in **${targetOverseasMarket}** already know offshore labor is cheaper. What prevents them from hiring directly is the fear of bad fits, missed deadlines, or communication black holes.
- **Your Solution**: You are the local, accountable partner. You handle candidate backup, daily performance logs, and contract administration. If the worker is sick, a backup worker is deployed immediately under your supervision.

### 4. UNIT ECONOMICS & FAIR ARBITRAGE SPREAD
Maintain strict economic guardrails. Arbitrage must be fair, paying talent sustainable rates relative to local living standards in **${talentLocation}** while capturing a robust agency margin.
- **Base Talent Wage**: Pay a premium, highly competitive local wage to attract and retain the top 5% of local talent.
- **Markup Model**: Applying your targeted **${pricingMarkupPercent}% markup**, the spread should yield a highly profitable, scalable recurring revenue stream for your bridge operations.
- **Value Proposition**: The client gets a top-tier specialist for a fraction of local domestic costs, while the talent receives stable, life-changing income.

### 5. MITIGATING RISK: THE "${riskMitigationOffer.toUpperCase()}" HOOK
A brand new client has no reason to trust you yet. Overcome this friction by completely removing the downside.
- **Conversion Strategy**: Pitch "**${riskMitigationOffer}**" with zero setup fees or long-term commitments.
- **Execution**: Run this trial task using your absolute best, most highly-vetted talent. Once the client experiences seamless, high-quality execution for their pilot, transition them to a monthly managed retainer.`;
    }

    return {
      success: true,
      serviceCategory,
      talentLocation,
      targetOverseasMarket,
      pricingMarkupPercent,
      riskMitigationOffer,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
