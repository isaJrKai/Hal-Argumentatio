import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});

test('Document Studio persists, approves, and captures client proposal acceptance in a browser', async ({ page, context, request }) => {
  test.setTimeout(120000);
  const suffix = randomUUID().replace(/-/g, '');
  const email = `proposal-e2e-${suffix}@example.test`;
  const password = 'Browser-E2E-Test-Password-42!';
  let contractorId = '';
  let leadId = '';
  try {
    const registration = await request.post('/api/auth/register', {
      data: { email, password, name: 'Proposal E2E Workspace' }
    });
    expect(registration.ok()).toBeTruthy();
    const registered = await registration.json();
    const token = registered.token;
    contractorId = registered.contractor.id;
    leadId = `e2e_lead_${suffix}`;

    await pool.query(
      `INSERT INTO leads (id, contractor_id, business_name, city, niche, status, source)
       VALUES ($1, $2, $3, $4, $5, 'closed_won', 'manual')`,
      [leadId, contractorId, 'Browser E2E Mechanical', 'Kampala', 'mechanical services']
    );

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(value => {
      localStorage.setItem('halbiz_auth_token', value);
      localStorage.setItem('token', value);
    }, token);
    await page.goto('/');
    await page.getByText('Document Studio', { exact: true }).first().click();
    await expect(page.getByText('Persisted client proposals')).toBeVisible();

    await page.getByLabel('Saved lead').selectOption(leadId);
    await page.getByRole('button', { name: 'Generate and save proposal draft' }).click();
    await expect(page.getByText(/Proposal draft saved to the workspace/)).toBeVisible();

    await page.getByRole('button', { name: 'Approve internally' }).click();
    await expect(page.getByText('Internally approved', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'Copy client acceptance link' }).click();
    const signingUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(signingUrl).toContain('/sign/proposal/');

    const clientPage = await context.newPage();
    await clientPage.goto(signingUrl);
    await expect(clientPage.getByRole('heading', { name: 'Browser E2E Mechanical' })).toBeVisible();
    await clientPage.getByLabel('Full name').fill('Browser E2E Client');
    await clientPage.getByLabel('Email address').fill('client-e2e@example.test');
    await clientPage.getByRole('checkbox').check();
    await clientPage.getByRole('button', { name: 'Accept proposal' }).click();
    await expect(clientPage.getByRole('heading', { name: 'Acceptance recorded' })).toBeVisible();

    const persisted = await pool.query(
      'SELECT status, signer_name, signer_email, signature_consent, signed_content_hash FROM proposals WHERE contractor_id = $1 AND lead_id = $2',
      [contractorId, leadId]
    );
    expect(persisted.rows).toHaveLength(1);
    expect(persisted.rows[0]).toMatchObject({
      status: 'signed',
      signer_name: 'Browser E2E Client',
      signer_email: 'client-e2e@example.test',
      signature_consent: true
    });
    expect(persisted.rows[0].signed_content_hash).toMatch(/^[a-f0-9]{64}$/);
  } finally {
    if (contractorId) {
      await pool.query('DELETE FROM work_events WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM proposal_signing_links WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM proposals WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM invoice_payments WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM invoices WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM leads WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM contractors WHERE id = $1', [contractorId]);
    }
    await pool.end();
  }
});
