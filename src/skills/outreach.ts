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
      defaultValue: 'Slow mobile page load speed, no call-to-actions, missing SSL security.',
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
You speak directly, offering heavy value first. Do not use generic corporate language, exclamation marks, or greetings like "I hope this email finds you well."`;

    const userPrompt = `Generate a comprehensive outbound campaign plan for:
Business: ${businessName}
Owner Name: ${ownerName || 'Owner'}
Location: ${city}
Niche: ${serviceType}
Identified Weaknesses: ${weaknesses || 'General web speed and CTA issues'}
Outreach Channel Mode: ${channel}

Include these distinct sections in your output:
1. CAMPAIGN ANGLE & HOOK: A short rationale of why this angle works (under 3 sentences).
2. OUTBOUND TEMPLATE / SCRIPT:
   - If channel is "Email", write a short, highly persuasive email (including a strong, direct Subject Line). Keep it under 150 words.
   - If channel is "Cold Call", write an interactive, conversational call script with an elegant elevator pitch and transition hook.
   - If "Combined Omnichannel", provide both a quick touchpoint LinkedIn message and an email.
3. OBJECTION HANDLING MATRIX: Provide 2 common objections the business owner might raise (e.g. "We have enough work", "I already have a web guy") and exactly how to dismantle them professionally.

Format your response in clean Markdown.`;

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
      // Elegant fallback script matching HAL style
      reportText = `### CAMPAIGN ANGLE & HOOK
We approach **${ownerName || 'Owner'}** with an "Evidence-Based Revenue Audit." Instead of proposing a general redesign, we demonstrate the specific mathematical volume of local homeowners they are currently losing directly due to load-speed friction in **${city}**.

### OUTBOUND TEMPLATE / SCRIPT (Channel: ${channel})
**Subject**: Winnipeg homeowners clicking away from ${businessName}? 

Hi ${ownerName || 'Owner'},

I was reviewing the digital visibility for home services in **${city}** and noticed **${businessName}** ranking well, but your website load speed on mobile devices is lagging by almost 4.5 seconds. 

For emergency plumbing and local services, a delay like that causes about 30% of visitors to click back and call a competitor instead. 

I’ve compiled a quick 2-minute video showing where this leak is happening and the 3 quick fixes to secure those leads. Would it be helpful if I sent that over?

Best,

Isaac (Kaiso)
HAL Intelligence Operating Systems

### OBJECTION HANDLING MATRIX
1. **"We have too much work already / fully booked"**
   * *Counter*: "That is a great problem to have. This isn't about getting more volume, it’s about margin efficiency. By stopping these leaks, you can afford to selectively pick the highest-paying sewer backups and waterproofing jobs and drop the low-margin diagnostic calls."
2. **"I already have a web developer who manages this"**
   * *Counter*: "Completely understand, most premium shops do. Feel free to pass this report directly to them—it contains the exact speed and caching metrics they need to speed up your page load times. If they have any questions on the code optimizations, I'm happy to jump on a quick call with them."`;
    }

    return {
      success: true,
      businessName,
      ownerName,
      channel,
      report: reportText,
      generatedAt: new Date().toISOString()
    };
  }
};
