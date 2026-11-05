import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { app } from '../../server';
import { bootstrapPostgresTables } from '../../src/db/postgres';
import { hashPassword } from '../../src/db/db';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test'
});

const suffix = randomUUID().replace(/-/g, '');
const tenantA = `route_test_a_${suffix}`;
const tenantB = `route_test_b_${suffix}`;
const emailA = `${tenantA}@example.test`;
const emailB = `${tenantB}@example.test`;
const password = 'Route-Test-Only-Password-42!';
const leadA = `lead_${suffix}`;
const projectA = `project_${suffix}`;
const leadRevenueA = `revenue_lead_${suffix}`;
const leadB = `lead_b_${suffix}`;

let dbAvailable = false;
let tokenA = '';
let tokenB = '';

async function login(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  return response.body.token as string;
}

describe('client project HTTP route tenant isolation', () => {
  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      await bootstrapPostgresTables(pool);
      dbAvailable = true;

      const passwordHash = hashPassword(password);
      await pool.query(
        `INSERT INTO contractors (id, company_name, email, city, service_type, role, password_hash)
         VALUES ($1, $2, $3, $4, $5, 'user', $6), ($7, $8, $9, $10, $11, 'user', $6)`,
        [tenantA, 'Route Test Tenant A', emailA, 'Kampala', 'Web Services', passwordHash,
          tenantB, 'Route Test Tenant B', emailB, 'London', 'Marketing']
      );
      await pool.query(
        `INSERT INTO leads (id, contractor_id, business_name, city, niche, status)
         VALUES ($1, $2, $3, $4, $5, 'closed_won'),
                ($6, $7, $8, $9, $10, 'proposal'),
                ($11, $12, $13, $14, $15, 'qualified')`,
        [leadA, tenantA, 'Tenant A Roofing', 'Kampala', 'roofing',
          leadRevenueA, tenantA, 'Tenant A HVAC', 'Kampala', 'hvac',
          leadB, tenantB, 'Tenant B Electrical', 'London', 'electrical']
      );

      tokenA = await login(emailA);
      tokenB = await login(emailB);
    } catch (error) {
      if (process.env.CI) throw error;
      dbAvailable = false;
    }
  }, 30000);

  afterAll(async () => {
    if (dbAvailable) {
      await pool.query('DELETE FROM work_events WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM revenue_records WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM client_projects WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM lead_events WHERE lead_id = ANY($1::text[])', [[leadA, leadRevenueA, leadB]]);
      await pool.query('DELETE FROM leads WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM contractors WHERE id = ANY($1::text[])', [[tenantA, tenantB]]);
    }
    await pool.end().catch(() => {});
  });

  it('rejects a tenant B attempt to convert tenant A\'s won lead without creating records', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        leadId: leadA,
        businessName: 'Tenant A Roofing',
        city: 'Kampala',
        serviceType: 'Website and local SEO',
        packageTier: 'Growth',
        monthlyRetainerUsd: 1200
      });

    expect(response.status).toBe(404);
    const projects = await pool.query('SELECT id FROM client_projects WHERE lead_id = $1', [leadA]);
    expect(projects.rows).toHaveLength(0);
  });

  it('creates a tenant-owned project, records its event, and rejects duplicate conversion', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const payload = {
      leadId: leadA,
      businessName: 'Tenant A Roofing',
      city: 'Kampala',
      serviceType: 'Website and local SEO',
      packageTier: 'Growth',
      monthlyRetainerUsd: 1200
    };

    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);

    expect(created.status).toBe(201);
    expect(created.body.id).toEqual(expect.any(String));
    expect(created.body.contractorId).toBe(tenantA);
    expect(created.body.leadId).toBe(leadA);

    const duplicate = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.projectId).toBe(created.body.id);

    const projects = await pool.query(
      'SELECT id, contractor_id, lead_id FROM client_projects WHERE lead_id = $1',
      [leadA]
    );
    expect(projects.rows).toHaveLength(1);
    expect(projects.rows[0]).toMatchObject({
      id: created.body.id,
      contractor_id: tenantA,
      lead_id: leadA
    });

    const events = await pool.query(
      `SELECT event_type, entity_id FROM work_events
       WHERE contractor_id = $1 AND entity_type = 'client_project' AND entity_id = $2`,
      [tenantA, created.body.id]
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0].event_type).toBe('client_project.created');

    const tenantBList = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(tenantBList.status).toBe(200);
    expect(tenantBList.body).toEqual([]);

    const activated = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'active_delivery', monthlyRetainerUsd: 1500 });
    expect(activated.status).toBe(200);
    expect(activated.body.status).toBe('active_delivery');
    expect(activated.body.monthlyRetainerUsd).toBe(1500);

    const tenantAFinancials = await request(app)
      .get('/api/financials/overview')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(tenantAFinancials.status).toBe(200);
    expect(tenantAFinancials.body.currentMrrUsd).toBe(1500);
    expect(tenantAFinancials.body.arrUsd).toBe(18000);
    expect(tenantAFinancials.body.activeClientCount).toBe(1);

    const tenantBFinancials = await request(app)
      .get('/api/financials/overview')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(tenantBFinancials.status).toBe(200);
    expect(tenantBFinancials.body.currentMrrUsd).toBe(0);
    expect(tenantBFinancials.body.arrUsd).toBe(0);
    expect(tenantBFinancials.body.activeClientCount).toBe(0);

    const cancelled = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'cancelled' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const reactivation = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'active_delivery', monthlyRetainerUsd: 1500 });
    expect(reactivation.status).toBe(409);

    const [terminalProject] = (await pool.query(
      'SELECT status, monthly_retainer_usd FROM client_projects WHERE id = $1 AND contractor_id = $2',
      [created.body.id, tenantA]
    )).rows;
    expect(terminalProject).toMatchObject({ status: 'cancelled', monthly_retainer_usd: 1500 });
  });

  it('prevents tenant B from updating tenant A\'s project by identifier', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const [row] = (await pool.query(
      'SELECT id FROM client_projects WHERE lead_id = $1 AND contractor_id = $2',
      [leadA, tenantA]
    )).rows;
    expect(row).toBeTruthy();

    const [beforeAttempt] = (await pool.query(
      'SELECT status, monthly_retainer_usd FROM client_projects WHERE id = $1 AND contractor_id = $2',
      [row.id, tenantA]
    )).rows;

    const response = await request(app)
      .put(`/api/projects/${row.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'cancelled', monthlyRetainerUsd: 1 });

    expect(response.status).toBe(404);
    const [current] = (await pool.query(
      'SELECT status, monthly_retainer_usd FROM client_projects WHERE id = $1 AND contractor_id = $2',
      [row.id, tenantA]
    )).rows;
    expect(current).toEqual(beforeAttempt);
  });

  it('keeps proposal generation tenant-scoped and records a non-persisted draft event', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const payload = {
      leadId: leadA,
      packageTier: 'Growth',
      monthlyRetainerUsd: 1200,
      setupFeeUsd: 500
    };

    const foreign = await request(app)
      .post('/api/proposals/generate')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(payload);
    expect(foreign.status).toBe(404);

    const generated = await request(app)
      .post('/api/proposals/generate')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);
    expect(generated.status).toBe(201);
    expect(generated.body.persistenceStatus).toBe('generated_only_not_persisted');
    expect(generated.body.roiEstimateAnnualUsd).toBeNull();

    const events = await pool.query(
      `SELECT event_type, entity_id, correlation_id, payload
       FROM work_events
       WHERE contractor_id = $1 AND event_type = 'proposal.generated' AND entity_id = $2`,
      [tenantA, leadA]
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0].correlation_id).toBe(generated.body.id);
    expect(events.rows[0].payload.persistenceStatus).toBe('generated_only_not_persisted');
  });

  it('enforces lead read, update, and delete ownership through HTTP routes', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const ownerRead = await request(app)
      .get(`/api/leads/${leadA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.body.contractorId).toBe(tenantA);

    const foreignRead = await request(app)
      .get(`/api/leads/${leadA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(foreignRead.status).toBe(404);

    const foreignUpdate = await request(app)
      .put(`/api/leads/${leadA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ businessName: 'Tampered by Tenant B', status: 'closed_lost' });
    expect(foreignUpdate.status).toBe(404);

    const foreignDelete = await request(app)
      .delete(`/api/leads/${leadA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(foreignDelete.status).toBe(404);

    const [unchanged] = (await pool.query(
      'SELECT business_name, status FROM leads WHERE id = $1 AND contractor_id = $2',
      [leadA, tenantA]
    )).rows;
    expect(unchanged).toMatchObject({ business_name: 'Tenant A Roofing', status: 'closed_won' });
  });

  it('closes a qualified tenant-owned deal atomically and keeps revenue tenant-scoped', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const foreignAttempt = await request(app)
      .post('/api/revenues')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ leadId: leadRevenueA, amountUsd: 2400, source: 'route_test' });
    expect(foreignAttempt.status).toBe(404);

    const closeOutAttempts = await Promise.all([
      request(app)
        .post('/api/revenues')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ leadId: leadRevenueA, amountUsd: 2400, source: 'route_test' }),
      request(app)
        .post('/api/revenues')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ leadId: leadRevenueA, amountUsd: 2400, source: 'route_test' })
    ]);
    const successfulCloseOuts = closeOutAttempts.filter(response => response.status === 201);
    const conflictingCloseOuts = closeOutAttempts.filter(response => response.status === 409);
    expect(successfulCloseOuts).toHaveLength(1);
    expect(conflictingCloseOuts).toHaveLength(1);

    const created = successfulCloseOuts[0].body;
    expect(created.contractorId).toBe(tenantA);
    expect(created.leadId).toBe(leadRevenueA);
    expect(created.amountUsd).toBe(2400);
    expect(created.leadStatus).toBe('closed_won');

    const tenantARevenue = await request(app)
      .get('/api/revenues')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(tenantARevenue.status).toBe(200);
    expect(tenantARevenue.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: created.body.id, contractorId: tenantA, amountUsd: 2400 })
    ]));

    const tenantBRevenue = await request(app)
      .get('/api/revenues')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(tenantBRevenue.status).toBe(200);
    expect(tenantBRevenue.body).toEqual([]);

    const [persistedLead] = (await pool.query(
      'SELECT status FROM leads WHERE id = $1 AND contractor_id = $2',
      [leadRevenueA, tenantA]
    )).rows;
    expect(persistedLead.status).toBe('closed_won');

    const revenueRows = await pool.query(
      'SELECT contractor_id, lead_id, amount_usd FROM revenue_records WHERE lead_id = $1',
      [leadRevenueA]
    );
    expect(revenueRows.rows).toHaveLength(1);
    expect(revenueRows.rows[0]).toMatchObject({
      contractor_id: tenantA,
      lead_id: leadRevenueA,
      amount_usd: 2400
    });

    const eventRows = await pool.query(
      `SELECT event_type FROM lead_events
       WHERE lead_id = $1 AND event_type IN ('ClosedWon', 'RevenueRecorded')`,
      [leadRevenueA]
    );
    expect(eventRows.rows.map((row: { event_type: string }) => row.event_type).sort())
      .toEqual(['ClosedWon', 'RevenueRecorded']);
  });
});
