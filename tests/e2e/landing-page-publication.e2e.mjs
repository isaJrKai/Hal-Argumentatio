import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});

test('Landing Page Studio saves privately and publishes only the approved version', async ({ page, request }) => {
  test.setTimeout(120000);
  const suffix = randomUUID().replace(/-/g, '');
  const email = `landing-publish-e2e-${suffix}@example.test`;
  const password = 'Landing-Publish-E2E-Password-42!';
  let contractorId = '';

  try {
    const registration = await request.post('/api/auth/register', {
      data: { email, password, name: 'Landing Publication E2E Workspace' }
    });
    expect(registration.ok()).toBeTruthy();
    const registered = await registration.json();
    contractorId = registered.contractor.id;

    await page.addInitScript(value => {
      localStorage.setItem('halbiz_auth_token', value);
      localStorage.setItem('token', value);
    }, registered.token);
    await page.goto('/');
    await page.getByText('Landing Pages', { exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Contractor Landing Page Studio' })).toBeVisible();

    const title = `E2E Private Draft ${suffix.slice(0, 8)}`;
    const titleInput = page.locator('input[title="Click to rename page"]');
    await titleInput.fill(title);

    const saveResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/landing-pages/save') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok()).toBeTruthy();
    const saved = await saveResponse.json();
    expect(saved).toMatchObject({ success: true, status: 'draft' });
    expect(saved.versionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.liveUrl).toBeUndefined();

    const privateResponse = await request.get(`/landing/${saved.id}`);
    expect(privateResponse.status()).toBe(404);

    page.on('dialog', dialog => dialog.accept());
    const publishResponsePromise = page.waitForResponse(response =>
      response.url().includes(`/api/landing-pages/${saved.id}/publish`) && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Approve & Publish' }).click();
    const publishResponse = await publishResponsePromise;
    expect(publishResponse.status()).toBe(200);
    const published = await publishResponse.json();
    expect(published).toMatchObject({ success: true, id: saved.id, status: 'ready', versionHash: saved.versionHash });

    const publicResponse = await request.get(published.liveUrl);
    expect(publicResponse.status()).toBe(200);
    expect(await publicResponse.text()).toContain(title);

    await titleInput.fill(`${title} revised`);
    const reviseResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/landing-pages/save') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const reviseResponse = await reviseResponsePromise;
    expect(reviseResponse.ok()).toBeTruthy();
    const revised = await reviseResponse.json();
    expect(revised.status).toBe('draft');
    expect(revised.versionHash).not.toBe(saved.versionHash);

    const unpublishedResponse = await request.get(`/landing/${saved.id}`);
    expect(unpublishedResponse.status()).toBe(404);
    const staleApproval = await request.post(`/api/landing-pages/${saved.id}/publish`, {
      headers: { Authorization: `Bearer ${registered.token}` },
      data: { expectedVersionHash: saved.versionHash }
    });
    expect(staleApproval.status()).toBe(409);
  } finally {
    if (contractorId) {
      await pool.query('DELETE FROM work_events WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM hermes_lab_artifacts WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = $1', [contractorId]);
      await pool.query('DELETE FROM contractors WHERE id = $1', [contractorId]);
    }
    await pool.end().catch(() => {});
  }
});
