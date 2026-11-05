import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const reviewBoosterSkill: Skill = {
  id: 'review_booster',
  name: 'Reputation & Review Booster',
  description: "Drafts neutral, honest review requests for all eligible customers. Does not incentivize reviews, filter negative feedback, or promise a rating outcome.",
  category: 'outreach',
  icon: 'Mail',
  inputs: [
    {
      name: 'clientName',
      label: 'Client Name',
      type: 'string',
      required: true,
      defaultValue: '',
    },
    {
      name: 'servicePerformed',
      label: 'Service Performed',
      type: 'string',
      required: true,
      defaultValue: 'A/C Repair',
    },
    {
      name: 'channel',
      label: 'Outreach Channel',
      type: 'select',
      required: true,
      options: ['SMS (Short Message)', 'Email (Detailed)'],
      defaultValue: 'SMS (Short Message)',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { clientName, servicePerformed, channel } = inputs;
    if (!clientName || !servicePerformed) {
      throw new Error('Client Name and Service Performed are required inputs.');
    }



    const systemPrompt = `You are HAL, the expert Customer Relations and Reputation Strategist. 
You write professional, neutral review requests. Ask for an honest review, never ask specifically for a positive or 5-star rating, never offer incentives, and never filter customers based on expected sentiment. Do not invent response-rate statistics.`;

    const userPrompt = `Draft a neutral request for an honest review from a customer:
- Client Name: ${clientName}
- Service Performed: ${servicePerformed}
- Outreach Medium: ${channel}

Structure the output as follows:
1. REQUEST APPROACH: Explain how the wording is neutral and does not pressure the customer.
2. OUTREACH TEMPLATE: The exact message copy ready for SMS or Email dispatch.
3. COMPLIANCE PRACTICES: 3 concrete actions that preserve unbiased review collection and comply with platform rules.`;

    let reportText = '';

    try {
      reportText = await generateResponse(
        userPrompt,
        systemPrompt,
        0.2
      );
    } catch (err) {
      console.error('NEMOTRON call failed during Review Booster. Using fallback.', err);
    }

    if (!reportText) {
      if (channel.includes('SMS')) {
        reportText = `### COGNITIVE REASONING
- **Brevity Rule**: Homeowners ignore paragraphs over SMS. This template is under 160 characters.
- **Gratitude Framing**: Reminds them of the exact value delivered (${servicePerformed}) and uses personal accountability rather than automated system wording.

### OUTREACH TEMPLATE (SMS Medium)
"Hi ${clientName}, this is our service team. Hope your ${servicePerformed} is running perfectly. If you have 20 seconds, would you mind leaving us an honest rating on Google? It helps local homeowners find us. Click here: [INSERT_GOOGLE_REVIEW_LINK] - Thank you!"

### CONVERSION BEST PRACTICES
1. **Timing Priority**: Dispatch the message within 2 hours of completing the job. Send the request after the service is complete, at a time consistent with the customer's communication preferences.
2. **Personal Ask**: The technician should mention the request verbally prior to leaving the property.
3. **One-Click Link**: Always supply a direct link to the Google Business profile review modal, not just the website.`;
      } else {
        reportText = `### COGNITIVE REASONING
- **Personal Touch**: Avoids marketing templates. Appears as a direct letter from the business owner/technician.
- **Implicit Reciprocity**: Focuses on professional standards and verifies their satisfaction before offering the feedback link.

### OUTREACH TEMPLATE (Email Medium)
**Subject**: Follow-up regarding your ${servicePerformed}

"Dear ${clientName},

Thank you for trusting us to handle your ${servicePerformed} yesterday. Our goal is always to deliver clean, professional, and reliable work.

If you are satisfied with our service, would you be open to writing a brief 1-2 sentence review of your experience? Your feedback helps our family-owned business grow and assists other families in our community in finding reliable technicians.

You can leave your feedback in just one click here:
[INSERT_GOOGLE_REVIEW_LINK]

Thank you for your business and partnership.

Best regards,
Our Service Team"

### CONVERSION BEST PRACTICES
1. **Remove Form Obstacles**: Keep the review link completely isolated on its own line for maximum layout visual hierarchy.
2. **Follow-Up Cadence**: If they do not respond to the first request, send a single polite follow-up exactly 3 days later.
3. **No incentives or gating**: Do not offer rewards for reviews, ask only satisfied customers, or suppress negative feedback.`;
      }
    }

    return {
      success: true,
      clientName,
      servicePerformed,
      channel,
      report: reportText,
      executedAt: new Date().toISOString()
    };
  }
};
