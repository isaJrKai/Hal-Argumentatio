import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
const revenueView = readFileSync(new URL('../../src/components/RevenueIntelligenceView.tsx', import.meta.url), 'utf8');
const deliveryHub = readFileSync(new URL('../../src/components/DeliveryHub.tsx', import.meta.url), 'utf8');
const start = server.indexOf("app.post('/api/revenue/outcomes/measure'");
const end = server.indexOf("\n  });", start);
const handler = server.slice(start, end);

describe('revenue outcome measurement integrity', () => {
  it('does not seed synthetic baseline, expected, or actual business metrics', () => {
    expect(handler).not.toMatch(/revenue:\s*5000|revenue:\s*5200|roas:\s*2\.5|roas:\s*3\.0|cpl:\s*45|cac:\s*350/);
    expect(handler).toContain('const baselineMetrics = {};');
    expect(handler).toContain('const expectedMetrics = {};');
    expect(handler).toContain('const actualMetrics = {};');
  });

  it('does not attribute all tenant revenue to an unrelated recommendation', () => {
    expect(handler).not.toContain('from(revenueRecords)');
    expect(handler).toContain("'insufficient_data'");
    expect(handler).toContain('No verified recommendation-to-outcome attribution record exists');
  });

  it('does not manufacture an execution reference or default confidence', () => {
    expect(handler).not.toContain('Exec-Ref-Auto');
    expect(handler).toContain('rec.executionReference || null');
    expect(handler).toContain('rec.confidenceScore ?? 0');
  });
});

const evaluateStart = server.indexOf("app.post('/api/revenue/outcomes/:id/evaluate'");
const evaluateEnd = server.indexOf("\n  });", evaluateStart);
const evaluateHandler = server.slice(evaluateStart, evaluateEnd);

describe('revenue outcome evaluation integrity', () => {
  it('requires a measured outcome before evaluation', () => {
    expect(evaluateHandler).toContain("outcome.outcomeStatus !== 'measured'");
    expect(evaluateHandler).toContain("return res.status(409)");
  });

  it('requires comparable finite numeric evidence and has no synthetic defaults', () => {
    expect(evaluateHandler).toContain('Number.isFinite(expected[key])');
    expect(evaluateHandler).toContain('Number.isFinite(actual[key])');
    expect(evaluateHandler).not.toMatch(/revenue:\s*5000|roas:\s*3\.0|expected\.revenue \|\| 5000/);
    expect(evaluateHandler).toContain('comparable verified numeric metrics');
  });
});

const transitionStart = server.indexOf("app.post('/api/revenue/recommendations/:id/transition'");
const transitionEnd = server.indexOf("// ─── SERVER STARTUP", transitionStart);
const transitionHandler = server.slice(transitionStart, transitionEnd);

describe('recommendation transition integrity', () => {
  it('does not generate synthetic execution references', () => {
    expect(transitionHandler).not.toContain('Math.random()');
    expect(transitionHandler).not.toContain('Manual Ref #');
    expect(transitionHandler).toContain('executionReference.trim()');
    expect(transitionHandler).toContain('updateValues.executionReference =');
  });

  it('commits the recommendation state and lifecycle event atomically', () => {
    expect(transitionHandler).toContain('pgDb.transaction(async tx =>');
    expect(transitionHandler).toContain('eq(revenueRecommendations.status, currentStatus)');
    expect(transitionHandler).toContain('tx.insert(revenueRecommendationEvents)');
  });
});

const projectStart = server.indexOf("app.post('/api/projects',");
const projectEnd = server.indexOf("app.put('/api/projects/:id'", projectStart);
const projectHandler = server.slice(projectStart, projectEnd);

describe('client project financial integrity', () => {
  it('requires explicit commercial terms and does not seed fake project metrics', () => {
    expect(projectHandler).toContain("typeof city !== 'string'");
    expect(projectHandler).toContain("typeof serviceType !== 'string'");
    expect(projectHandler).toContain("!['Growth', 'Dominance', 'Enterprise'].includes(packageTier)");
    expect(projectHandler).toContain('!Number.isSafeInteger(monthlyRetainerUsd)');
    expect(projectHandler).not.toContain(': 2400');
    expect(projectHandler).not.toContain("'Calgary'");
    expect(projectHandler).not.toContain("targetScore: 95");
    expect(projectHandler).toContain('targetScore: null');
  });

  it('only links a project to a tenant-owned won lead and blocks duplicate conversion', () => {
    expect(projectHandler).toContain('eq(leads.contractorId, contractorId)');
    expect(projectHandler).toContain("includes(String(linkedLead.status).toLowerCase())");
    expect(projectHandler).toContain('A client project can only be converted from a lead recorded as closed-won.');
    expect(projectHandler).toContain('A client project already exists for this won lead.');
    expect(projectHandler).toContain('pg_advisory_xact_lock');
    expect(projectHandler).toContain('tx.insert(workEvents)');
    expect(projectHandler).toContain('pgDb.transaction(async tx =>');
    expect(projectHandler).toContain('PROJECT_LEAD_IDENTITY_MISMATCH');
    expect(projectHandler).toContain('businessName.trim() !== linkedLead.businessName');
  });
});

