import { Skill } from './types';
import { harvestRealBusinesses } from '../lib/gemini';

export const researchSkill: Skill = {
  id: 'research_harvest',
  name: 'Local Intelligence Harvester',
  description: 'Uses the shared Territory Harvester to discover candidate businesses. Google Search grounding sources are retained when available; phone and DNS checks do not by themselves confirm business identity, and unmeasured digital metrics remain unavailable.',
  category: 'research',
  icon: 'Search',
  inputs: [
    {
      name: 'city',
      label: 'City Name',
      type: 'string',
      required: true,
      defaultValue: 'Winnipeg',
    },
    {
      name: 'niche',
      label: 'Business Niche / Service',
      type: 'string',
      required: true,
      defaultValue: 'plumbing',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { city, niche } = inputs;
    if (!city || !niche) {
      throw new Error('City Name and Business Niche are required parameters');
    }

    // Direct invocation of the core Gemini harvester defined in src/lib/gemini.ts
    const harvested = await harvestRealBusinesses(city, niche);

    return {
      success: true,
      city,
      niche,
      count: harvested.length,
      results: harvested,
      harvestedAt: new Date().toISOString()
    };
  }
};
