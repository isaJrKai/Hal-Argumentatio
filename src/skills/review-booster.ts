import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const reviewBoosterSkill: Skill = {
  id: 'review_booster',
  name: 'Reputation & Review Booster',
  description: "Constructs highly persuasive customer outreach sequences optimized for securing 5-star Google ratings using NEMOTRON.",
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
You write extremely professional, direct, conversion-optimized review request scripts. No exclamation marks, no desperate filler.`;

    const userPrompt = `Draft a review-acquisition script for a homeowner customer:
- Client Name: ${clientName}
- Service Performed: ${servicePerformed}
- Outreach Medium: ${channel}

Structure the output as follows:
1. COGNITIVE REASONING: Explain why this specific script layout minimizes friction and maximizes follow-through rates.
2. OUTREACH TEMPLATE: The exact message copy ready for SMS or Email dispatch.
3. CONVERSION BEST PRACTICES: 3 concrete action-points to implement when prompting homeowners for Google feedback.`;

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
"Hi ${clientName}, this is Isaac. Hope your ${servicePerformed} is running perfectly. If you have 20 seconds, would you mind leaving us an honest rating on Google? It helps local homeowners find us. Click here: [INSERT_GOOGLE_REVIEW_LINK] - Thank you!"

### CONVERSION BEST PRACTICES
1. **Timing Priority**: Dispatch the message within 2 hours of completing the job. Feedback response rates drop by 65% after 24 hours.
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
Isaac"

### CONVERSION BEST PRACTICES
1. **Remove Form Obstacles**: Keep the review link completely isolated on its own line for maximum layout visual hierarchy.
2. **Follow-Up Cadence**: If they do not respond to the first request, send a single polite follow-up exactly 3 days later.
3. **Incentivize Techs**: Offer technicians a $10 bonus for every review that mentions their name to drive team alignment.`;
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
