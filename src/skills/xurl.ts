import { Skill } from './types';

export const xurlSkill: Skill = {
  id: 'xurl_engagement',
  name: 'X Engagement Draft & Command Planner',
  description: 'Drafts X posts, search queries, and direct messages. It does not connect to X, execute xurl, retrieve profiles, search posts, or send messages.',
  category: 'outreach',
  icon: 'Share2',
  inputs: [
    { name: 'action', label: 'Engagement Action', type: 'select', required: true, options: ['post', 'search', 'dm', 'user_lookup'], defaultValue: 'post' },
    { name: 'content', label: 'Post/DM Content or Search Query', type: 'string', required: true, defaultValue: '' },
    { name: 'targetUser', label: 'Target User Handle (for DM/Lookup)', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const action = String(inputs.action || 'post');
    const content = String(inputs.content || '').trim();
    const targetUser = String(inputs.targetUser || '').trim();
    if (!['post', 'search', 'dm', 'user_lookup'].includes(action)) throw new Error('Choose a supported X engagement action.');
    if (!content) throw new Error('Post content or search query is required.');
    if ((action === 'dm' || action === 'user_lookup') && !targetUser) {
      throw new Error('A target X handle is required for direct-message drafts and profile lookup requests.');
    }

    let report: string;
    if (action === 'post') {
      report = [
        '### X POST DRAFT',
        content,
        '',
        '- Character count: ' + content.length,
        '- Drafted only: not posted.',
        '- Review links, claims, mentions, hashtags, and brand authorization before posting manually.',
        '- No xurl CLI command was executed and no X API request was made.'
      ].join('\n');
    } else if (action === 'search') {
      report = [
        '### X SEARCH REQUEST',
        '- Query: ' + content,
        '- Search performed: No — no X API or xurl connection is configured in this skill.',
        '- Use this query in an authorized X search interface and retain result URLs and retrieval dates before citing findings.'
      ].join('\n');
    } else if (action === 'dm') {
      report = [
        '### X DIRECT MESSAGE DRAFT',
        '- Recipient handle supplied: ' + targetUser,
        '',
        content,
        '',
        '- Message sent: No.',
        '- Confirm recipient identity, relationship, platform rules, and consent before manually sending.'
      ].join('\n');
    } else {
      report = [
        '### X PROFILE LOOKUP REQUEST',
        '- Handle supplied: ' + targetUser,
        '- Profile lookup performed: No — no X API or xurl connection is configured in this skill.',
        '- Verify the handle and profile through an authorized public interface before relying on account details.'
      ].join('\n');
    }

    return {
      success: true,
      action,
      targetUser: targetUser || null,
      actionExecuted: false,
      apiQueried: false,
      evidenceStatus: 'draft_only_no_x_api_connection',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
