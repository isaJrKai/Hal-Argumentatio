import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateResponse } = vi.hoisted(() => ({ generateResponse: vi.fn() }));
vi.mock('../../src/services/nemotron', () => ({ generateResponse }));

import { seoSkill } from '../../src/skills/seo';

describe('HAL SEO strategy evidence boundaries', () => {
  beforeEach(() => generateResponse.mockReset());

  it('does not invent search volume, rankings, or competitor measurements when the provider is unavailable', async () => {
    generateResponse.mockResolvedValue('');
    const result = await seoSkill.execute({
      businessName: 'Kampala Roofing',
      websiteUrl: 'https://roofing.example',
      niche: 'roofing',
      city: 'Kampala'
    }, 'tenant-a');

    expect(result.evidenceStatus).toBe('planning_hypotheses_only');
    expect(result.liveSearchDataQueried).toBe(false);
    expect(result.metrics).toMatchObject({
      searchVolume: null,
      keywordDifficulty: null,
      rankingPosition: null,
      competitorBacklinks: null,
      organicTraffic: null
    });
    expect(result.report).toContain('search demand and difficulty have not been measured');
    expect(result.report).not.toContain('480');
    expect(result.report).not.toContain('45 referring local domains');
  });

  it('instructs the reasoning provider not to invent external measurements', async () => {
    generateResponse.mockResolvedValue('Candidate phrases require validation.');
    const result = await seoSkill.execute({
      businessName: 'Kampala Roofing',
      websiteUrl: '',
      niche: 'roofing',
      city: 'Kampala'
    }, 'tenant-a');

    expect(generateResponse).toHaveBeenCalled();
    expect(generateResponse.mock.calls[0][0]).toContain('Do not invent search volume');
    expect(generateResponse.mock.calls[0][0]).toContain('no live search-volume or competitor-data provider was queried');
    expect(result.evidenceStatus).toBe('planning_hypotheses_only');
    expect(result.metrics.searchVolume).toBeNull();
  });
});
