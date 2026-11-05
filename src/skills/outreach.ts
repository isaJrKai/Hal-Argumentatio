import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const outreachSkill: Skill = {
  id: 'outreach',
  name: 'Outbound Strategy & Copywriter',
  description: "Generates hyper-personalized outbound outreach strategies, email templates, cold scripts, and objection handling matrices tailored to a lead’s weaknesses using NEMOTRON.",
  category: 'outreach',
  icon: 'Mail',
  inputs: [
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'ownerName',
      label: 'Owner Name',
      type: 'string',
      required: false,
      defaultValue: 'Owner',
    },
    {
      name: 'city',
      label: 'City',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'serviceType',
      label: 'Service Type / Niche',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'weaknesses',
      label: 'Digital Weaknesses',
      type: 'string',
      required: false,
      defaultValue: '',
    },
    {
      name: 'channel',
      label: 'Outreach Channel',
      type: 'select',
      required: true,
      options: ['Email', 'Cold Call', 'Combined Omnichannel'],
      defaultValue: 'Email',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { businessName, ownerName, city, serviceType, weaknesses, channel } = inputs;
    if (!businessName || !city || !serviceType) {
      throw new Error('Business Name, City, and Service Type are required.');
    }



    const systemPrompt = `You are HAL, the core Outreach & Communication Agent of HALBiz.
Your objective is to craft hyper-personalized, non-spammy, highly professional cold-outreach templates and scripts. 
You speak directly, offering heavy value first. Avoid generic corporate language. Never invent audit findings, rankings, website speed, lost leads, conversion rates, or revenue. Only state weaknesses explicitly supplied by the user and label them unverified. If no evidence is supplied, write an honest introduction and ask permission to review the website.`;

    const userPrompt = `Generate a comprehensive outbound campaign plan for:
Business: ${businessName}
Owner Name: ${ownerName || 'Owner'}
Location: ${city}
Niche: ${serviceType}
User-supplied observations (not independently verified): ${weaknesses || 'None supplied'}
Outreach Channel Mode: ${channel}

Include these distinct sections in your output:
1. CAMPAIGN ANGLE & HOOK: A short rationale of why this angle works (under 3 sentences).
2. OUTBOUND TEMPLATE / SCRIPT:
   - If channel is "Email", write a short, highly persuasive email (including a strong, direct Subject Line). Keep it under 150 words.
   - If channel is "Cold Call", write an interactive, conversational call script with an elegant elevator pitch and transition hook.
   - If "Combined Omnichannel", provide both a quick touchpoint LinkedIn message and an email.
3. OBJECTION HANDLING MATRIX: Provide 2 common objections the business owner might raise (e.g. "We have enough work", "I already have a web guy") and exactly how to dismantle them professionally.

Evidence rules: If no observations are supplied, do not imply you inspected the website or found a defect. Do not invent performance measurements, rankings, percentages, missed jobs, competitor behavior, or revenue loss. If observations are supplied, qualify them as items to verify. Format your response in clean Markdown.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.3
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Outreach generation. Falling back to native script generator.', err);
    }

    if (!reportText) {
      const evidenceNote = weaknesses?.trim()
        ? 'I have a few observations from the information provided: ' + weaknesses.trim() + '. I have not independently verified them.'
        : 'I have not audited your website yet, so I do not want to guess at issues or make claims about its performance.';
      const email = 'Subject: A quick website review for ' + businessName + '\n\nHi ' + (ownerName || 'there') + ',\n\nI work with ' + serviceType.toLowerCase() + ' businesses in ' + city + ' on improving their online presence and enquiry process.\n\n' + evidenceNote + '\n\nWould you be open to me reviewing the public website and sending you a short, evidence-based list of opportunities? No obligation.\n\nBest,\nHALBiz';
      reportText = [
        '### CAMPAIGN ANGLE & HOOK',
        weaknesses?.trim() ? 'Use supplied observations as discussion points, but verify each before presenting it as fact.' : 'Ask permission to conduct a short review; do not imply an audit has already happened.',
        '',
        '### OUTBOUND TEMPLATE / SCRIPT (Channel: ' + channel + ')',
        email,
        '',
        '### OBJECTION HANDLING MATRIX',
        '1. We already have a provider — I can share the findings with your existing provider if a second perspective would be useful.',
        '2. We are not looking for help — Understood. I can send a short checklist with no follow-up unless you ask for it.',
        '',
        '**Evidence boundary:** No website measurements, rankings, lead-loss estimates, or revenue claims were available for this draft.'
      ].join('\n');
    }

    return {
      success: true,
      businessName,
      ownerName,
      channel,
      evidenceStatus: weaknesses?.trim() ? 'user_supplied_unverified_observations' : 'no_audit_evidence',
      report: reportText,
      generatedAt: new Date().toISOString()
    };
  }
};
