import { Skill } from './types';
import { generateResponse } from '../services/nemotron';

export const xurlSkill: Skill = {
  id: 'xurl_engagement',
  name: 'X (Twitter) Engagement via xurl',
  description: 'Formulates and generates posts, searches, direct messages, and profile lookups for the X (Twitter) API using NEMOTRON.',
  category: 'outreach',
  icon: 'Share2',
  inputs: [
    {
      name: 'action',
      label: 'Engagement Action',
      type: 'select',
      required: true,
      options: ['post', 'search', 'dm', 'user_lookup'],
      defaultValue: 'post',
    },
    {
      name: 'content',
      label: 'Post/DM Content or Search Query',
      type: 'string',
      required: true,
    },
    {
      name: 'targetUser',
      label: 'Target User Handle (for DM/Lookup)',
      type: 'string',
      required: false,
    },
  ],
  execute: async (inputs, contractorId) => {
    const { action, content, targetUser } = inputs;

    const systemPrompt = `You are HAL, an expert Social Media Strategist and Automation Engineer.
Your recommendations are Swiss-style, objective, highly precise, and professional. No conversational filler or exclamation marks.`;

    const userPrompt = `Formulate a detailed, structured automation blueprint and drafted payload for an X (Twitter) API integration via the official xurl CLI.
Action: ${action}
Content/Query: ${content}
Target User: ${targetUser || 'None'}

Provide an elegant report with:
1. CLI COMMAND STRUCTURE: Show the exact \`xurl\` command and arguments that would be executed in the shell.
2. GENERATED PAYLOAD DIAGNOSTIC: Evaluate the character limit, readability, and engagement potential of the drafted content.
3. BRAND VOICE ALIGNMENT: A concise evaluation of how the draft fits professional tone guidelines.
4. COMPLIANCE & SAFETY: Check against automated spam policies.`;

    let reportText = '';
    try {
      reportText = await generateResponse(userPrompt, systemPrompt, 0.2);
    } catch (err) {
      console.error('NEMOTRON call failed during xurl strategy generation. Using fallback.', err);
      reportText = `### xurl Engagement Report\n\n**Action:** ${action}\n**Content/Query:** ${content}\n\n**Suggested CLI Command:**\n\`xurl post "${content}"\`\n\n**Status:** Payload formulated.`;
    }

    return {
      report: reportText,
      metadata: {
        action,
        targetUser,
      }
    };
  }
};