const projectUpdateStart = server.indexOf("app.put('/api/projects/:id'");
const projectUpdateEnd = server.indexOf("app.get('/api/financials/overview'", projectUpdateStart);
const projectUpdateHandler = server.slice(projectUpdateStart, projectUpdateEnd);

describe('client project retainer lifecycle', () => {
  it('allows only explicit whole-dollar retainer updates and terminal cancellation states', () => {
    expect(projectUpdateHandler).toContain("'cancelled', 'canceled', 'churned', 'archived'");
    expect(projectUpdateHandler).toContain('Number.isSafeInteger(updates.monthlyRetainerUsd)');
    expect(projectUpdateHandler).toContain('safeUpdates.monthlyRetainerUsd = updates.monthlyRetainerUsd');
    expect(projectUpdateHandler).toContain('previousMonthlyRetainerUsd');
    expect(projectUpdateHandler).toContain('currentMonthlyRetainerUsd');
    expect(projectUpdateHandler).toContain('pgDb.transaction(async tx =>');
    expect(projectUpdateHandler).toContain('tx.insert(workEvents)');
  });

  it('does not prefill a new client project with an assumed retainer', () => {
    expect(deliveryHub).toContain('useState(0)');
    expect(deliveryHub).not.toContain('useState(2400)');
    expect(deliveryHub).toContain('Link a closed-won lead (Optional)');
  });
});

const recommendationsStart = server.indexOf("app.get('/api/revenue/recommendations'");
const recommendationsEnd = server.indexOf("app.get('/api/revenue/recommendations/:id/events'", recommendationsStart);
const recommendationsHandler = server.slice(recommendationsStart, recommendationsEnd);

describe('recommendation empty-state integrity', () => {
  it('returns an empty tenant list instead of seeding example campaign results', () => {
    expect(recommendationsHandler).toContain('res.json(recs)');
    expect(recommendationsHandler).not.toContain('3.4x higher');
    expect(recommendationsHandler).not.toContain('Campaign B');
    expect(recommendationsHandler).not.toContain('38700');
    expect(recommendationsHandler).not.toContain('24,500');
  });
});

const simulationStart = server.indexOf("app.post('/api/revenue/simulations'");
const simulationEnd = server.indexOf("app.get('/api/revenue/recommendations'", simulationStart);
const simulationHandler = server.slice(simulationStart, simulationEnd);

describe('revenue simulation evidence integrity', () => {
  it('rejects unsupported or unparameterized scenarios instead of inventing defaults', () => {
    expect(simulationHandler).toContain('SCENARIO_NOT_SUPPORTED_WITH_VERIFIED_DATA');
    expect(simulationHandler).toContain('Select two different campaigns');
    expect(simulationHandler).not.toContain('params.shiftAmount || 500');
    expect(simulationHandler).not.toContain('percentChange || 10');
    expect(simulationHandler).not.toContain('Primary Territory');
  });

  it('uses only unambiguous lead-to-campaign revenue attribution', () => {
    expect(simulationHandler).toContain('if (names.size !== 1) continue');
    expect(simulationHandler).toContain('if (!campaign) continue');
    expect(simulationHandler).not.toContain("Object.keys(campaignMap)[0]");
    expect(simulationHandler).not.toContain('toRoas = 2.5');
    expect(simulationHandler).not.toContain('fromRoas = 1.0');
    expect(simulationHandler).toContain('const measuredCampaigns = Object.values(campaignMap).filter');
    expect(simulationHandler).toContain('const totalSpend = measuredCampaigns.reduce');
  });

  it('does not fabricate confidence or percentage uplift when evidence is absent', () => {
    expect(simulationHandler).toContain('confidenceScore: 0');
    expect(simulationHandler).toContain('totalRevenue > 0 ? Number');
    expect(simulationHandler).not.toContain('totalRevenue * 1.15');
    expect(simulationHandler).not.toContain(': 15.0');
  });
});

const proposalStart = server.indexOf("app.post('/api/proposals/generate'");
const proposalEnd = server.indexOf("// ─── PHASE 4: CLIENT PROJECTS", proposalStart);
const proposalHandler = server.slice(proposalStart, proposalEnd);

describe('proposal integrity', () => {
  it('requires a tenant-owned lead and explicit commercial terms', () => {
    expect(proposalHandler).toContain("eq(leads.contractorId, contractorId)");
    expect(proposalHandler).toContain('Number.isSafeInteger(retainer)');
    expect(proposalHandler).toContain('Number.isSafeInteger(setup)');
    expect(proposalHandler).not.toContain("|| (tier === 'Dominance'");
  });

  it('does not invent ROI or audit scores and labels the generated draft as non-persistent', () => {
    expect(proposalHandler).toContain('roiEstimateAnnualUsd: null');
    expect(proposalHandler).toContain('persistenceStatus:');
    expect(proposalHandler).not.toContain('retainer * 12 * 4.5');
    expect(proposalHandler).not.toContain('mobileSpeedScore || 52');
    expect(proposalHandler).not.toContain('seoHealthScore || 64');
    expect(proposalHandler).not.toContain("'Secured'");
  });
});

