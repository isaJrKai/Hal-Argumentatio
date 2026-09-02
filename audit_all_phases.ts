import { db as pgDb } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';
import { calculateMetricAccuracy, calculatePredictionAccuracy, calculateRevenueDelta, calculateRoasDelta, classifyOutcome } from './src/lib/revenueMath.ts';
import { validateAndProcessOutcome } from './src/lib/outcomeValidation.ts';
import crypto from 'crypto';

interface AuditResult {
  phase: string;
  testName: string;
  passed: boolean;
  details: any;
  error?: string;
}

const auditLog: AuditResult[] = [];

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║         HAL FORENSIC AUDIT & STABILITY VERIFICATION SUITE           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const BASE_URL = 'http://127.0.0.1:3000';
  let tokenAlpha = '';
  let tokenBeta = '';
  let contractorAlphaId = '';
  let contractorBetaId = '';

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: API / Health & Anti-SPA HTML Leak Check
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthContentType = healthRes.headers.get('content-type') || '';
    const healthJson = await healthRes.json();
    
    // Test unmatched API route guarantees JSON 404 and NOT HTML SPA
    const nonExistentRes = await fetch(`${BASE_URL}/api/non_existent_endpoint_12345`);
    const nonExistentContentType = nonExistentRes.headers.get('content-type') || '';
    const nonExistentJson = await nonExistentRes.json();

    const passed = healthRes.ok && 
                   healthContentType.includes('application/json') && 
                   healthJson.status === 'ok' &&
                   nonExistentRes.status === 404 &&
                   nonExistentContentType.includes('application/json') &&
                   nonExistentJson.success === false;

    auditLog.push({
      phase: 'Routing & API Contracts',
      testName: 'API Health & Anti-SPA HTML Leak Isolation',
      passed,
      details: { healthJson, nonExistentJson, nonExistentStatus: nonExistentRes.status }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Routing & API Contracts',
      testName: 'API Health & Anti-SPA HTML Leak Isolation',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Multi-Tenant Provisioning & JWT Token Issuance
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const alphaEmail = `audit_alpha_${Date.now()}@example.com`;
    const betaEmail = `audit_beta_${Date.now()}@example.com`;
    const password = 'Password123!Secure';

    // Register Tenant Alpha
    const regAlphaRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alpha HVAC Contractors',
        email: alphaEmail,
        password
      })
    });
    const regAlpha = await regAlphaRes.json();
    tokenAlpha = regAlpha.token;
    contractorAlphaId = regAlpha.contractor?.id;

    // Register Tenant Beta
    const regBetaRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Beta Roofing Systems',
        email: betaEmail,
        password
      })
    });
    const regBeta = await regBetaRes.json();
    tokenBeta = regBeta.token;
    contractorBetaId = regBeta.contractor?.id;

    const passed = !!tokenAlpha && !!tokenBeta && contractorAlphaId !== contractorBetaId;

    auditLog.push({
      phase: 'Multi-Tenant Auth',
      testName: 'Dual Tenant Provisioning & JWT Token Issuance',
      passed,
      details: { contractorAlphaId, contractorBetaId }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Multi-Tenant Auth',
      testName: 'Dual Tenant Provisioning & JWT Token Issuance',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Phase 0-4 (Attribution -> Leads -> CRM Webhook -> Conversion Outbox)
  // ─────────────────────────────────────────────────────────────────────────
  let leadAlphaId = '';
  const testGclid = `gclid_${crypto.randomUUID()}`;
  const testLeadEmail = `lead_${Date.now()}@apexplaza.com`;
  const crmEventId = `evt_${crypto.randomUUID()}`;

  try {
    // 3.1 Create Lead for Tenant Alpha with Google Ads Attribution
    const leadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      },
      body: JSON.stringify({
        businessName: 'Apex Commercial Plaza',
        city: 'Austin',
        niche: 'Commercial HVAC',
        ownerName: 'Marcus Vance',
        phone: '512-555-0149',
        email: testLeadEmail,
        predictedMonthlyLostRevenueUsd: 4500,
        gclid: testGclid,
        utmSource: 'google',
        utmCampaign: 'hvac_emergency_2026'
      })
    });
    const leadJson = await leadRes.json();
    leadAlphaId = leadJson.id || leadJson.lead?.id;

    // 3.2 Ingest CRM Webhook Event (ClosedWon)
    const crmWebhookRes = await fetch(`${BASE_URL}/api/webhooks/crm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.HAL_CRM_WEBHOOK_SECRET || 'hal_secure_crm_secret_2026'
      },
      body: JSON.stringify({
        eventId: crmEventId,
        eventType: 'ClosedWon',
        contractorId: contractorAlphaId,
        dealValue: 7500,
        currency: 'USD',
        occurredAt: new Date().toISOString(),
        lead: {
          id: leadAlphaId,
          email: testLeadEmail
        }
      })
    });
    const crmWebhookJson = await crmWebhookRes.json();

    // 3.3 Test Idempotency: replay the exact same CRM webhook event
    const duplicateWebhookRes = await fetch(`${BASE_URL}/api/webhooks/crm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.HAL_CRM_WEBHOOK_SECRET || 'hal_secure_crm_secret_2026'
      },
      body: JSON.stringify({
        eventId: crmEventId,
        eventType: 'ClosedWon',
        contractorId: contractorAlphaId,
        dealValue: 7500,
        currency: 'USD',
        occurredAt: new Date().toISOString(),
        lead: {
          id: leadAlphaId,
          email: testLeadEmail
        }
      })
    });
    const duplicateWebhookJson = await duplicateWebhookRes.json();

    // 3.4 Check conversion outbox queue
    const outboxCheck = await pgDb.select().from(schema.conversionOutbox)
      .where(eq(schema.conversionOutbox.contractorId, contractorAlphaId));

    const outboxItem = outboxCheck.find(o => o.leadId === leadAlphaId);

    const passed = !!leadAlphaId && 
                   crmWebhookJson.success === true && 
                   duplicateWebhookJson.duplicate === true && 
                   !!outboxItem &&
                   outboxItem.gclid === testGclid &&
                   outboxItem.conversionValue === 7500;

    auditLog.push({
      phase: 'Phase 0-4',
      testName: 'Attribution -> Lead -> CRM Event -> Outbox Pipeline & Idempotency',
      passed,
      details: { 
        leadAlphaId, 
        webhookSuccess: crmWebhookJson.success, 
        duplicateBlocked: duplicateWebhookJson.duplicate,
        outboxFound: !!outboxItem,
        outboxGclid: outboxItem?.gclid,
        outboxValue: outboxItem?.conversionValue
      }
    });
  } catch (err: any) {
    console.error('Phase 0-4 error details:', err);
    auditLog.push({
      phase: 'Phase 0-4',
      testName: 'Attribution -> Lead -> CRM Event -> Outbox Pipeline & Idempotency',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Tenant Isolation Security Verification
  // ─────────────────────────────────────────────────────────────────────────
  try {
    // Tenant Beta attempts to access Tenant Alpha's lead directly
    const crossTenantLeadRes = await fetch(`${BASE_URL}/api/leads/${leadAlphaId}`, {
      headers: { 'Authorization': `Bearer ${tokenBeta}` }
    });
    const crossLeadJson = await crossTenantLeadRes.json();

    // Tenant Beta queries their own lead list
    const betaLeadsRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { 'Authorization': `Bearer ${tokenBeta}` }
    });
    const betaLeadsJson = await betaLeadsRes.json();
    const betaLeadsList = Array.isArray(betaLeadsJson) ? betaLeadsJson : betaLeadsJson.leads || [];
    const leakedLead = betaLeadsList.find((l: any) => l.id === leadAlphaId);

    const passed = (!crossTenantLeadRes.ok || !crossLeadJson || crossLeadJson.error || crossLeadJson.lead?.contractorId !== contractorBetaId) && !leakedLead;

    auditLog.push({
      phase: 'Tenant Isolation',
      testName: 'Cross-Tenant Lead & Data Isolation',
      passed,
      details: { crossTenantStatus: crossTenantLeadRes.status, leakedInList: !!leakedLead }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Tenant Isolation',
      testName: 'Cross-Tenant Lead & Data Isolation',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Phase 5 - Revenue Intelligence Math & Financials Overview
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const finRes = await fetch(`${BASE_URL}/api/financials/overview`, {
      headers: { 'Authorization': `Bearer ${tokenAlpha}` }
    });
    const finJson = await finRes.json();

    // Deterministic Math Library Unit Verification
    const metricAcc = calculateMetricAccuracy(10000, 9500); // 95%
    const compositeAcc = calculatePredictionAccuracy(10000, 9500, 4.0, 3.8); // 95%
    const revDelta = calculateRevenueDelta(10000, 9500); // -500
    const roasDelta = calculateRoasDelta(4.0, 3.8); // -0.2
    const classification = classifyOutcome(compositeAcc, 10000, 9500, 'evaluated');

    const mathPassed = metricAcc === 0.95 && compositeAcc === 0.95 && revDelta === -500 && classification === 'successful';
    const apiPassed = finRes.ok && typeof finJson.currentMrrUsd === 'number' && typeof finJson.arrUsd === 'number';

    auditLog.push({
      phase: 'Phase 5',
      testName: 'Revenue Intelligence Calculations & Financials API Contract',
      passed: mathPassed && apiPassed,
      details: { finSummary: { mrr: finJson.currentMrrUsd, arr: finJson.arrUsd }, mathPassed }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Phase 5',
      testName: 'Revenue Intelligence Calculations & Financials API Contract',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Phase 6A-D - Recommendation Lifecycle, Simulation, Outcome Verification
  // ─────────────────────────────────────────────────────────────────────────
  let recId = '';
  let simId = '';
  let outcomeId = '';

  try {
    // 6.1 Get/Seed Recommendations
    const recRes = await fetch(`${BASE_URL}/api/revenue/recommendations`, {
      headers: { 'Authorization': `Bearer ${tokenAlpha}` }
    });
    const recList = await recRes.json();
    recId = Array.isArray(recList) && recList.length > 0 ? recList[0].id : '';

    // 6.2 Run Simulation
    const simRes = await fetch(`${BASE_URL}/api/revenue/simulations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      },
      body: JSON.stringify({
        scenarioType: 'budget_shift',
        baselineData: { monthlySpend: 5000, currentLeads: 45, currentCpl: 111.1 },
        scenarioParameters: { searchShare: 0.85, displayShare: 0.15 },
        projectedResult: { projectedLeads: 58, projectedCpl: 86.2, projectedMrrLift: 4200 },
        delta: { leadDelta: 13, cplDelta: -24.9, mrrDelta: 4200 },
        confidenceScore: 88.0,
        assumptions: 'Assumes seasonal search volume remains constant over next 60 days.'
      })
    });
    const simJson = await simRes.json();
    simId = simJson.simulation?.id || simJson.id;

    // 6.3 Approve Recommendation via transition state matrix
    const approveRes = await fetch(`${BASE_URL}/api/revenue/recommendations/${recId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      },
      body: JSON.stringify({
        action: 'approve',
        actor: 'Operator'
      })
    });
    const approveJson = await approveRes.json();

    // 6.4 Execute Recommendation
    const executeRes = await fetch(`${BASE_URL}/api/revenue/recommendations/${recId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      },
      body: JSON.stringify({
        action: 'execute',
        actor: 'Operator',
        executionReference: 'Audit-Exec-Ref-001'
      })
    });
    const executeJson = await executeRes.json();

    // 6.5 Measure Outcomes
    const measureRes = await fetch(`${BASE_URL}/api/revenue/outcomes/measure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      }
    });
    const measureJson = await measureRes.json();
    const outcomes = measureJson.outcomes || [];
    outcomeId = outcomes.length > 0 ? outcomes[0].id : '';

    // 6.6 Guardrail Validation
    const pastStart = new Date(Date.now() - 30 * 86400000).toISOString();
    const pastEnd = new Date(Date.now() - 1 * 86400000).toISOString();
    const guardrail = validateAndProcessOutcome({
      expectedRevenue: 4200,
      actualRevenue: 4350,
      expectedRoas: 4.0,
      actualRoas: 4.15,
      observationStart: pastStart,
      observationEnd: pastEnd,
      status: 'evaluated'
    });

    const passed = !!recId && 
                   !!simId && 
                   approveJson.success === true && 
                   executeJson.success === true && 
                   measureJson.success === true && 
                   guardrail.isValid && 
                   guardrail.classification === 'successful';

    auditLog.push({
      phase: 'Phase 6A-D',
      testName: 'Recommendation -> Simulation -> Approval -> Execution -> Outcome Verification',
      passed,
      details: { 
        recId, 
        simId, 
        outcomeId, 
        approved: approveJson.success, 
        executed: executeJson.success, 
        measured: measureJson.success,
        guardrailClassification: guardrail.classification 
      }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Phase 6A-D',
      testName: 'Recommendation -> Simulation -> Approval -> Execution -> Outcome Verification',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Phase 7 - HAL Verified Business Operating Loop State Machine
  // ─────────────────────────────────────────────────────────────────────────
  let loopId = '';
  try {
    // 7.1 Initialize Loop
    const createLoopRes = await fetch(`${BASE_URL}/api/hal/loops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      },
      body: JSON.stringify({
        trigger: 'manual_init',
        recommendationId: recId
      })
    });
    const createLoopJson = await createLoopRes.json();
    loopId = createLoopJson.loop?.id;

    // 7.2 Run Stage Transition: Advance stage
    const advanceRes = await fetch(`${BASE_URL}/api/hal/loops/${loopId}/advance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      }
    });
    const advanceJson = await advanceRes.json();

    // 7.3 Pause Loop
    const pauseRes = await fetch(`${BASE_URL}/api/hal/loops/${loopId}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      }
    });
    const pauseJson = await pauseRes.json();

    // 7.4 Resume Loop
    const resumeRes = await fetch(`${BASE_URL}/api/hal/loops/${loopId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAlpha}`
      }
    });
    const resumeJson = await resumeRes.json();

    // 7.5 Fetch Loop by ID
    const fetchLoopRes = await fetch(`${BASE_URL}/api/hal/loops/${loopId}`, {
      headers: { 'Authorization': `Bearer ${tokenAlpha}` }
    });
    const fetchLoopJson = await fetchLoopRes.json();

    const passed = !!loopId && 
                   createLoopJson.success && 
                   advanceJson.success && 
                   pauseJson.success && 
                   resumeJson.success &&
                   fetchLoopJson.loop?.currentStage === 'analyzing';

    auditLog.push({
      phase: 'Phase 7',
      testName: 'Verified Business Operating Loop State Machine Lifecycle',
      passed,
      details: { 
        loopId, 
        stage: fetchLoopJson.loop?.currentStage, 
        status: fetchLoopJson.loop?.status,
        eventsCount: fetchLoopJson.events?.length
      }
    });
  } catch (err: any) {
    auditLog.push({
      phase: 'Phase 7',
      testName: 'Verified Business Operating Loop State Machine Lifecycle',
      passed: false,
      details: null,
      error: err.message
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n=================== AUDIT RESULTS SUMMARY ===================');
  let overallPass = true;
  for (const item of auditLog) {
    const symbol = item.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${symbol} [${item.phase}] ${item.testName}`);
    if (!item.passed) {
      overallPass = false;
      console.log(`     Error: ${item.error || 'Assertion failed'}`);
      console.log(`     Details:`, JSON.stringify(item.details, null, 2));
    }
  }
  console.log('============================================================');
  console.log(`\nFINAL SYSTEM STATUS: ${overallPass ? 'ALL TESTS PASSED - SYSTEM IS STABLE' : 'STABILITY ISSUES DETECTED'}\n`);

  if (!overallPass) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
