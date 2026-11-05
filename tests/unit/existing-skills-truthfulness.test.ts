import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { generateResponse } = vi.hoisted(() => ({ generateResponse: vi.fn() }));
vi.mock('../../src/services/nemotron', () => ({ generateResponse }));

import { outreachSkill } from '../../src/skills/outreach';
import { competitorAnalyzerSkill } from '../../src/skills/competitor-analyzer';
import { geoSkill } from '../../src/skills/geo';
import { adSpendOptimizerSkill } from '../../src/skills/ad-spend-optimizer';
import { seoSchemaGeneratorSkill } from '../../src/skills/seo-schema-generator';
import { complianceScreenerSkill } from '../../src/skills/compliance-screener';
import { dueDiligenceUnderwritingSkill } from '../../src/skills/due-diligence-underwriting';
import { maTargetIntelSkill } from '../../src/skills/ma-target-intel';

describe('existing HAL skills evidence boundaries', () => {
  beforeEach(() => generateResponse.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it('does not invent website findings in fallback outreach', async () => {
    generateResponse.mockResolvedValue('');
    const result = await outreachSkill.execute({
      businessName: 'Kampala Roofing',
      ownerName: 'Owner',
      city: 'Kampala',
      serviceType: 'Roofing',
      weaknesses: '',
      channel: 'Email'
    }, 'tenant-a');

    expect(result.evidenceStatus).toBe('no_audit_evidence');
    expect(result.report).toContain('I have not audited your website yet');
    expect(result.report).not.toContain('4.5 seconds');
    expect(result.report).not.toContain('30%');
    expect(result.report).not.toContain('ranking well');
  });

  it('does not fabricate competitor Maps metrics in fallback research', async () => {
    generateResponse.mockResolvedValue('');
    const result = await competitorAnalyzerSkill.execute({
      city: 'Kampala',
      niche: 'Roofing',
      competitorNames: ''
    }, 'tenant-a');

    expect(result.evidenceStatus).toBe('no_live_competitor_data_queried');
    expect(result.report).toContain('No live Google Maps or search-results data was queried');
    expect(result.report).not.toContain('MEDIUM-HIGH');
    expect(result.report).not.toContain('4.4');
    expect(result.report).not.toContain('Under 15%');
  });

  it('fails closed when live weather data is unavailable instead of substituting Winnipeg weather', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    await expect(geoSkill.execute({ city: 'Kampala' }, 'tenant-a')).rejects.toThrow('No substitute location or synthetic weather values were used');
  });

  it('returns only user-supplied facts in generated LocalBusiness schema', async () => {
    const result = await seoSchemaGeneratorSkill.execute({
      businessName: 'Kampala Roofing',
      serviceType: 'Roofing',
      city: 'Kampala',
      phone: '+256772123456',
      websiteUrl: '',
      country: 'Uganda',
      streetAddress: '',
      postalCode: ''
    }, 'tenant-a');

    expect(result.schema.name).toBe('Kampala Roofing');
    expect(result.schema.address.addressLocality).toBe('Kampala');
    expect(result.schema.address.addressCountry).toBe('Uganda');
    expect(result.schema.geo).toBeUndefined();
    expect(result.schema.url).toBeUndefined();
    expect(result.schema.image).toBeUndefined();
    expect(result.report).not.toContain('35%');
  });

  it('does not issue fake sanctions clearance or a low-risk AML rating', async () => {
    const result = await complianceScreenerSkill.execute({
      subjectName: 'Example Holdings Ltd',
      country: 'Uganda'
    }, 'tenant-a');

    expect(result.screeningPerformed).toBe(false);
    expect(result.sanctionsMatches).toBeNull();
    expect(result.pepMatches).toBeNull();
    expect(result.riskRating).toBeNull();
    expect(result.report).toContain('Sanctions result:** Unknown');
    expect(result.report).not.toContain('NO MATCH');
    expect(result.report).not.toContain('LOW RISK');
  });

  it('does not invent corporate registry, liquidity, litigation, or sanctions findings', async () => {
    const result = await dueDiligenceUnderwritingSkill.execute({
      entityName: 'Example Holdings Ltd',
      jurisdiction: 'Uganda'
    }, 'tenant-a');

    expect(result.dueDiligencePerformed).toBe(false);
    expect(result.underwritingDecision).toBe('REVIEW_REQUIRED');
    expect(result.verifiedRegistryStatus).toBeNull();
    expect(result.verifiedFinancials).toBeNull();
    expect(result.report).toContain('External checks performed:** None');
    expect(result.report).not.toContain('1.45x');
    expect(result.report).not.toContain('APPROVE WITH CONDITIONS');
  });

  it('calculates M&A valuation only from explicit user assumptions', async () => {
    const result = await maTargetIntelSkill.execute({
      targetCompany: 'Example Holdings Ltd',
      estimatedRevenue: 1000000,
      industry: 'Home Services',
      ebitdaMarginPercent: 12,
      lowMultiple: 3,
      highMultiple: 5
    }, 'tenant-a');

    expect(result.scenarioOnly).toBe(true);
    expect(result.calculated.ebitdaUsd).toBe(120000);
    expect(result.calculated.enterpriseValueLowUsd).toBe(360000);
    expect(result.calculated.enterpriseValueHighUsd).toBe(600000);
    expect(result.report).toContain('These are arithmetic scenarios');
    expect(result.report).not.toContain('65,000 annually');
    expect(result.report).not.toContain('4,000 active contacts');
  });

  it('labels ad spend calculations as user-supplied scenarios, not measured performance', async () => {
    generateResponse.mockResolvedValue('');
    const result = await adSpendOptimizerSkill.execute({
      monthlyBudget: 1000,
      costPerLead: 50,
      conversionRate: 10,
      averageContractValue: 500
    }, 'tenant-a');

    expect(result.evidenceStatus).toBe('user_supplied_scenario_assumptions');
    expect(result.scenarioOnly).toBe(true);
    expect(result.report).toContain('HYPOTHETICAL SENSITIVITY SCENARIO');
    expect(result.report).not.toContain('losing up to 85%');
  });
});