const decisionEngineStart = server.indexOf("app.post('/api/revenue/decision-engine/run'");
const decisionEngineEnd = server.indexOf("app.get('/api/revenue/simulations'", decisionEngineStart);
const decisionEngineHandler = server.slice(decisionEngineStart, decisionEngineEnd);

describe('decision-engine attribution integrity', () => {
  it('excludes ambiguous or unattributed revenue from campaign comparisons', () => {
    expect(decisionEngineHandler).toContain('if (names.size !== 1) continue');
    expect(decisionEngineHandler).toContain('data.spend > 0 && data.revenue > 0 && data.closedWon.size > 0');
    expect(decisionEngineHandler).not.toContain("'Unknown Campaign'");
    expect(decisionEngineHandler).not.toContain("attr?.landingPage ? 'Targeted Geo'");
    expect(decisionEngineHandler).toContain('geoRecommendationsSupported: false');
  });

  it('does not invent recommendation confidence, impact scores, or revenue uplift', () => {
    expect(decisionEngineHandler).toContain('impactScore: 0');
    expect(decisionEngineHandler).toContain('confidenceScore: null');
    expect(decisionEngineHandler).not.toContain('70 + (topCamp.closedWon * 2)');
    expect(decisionEngineHandler).not.toContain('topCamp.spend * 0.2');
    expect(decisionEngineHandler).toContain('no revenue uplift forecast');
  });

  it('commits each recommendation and its lifecycle event in one transaction', () => {
    expect(decisionEngineHandler).toContain('await pgDb.transaction(async tx =>');
    expect(decisionEngineHandler).toContain('tx.insert(revenueRecommendationEvents)');
  });
});

const experimentStart = server.indexOf("app.post('/api/revenue/experiments',");
const experimentEnd = server.indexOf("app.post('/api/revenue/experiments/:id/status'", experimentStart);
const experimentHandler = server.slice(experimentStart, experimentEnd);
const experimentStatusStart = server.indexOf("app.post('/api/revenue/experiments/:id/status'");
const experimentStatusEnd = server.indexOf("app.post('/api/revenue/decision-engine/run'", experimentStatusStart);
const experimentStatusHandler = server.slice(experimentStatusStart, experimentStatusEnd);

describe('revenue experiment integrity', () => {
  it('requires an explicit baseline and expected outcome', () => {
    expect(experimentHandler).toContain("typeof baseline !== 'string'");
    expect(experimentHandler).toContain("typeof expectedOutcome !== 'string'");
    expect(experimentHandler).not.toContain("'Current baseline'");
    expect(experimentHandler).not.toContain("'Positive revenue lift'");
  });

  it('requires actual outcome evidence before completing an experiment', () => {
    expect(experimentStatusHandler).toContain("status === 'completed'");
    expect(experimentStatusHandler).toContain("typeof actualOutcome !== 'string'");
    expect(experimentStatusHandler).not.toContain("status || 'completed'");
    expect(experimentStatusHandler).toContain('Number.isFinite(Number(value))');
  });
});

const outcomesSummaryStart = server.indexOf("app.get('/api/revenue/outcomes'");
const outcomesSummaryEnd = server.indexOf("app.post('/api/revenue/outcomes/measure'", outcomesSummaryStart);
const outcomesSummaryHandler = server.slice(outcomesSummaryStart, outcomesSummaryEnd);

describe('outcome reporting status integrity', () => {
  it('does not count measured-but-unevaluated records as evaluated outcomes', () => {
    expect(outcomesSummaryHandler).toContain("if (o.outcomeStatus === 'evaluated')");
    expect(outcomesSummaryHandler).toContain("} else if (o.outcomeStatus === 'measured')");
    expect(outcomesSummaryHandler).toContain('measuredCount,');
    expect(outcomesSummaryHandler).not.toContain("o.outcomeStatus === 'evaluated' || o.outcomeStatus === 'measured'");
  });
});

describe('revenue experiment form and API contract', () => {
  it('submits the explicit baseline and expected outcome required by the API', () => {
    expect(revenueView).toContain("const [newBaseline, setNewBaseline] = useState('')");
    expect(revenueView).toContain("const [newExpectedOutcome, setNewExpectedOutcome] = useState('')");
    expect(revenueView).toContain('baseline: newBaseline.trim()');
    expect(revenueView).toContain('expectedOutcome: newExpectedOutcome.trim()');
    expect(revenueView).toContain('Measured Baseline');
    expect(revenueView).toContain('Expected Outcome');
  });

  it('surfaces API validation errors instead of silently closing the form', () => {
    expect(revenueView).toContain('setExperimentFormError(responseData.error');
    expect(revenueView).toContain('role="alert"');
    expect(revenueView).toContain("if (!res.ok)");
  });
});
