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
import { verifiedLeadListsSkill } from '../../src/skills/verified-lead-lists';
import { patentLandscapeSkill } from '../../src/skills/patent-landscape';
import { pricingMarginCalculatorSkill } from '../../src/skills/pricing-margin-calculator';
import { listSubscriptionPricingSkill } from '../../src/skills/list-subscription-pricing';
import { automationOpsProductSkill } from '../../src/skills/automation-ops-product';
import { jupyterLiveKernelSkill } from '../../src/skills/jupyter-live-kernel';
import { xurlSkill } from '../../src/skills/xurl';
import { talentArbitrageBridgeSkill } from '../../src/skills/talent-arbitrage-bridge';

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

  it('does not claim Python code was executed or kernel state persisted', async () => {
    const result = await jupyterLiveKernelSkill.execute({
      code: 'print(1 + 1)',
      notebookPath: 'demo.ipynb'
    }, 'tenant-a');

    expect(result.executionPerformed).toBe(false);
    expect(result.kernelStatePersisted).toBe(false);
    expect(result.evidenceStatus).toBe('static_source_review_only');
    expect(result.report).toContain('Execution performed:** No');
    expect(result.report).not.toContain('Simulated Success');
  });

  it('does not claim X posts, searches, DMs, or profile lookups were executed', async () => {
    const post = await xurlSkill.execute({
      action: 'post',
      content: 'Hello from HAL',
      targetUser: ''
    }, 'tenant-a');
    expect(post.actionExecuted).toBe(false);
    expect(post.apiQueried).toBe(false);
    expect(post.report).toContain('Drafted only: not posted.');

    const lookup = await xurlSkill.execute({
      action: 'user_lookup',
      content: 'Check this account',
      targetUser: '@example'
    }, 'tenant-a');
    expect(lookup.apiQueried).toBe(false);
    expect(lookup.report).toContain('Profile lookup performed: No');
  });

  it('does not invent talent rejection rates, wages, or overseas buyer demand', async () => {
    const result = await talentArbitrageBridgeSkill.execute({
      serviceCategory: 'Bookkeeping',
      talentLocation: 'Uganda',
      targetOverseasMarket: 'Canada',
      pricingMarkupPercent: '50',
      riskMitigationOffer: 'A paid pilot task'
    }, 'tenant-a');

    expect(result.candidateVettingPerformed).toBe(false);
    expect(result.buyerResearchPerformed).toBe(false);
    expect(result.evidenceStatus).toBe('planning_only_no_market_data_or_candidates_verified');
    expect(result.report).not.toContain('reject 95%');
    expect(result.report).not.toContain('mathematically superior');
    expect(result.report).toContain('No wage survey');
  });

  it('does not fabricate records in the lead-list packager', async () => {
    const result = await verifiedLeadListsSkill.execute({
      niche: 'Roofing',
      geography: 'Kampala',
      verificationSources: 'Official business websites',
      enrichmentSignals: 'Phone, website',
      pricingStrategy: 'Not decided'
    }, 'tenant-a');

    expect(result.records).toEqual([]);
    expect(result.retrievedRecordsCount).toBe(0);
    expect(result.verifiedRecordsCount).toBe(0);
    expect(result.liveSourcesQueried).toBe(false);
    expect(result.report).toContain('EMPTY TEMPLATE — NOT REAL PROSPECT DATA');
  });

  it('does not issue trademark or patent clearance without registry searches', async () => {
    const result = await patentLandscapeSkill.execute({
      proposedBrand: 'Example Product',
      industrySector: 'SaaS',
      jurisdiction: 'Uganda'
    }, 'tenant-a');

    expect(result.searchPerformed).toBe(false);
    expect(result.clearanceStatus).toBe('NOT_ASSESSED');
    expect(result.trademarkMatches).toBeNull();
    expect(result.patentFindings).toBeNull();
    expect(result.report).toContain('No USPTO, WIPO, patent-office, or regulator database was queried');
  });

  it('calculates pricing spreads from explicit assumptions and labels them as scenarios', async () => {
    const result = await pricingMarginCalculatorSkill.execute({
      modelType: 'arbitrage',
      workerPay: '10',
      markupPercentOrRetainer: '50',
      weeklyHoursOrAdminHours: '20',
      adminHourlyCost: ''
    }, 'tenant-a');

    expect(result.scenarioOnly).toBe(true);
    expect(result.calculations.clientHourlyRateUsd).toBe(15);
    expect(result.calculations.weeklySpreadUsd).toBe(100);
    expect(result.report).toContain('before other costs');
    await expect(pricingMarginCalculatorSkill.execute({
      modelType: 'ops',
      workerPay: '50',
      markupPercentOrRetainer: '199',
      weeklyHoursOrAdminHours: '5',
      adminHourlyCost: ''
    }, 'tenant-a')).rejects.toThrow('admin hourly cost');
  });

  it('calculates lead-list pricing as a user-input scenario, not measured profitability', async () => {
    const result = await listSubscriptionPricingSkill.execute({
      listHours: '6',
      hourlyRate: '40',
      toolCosts: '20',
      modelType: 'subscription',
      unitPrice: '99',
      volume: '10'
    }, 'tenant-a');

    expect(result.scenarioOnly).toBe(true);
    expect(result.calculations.buildCostUsd).toBe(260);
    expect(result.calculations.revenueScenarioUsd).toBe(11880);
    expect(result.evidenceStatus).toContain('no_lead_data_retrieved');
    expect(result.report).toContain('ongoing list refresh and verification labor');
  });

  it('does not recommend review gating or claim an automation offer is already implemented', async () => {
    generateResponse.mockResolvedValue('');
    const result = await automationOpsProductSkill.execute({
      prospectType: 'Roofing contractors',
      coreAutomationOffer: 'Missed-call text-back and appointment reminders',
      initialHook: 'Paid pilot',
      monthlyRetainer: '199',
      infrastructureStack: 'Twilio and existing CRM'
    }, 'tenant-a');

    expect(result.integrationsExecuted).toBe(false);
    expect(result.evidenceStatus).toBe('proposal_only_no_integrations_executed');
    expect(result.report).toContain('Do not filter recipients by expected sentiment');
    expect(result.report).not.toContain('prevent negative reviews from reaching public profiles');
    expect(result.report).not.toContain('pays for itself instantly');
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
