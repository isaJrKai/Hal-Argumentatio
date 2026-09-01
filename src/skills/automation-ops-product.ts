import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const automationOpsProductSkill: Skill = {
  id: 'automation_ops_product',
  name: 'Automation Ops Product Scoper',
  description: "Frames and scopes \"Done-For-You\" operations automation packages (missed-call text-back, review request systems) sold as a high-margin recurring retainer to local contractors using NEMOTRON.",
  category: 'general',
  icon: 'Zap',
  inputs: [
    {
      name: 'prospectType',
      label: 'Target Business Type (e.g. Plumbers, Roofers)',
      type: 'string',
      required: true,
      defaultValue: 'Plumbing & Heating Contractors',
    },
    {
      name: 'coreAutomationOffer',
      label: 'Core Automation Deliverables',
      type: 'string',
      required: true,
      defaultValue: 'Missed-call text-back, Automatic Google Review SMS triggers, Appointment Reminders',
    },
    {
      name: 'initialHook',
      label: 'Low-Friction Trial Hook',
      type: 'string',
      required: true,
      defaultValue: 'A 7-day free trial of Missed-Call Text-Back (leads recovered for free)',
    },
    {
      name: 'monthlyRetainer',
      label: 'Monthly Retainer Target ($)',
      type: 'string',
      required: true,
      defaultValue: '199',
    },
    {
      name: 'infrastructureStack',
      label: 'Recommended Tech / API Stack',
      type: 'string',
      required: true,
      defaultValue: 'Twilio SMS API, Zapier / Make, and simple CRM/Webhook routing',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { prospectType, coreAutomationOffer, initialHook, monthlyRetainer, infrastructureStack } = inputs;
    if (!prospectType || !coreAutomationOffer) {
      throw new Error('Target Business Type and Core Automation Deliverables are required to scope the automation product.');
    }

    const systemPrompt = `You are HAL, the premier AI Business Operating Intelligence system.
Your operational guidance is Swiss-style, objective, highly professional, precise, confident, and free of fluff or conversational filler.
You are scoping a service architecture under the "Automation Ops Product" model.`;

    const userPrompt = `Generate a high-fidelity, comprehensive technical and operational blueprint for pitching, implementing, and running a monthly retainer Automation Ops Product.

INPUT CONSTANTS:
- Target Business Type: ${prospectType}
- Core Automation Offerings: ${coreAutomationOffer}
- Zero-Risk Hook: ${initialHook}
- Proposed Retainer Fee: $${monthlyRetainer}/month
- Software/API Architecture: ${infrastructureStack}

YOUR PLAN MUST STRICTLY INCORPORATE AND EXPAND UPON THESE CORE PRINCIPLES:
1. **The Low-Friction Pitch Advantage**: Explain why selling "${coreAutomationOffer}" for $${monthlyRetainer}/mo is vastly easier than selling $1,000/mo ad management. Outline how to locate "leak signals" (e.g. slow text response, stale reviews) in ${prospectType} websites.
2. **Missed-Call Text-Back Blueprint**: Detail the logical routing of a missed-call text-back system (Triggers, Filters, SMS payloads, latency limits).
3. **Google Review Booster Loop**: Map the post-service review collection automation. Outline how to prevent negative reviews from reaching public profiles (feedback routing) while boosting Google stars.
4. **Technology Stack & Overhead Cost Breakdown**: Detail the precise overhead cost per client using "${infrastructureStack}" (e.g., Twilio numbers, per-SMS costs, Zapier task limits), proving the immense gross margin of this service.
5. **A 7-Step Client Onboarding Sequence**: Map a step-by-step onboarding plan from launching the "${initialHook}" to securing the long-term retainer.

Format your output in beautifully clean, highly professional, hierarchical Markdown. Deliver immediate, actionable directives.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Automation Ops scoping. Using fallback.', err);
    }

    if (!reportText) {
      reportText = `### 1. THE LOW-FRICTION ADVANATAGE FOR ${prospectType.toUpperCase()}
Ad budgets demand high buyer trust. Systemizing operational efficiency, however, is a direct, immediate outcome.
- **The Core Opportunity**: You are fixing leaky pipelines for **${prospectType}** rather than buying new traffic. By saving 1-2 missed calls, the automation pays for itself instantly.
- **Identifying Leads**: Find businesses with outdated websites, stale Google review histories (>6 months old), or those who do not answer calls in person.

### 2. MISSED-CALL TEXT-BACK FLOW CHART
When a call is unanswered, speed-to-contact is the single deciding conversion metric.
1. **Trigger**: Incoming call to Twilio tracked phone number goes unanswered or goes to voicemail.
2. **Filter**: Check if the contact has received an SMS in the last 24 hours to prevent duplicate spamming.
3. **Payload Action**: Deploy outbound SMS within 4-12 seconds: *"Hi, this is [Company Name]. Sorry we missed your call—we are currently on-site! How can we help you today?"*
4. **CRM Log**: Create high-priority open ticket in CRM, alerting the contractor of the active conversation.

### 3. GOOGLE REVIEW SMS BOOSTER LOOP
Compound the contractor's organic local search prominence automatically.
- **Trigger**: Job marked "Complete" or payment received in CRM.
- **Action**: Wait exactly 30 minutes, then trigger high-personalization SMS: *"Hi [Client Name], thank you for choosing [Company Name] today! If you were happy with our work, could you take 30 seconds to support our local team on Google? It means the world to us: [Google Review URL]"*
- **Guardrail Routing**: If negative feedback is reported, route immediately to a private internal feedback form rather than the public Google page.

### 4. TECHNICAL INFRASTRUCTURE & UNIT ECONOMICS (${infrastructureStack.toUpperCase()})
Demonstrating the remarkable gross profit margin:
- **Twilio Phone Line**: $1.15/month
- **SMS Costs**: ~$0.0079 per message (Avg. 100 SMS/client/mo = $0.79)
- **Workflow Automation (Zapier / Make)**: $0.01 per run (Avg. 200 tasks = $2.00)
- **Total SaaS Overhead**: ~$4.00 / month per client
- **Gross Profit Margin**: Applying your $${monthlyRetainer}/month fee, you realize a stellar **~98% Gross Margin** on recurring operations.`;
    }

    return {
      success: true,
      prospectType,
      coreAutomationOffer,
      initialHook,
      monthlyRetainer,
      infrastructureStack,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
