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
      defaultValue: '',
    },
    {
      name: 'coreAutomationOffer',
      label: 'Core Automation Deliverables',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'initialHook',
      label: 'Low-Friction Trial Hook',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'monthlyRetainer',
      label: 'Monthly Retainer Target ($)',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'infrastructureStack',
      label: 'Recommended Tech / API Stack',
      type: 'string',
      required: true,
      defaultValue: '',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { prospectType, coreAutomationOffer, initialHook, monthlyRetainer, infrastructureStack } = inputs;
    if (!prospectType || !coreAutomationOffer || !monthlyRetainer) {
      throw new Error('Target Business Type and Core Automation Deliverables are required to scope the automation product.');
    }

    const systemPrompt = 'You are HAL, an operations automation planner. Be precise about what is proposed versus implemented. Never invent provider prices, recovered leads, revenue, response rates, or guaranteed ROI. Never recommend review gating, review suppression, or incentives.';
    const userPrompt = [
      'Create an implementation plan for a proposed automation service.',
      'Target business type: ' + prospectType,
      'Proposed deliverables: ' + coreAutomationOffer,
      'Pilot concept supplied by user: ' + (initialHook || 'None'),
      'Target monthly retainer supplied by user: ' + monthlyRetainer,
      'Proposed technology stack: ' + (infrastructureStack || 'Not supplied'),
      '',
      'Requirements:',
      '1. Describe call/enquiry workflow discovery, triggers, retries, quiet hours, opt-outs, consent, and human escalation.',
      '2. Explain sandbox testing before any real customer messaging.',
      '3. Propose a neutral review-request flow for all eligible customers. Never filter recipients by expected sentiment, suppress negative reviews, offer incentives, or ask only for positive ratings.',
      '4. List provider cost categories to verify against current provider pricing. Do not invent per-SMS prices, automation limits, or margins.',
      '5. State clearly that this is a proposal; do not imply integrations were configured or outcomes measured.',
      'Return concise Markdown.'
    ].join('\\n');

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
      reportText = [
        '### PROPOSED OFFER',
        '- Business type: ' + prospectType,
        '- Deliverables proposed: ' + coreAutomationOffer,
        '- Pilot concept supplied by user: ' + (initialHook || 'None supplied'),
        '- Target retainer supplied by user: ' + monthlyRetainer,
        '- Proposed stack: ' + (infrastructureStack || 'Not supplied'),
        '',
        '### IMPLEMENTATION PLAN',
        '1. Map the existing call, enquiry, booking, and customer-consent workflow with the business owner.',
        '2. Define trigger rules, quiet hours, opt-out handling, message templates, retry limits, and human escalation.',
        '3. Test in a sandbox with synthetic contacts before enabling real customer messaging.',
        '4. Record delivery, replies, opt-outs, bookings, and attributable outcomes; do not claim recovered revenue without records.',
        '',
        '### REVIEW REQUEST COMPLIANCE',
        '- Ask all eligible customers for honest feedback after service completion.',
        '- Do not filter recipients by expected sentiment, suppress negative reviews, offer incentives, or request only positive ratings.',
        '',
        '### COSTS TO VERIFY BEFORE PRICING',
        '- SMS/voice provider fees, sender registration, number rental, automation task limits, CRM integration, support time, taxes, and compliance requirements.',
        '- No provider rates or margin have been measured by this skill.',
        '',
        '**Evidence boundary:** This is a proposed design. No integrations were provisioned, no messages were sent, and no lead-recovery or revenue results were measured.'
      ].join('\n');
    }

    return {
      success: true,
      prospectType,
      coreAutomationOffer,
      initialHook,
      monthlyRetainer,
      infrastructureStack,
      evidenceStatus: 'proposal_only_no_integrations_executed',
      integrationsExecuted: false,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
