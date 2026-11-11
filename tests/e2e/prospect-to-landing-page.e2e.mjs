import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});

test('Prospects UI imports an allowlisted fixture, verifies it, and creates a private lead-grounded page', async ({ page, request }) => {
  test.setTimeout(180000);
  const suffix = randomUUID().replace(/-/g, '');
  const email = `prospect-page-e2e-${suffix}@example.test`;
  const password = 'Prospect-Page-E2E-Password-42!';
  const businessName = `HAL E2E Fixture ${suffix.slice(0, 8)}`;
  let contractorId = '';
  let leadId = '';

  try {
    const registration = await request.post('/api/auth/register', {
      data: { email, password, name: 'Prospect to Page E2E Workspace' }
    });
    expect(registration.ok()).toBeTruthy();
    const registered = await registration.json();
    contractorId = registered.contractor.id;

    await page.addInitScript(value => {
      localStorage.setItem('halbiz_auth_token', value);
      localStorage.setItem('token', value);
    }, registered.token);

    // Deterministic candidate fixture: the only network target probed is the
    // reserved example.com test domain, never a real prospect website.
    await page.route('**/api/leads/harvest', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        businessName,
        city: 'Kampala',
        serviceType: 'general services',
        phone: '+256700123456',
        email: `fixture-${suffix}@example.test`,
        websiteUrl: 'https://example.com',
        sourceType: 'e2e_allowlisted_fixture',
        verificationStatus: 'UNVERIFIED_STAGING',
        dnsVerified: false,
        isSynthetic: false,
        notes: 'Deterministic E2E fixture. Not a real prospect; website probe is restricted to example.com.'
      }])
    }));

    await page.goto('/');
    await page.getByText('Prospects', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Find prospects' }).click();
    await page.getByRole('button', { name: 'EXECUTE SCAN' }).click();
    await expect(page.getByText(businessName, { exact: true }).first()).toBeVisible();

    const ingestPromise = page.waitForResponse(response =>
      response.url().includes('/api/leads/ingest') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /Ingest Selected/ }).click();
    const ingestResponse = await ingestPromise;
    expect(ingestResponse.ok()).toBeTruthy();
    const ingestResult = await ingestResponse.json();
    expect(ingestResult.count).toBe(1);
    leadId = ingestResult.leads[0].id;

    await expect(page.getByText(businessName, { exact: true }).first()).toBeVisible();
    await page.getByText(businessName, { exact: true }).first().click();

    const groundingPromise = page.waitForResponse(response =>
      response.url().includes(`/api/leads/${leadId}/verify-grounding`) && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Probe Live Grounding' }).click();
    const groundingResponse = await groundingPromise;
    expect(groundingResponse.ok()).toBeTruthy();
    const grounding = await groundingResponse.json();
    expect(grounding).toMatchObject({ success: true, leadId, verificationStatus: 'VERIFIED', dnsVerified: true });
    expect(grounding.evidence).toMatchObject({
      hostname: 'example.com',
      dnsResolved: true,
      httpReachable: true,
      sslSecured: true
    });

    const leadRow = await pool.query(
      'SELECT contractor_id, verification_status, dns_verified, is_synthetic, grounding_evidence FROM leads WHERE id = $1',
      [leadId]
    );
    expect(leadRow.rows).toHaveLength(1);
    expect(leadRow.rows[0]).toMatchObject({
      contractor_id: contractorId,
      verification_status: 'VERIFIED',
      dns_verified: true,
      is_synthetic: false
    });
    expect(leadRow.rows[0].grounding_evidence).toMatchObject({
      hostname: 'example.com',
      dnsResolved: true,
      httpReachable: true,
      sslSecured: true
    });

    await page.getByRole('button', { name: 'Create Landing Page Draft' }).click();
    await expect(page.getByRole('heading', { name: 'Contractor Landing Page Studio' })).toBeVisible();

    const savePromise = page.waitForResponse(response =>
      response.url().includes('/api/landing-pages/save') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saveResponse = await savePromise;
    expect(saveResponse.ok()).toBeTruthy();
    const saved = await saveResponse.json();
    expect(saved).toMatchObject({ success: true, status: 'draft' });

    const pageRecord = await pool.query(
      "SELECT content->'pageConfig'->>'sourceLeadId' AS source_lead_id, content->'pageConfig'->'sourceLeadEvidence'->>'verificationStatus' AS source_verification, content->'pageConfig'->>'businessName' AS business_name FROM hermes_lab_artifacts WHERE id = $1 AND contractor_id = $2",
      [saved.id, contractorId]
    );
    expect(pageRecord.rows).toHaveLength(1);
    expect(pageRecord.rows[0]).toMatchObject({
      source_lead_id: leadId,
      source_verification: 'VERIFIED',
      business_name: businessName
    });

    const publicDraft = await request.get(`/landing/${saved.id}`);
    expect(publicDraft.status()).toBe(404);
  } finally {
    if (contractorId) {
      await pool.query('DELETE FROM work_events WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM work_tasks WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM hermes_lab_artifacts WHERE contractor_id = $1', [contractorId]);
      if (leadId) {
        await pool.query('DELETE FROM lead_events WHERE lead_id = $1', [leadId]);
      }
      await pool.query('DELETE FROM leads WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM contractors WHERE id = $1', [contractorId]);
    }
    await pool.end().catch(() => {});
  }
});
