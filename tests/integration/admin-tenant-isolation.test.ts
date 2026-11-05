import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { app } from '../../server';
import { bootstrapPostgresTables } from '../../src/db/postgres';
import { hashPassword } from '../../src/db/db';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl || 'postgres://postgres:postgres@127.0.0.1:5432/hal_test' });
const suffix = randomUUID().replace(/-/g, '');
const adminId = `admin_isolation_${suffix}`;
const tenantId = `tenant_isolation_${suffix}`;
const adminEmail = `admin-${suffix}@example.test`;
const tenantEmail = `tenant-${suffix}@example.test`;
const password = 'Admin-Isolation-Test-Password-42!';
const adminLeadId = `admin_lead_${suffix}`;
const tenantLeadId = `tenant_lead_${suffix}`;
let dbAvailable = false;
let adminToken = '';
let tenantToken = '';

async function login(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe('Platform admin HTTP tenant isolation', () => {
  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      await bootstrapPostgresTables(pool);
      dbAvailable = true;
      const passwordHash = hashPassword(password);
      await pool.query(
        `INSERT INTO contractors (id, company_name, email, city, service_type, role, password_hash)
         VALUES ($1, 'Admin Isolation Test', $2, 'Kampala', 'Testing', 'admin', $3),
                ($4, 'Tenant Isolation Test', $5, 'London', 'Testing', 'user', $3)`,
        [adminId, adminEmail, passwordHash, tenantId, tenantEmail]
      );
      await pool.query(
        `INSERT INTO leads (id, contractor_id, business_name, city, niche, status, source)
         VALUES ($1, $2, 'Admin Private Lead', 'Kampala', 'testing', 'new', 'manual'),
                ($3, $4, 'Tenant Private Lead', 'London', 'testing', 'new', 'manual')`,
        [adminLeadId, adminId, tenantLeadId, tenantId]
      );
      await pool.query(
        `INSERT INTO revenue_records (id, contractor_id, lead_id, amount_usd, source)
         VALUES ($1, $2, $3, 100, 'test'), ($4, $5, $6, 200, 'test')`,
        [`admin_revenue_${suffix}`, adminId, adminLeadId, `tenant_revenue_${suffix}`, tenantId, tenantLeadId]
      );
      adminToken = await login(adminEmail);
      tenantToken = await login(tenantEmail);
    } catch (error) {
      if (process.env.CI) throw error;
      dbAvailable = false;
    }
  }, 30000);

  afterAll(async () => {
    if (dbAvailable) {
      await pool.query('DELETE FROM revenue_records WHERE contractor_id = ANY($1::text[])', [[adminId, tenantId]]);
      await pool.query('DELETE FROM leads WHERE contractor_id = ANY($1::text[])', [[adminId, tenantId]]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = ANY($1::text[])', [[adminId, tenantId]]);
      await pool.query('DELETE FROM contractors WHERE id = ANY($1::text[])', [[adminId, tenantId]]);
    }
    await pool.end().catch(() => {});
  });

  it('keeps lead and revenue list responses tenant-local even when the caller is an admin', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const adminLeads = await request(app).get('/api/leads').set('Authorization', `Bearer ${adminToken}`);
    const tenantLeads = await request(app).get('/api/leads').set('Authorization', `Bearer ${tenantToken}`);
    expect(adminLeads.status).toBe(200);
    expect(tenantLeads.status).toBe(200);
    expect(adminLeads.body.map((row: { id: string }) => row.id)).toContain(adminLeadId);
    expect(adminLeads.body.map((row: { id: string }) => row.id)).not.toContain(tenantLeadId);
    expect(tenantLeads.body.map((row: { id: string }) => row.id)).toContain(tenantLeadId);
    expect(tenantLeads.body.map((row: { id: string }) => row.id)).not.toContain(adminLeadId);

    const adminRevenue = await request(app).get('/api/revenues').set('Authorization', `Bearer ${adminToken}`);
    const tenantRevenue = await request(app).get('/api/revenues').set('Authorization', `Bearer ${tenantToken}`);
    expect(adminRevenue.status).toBe(200);
    expect(tenantRevenue.status).toBe(200);
    expect(adminRevenue.body.every((row: { contractorId: string }) => row.contractorId === adminId)).toBe(true);
    expect(tenantRevenue.body.every((row: { contractorId: string }) => row.contractorId === tenantId)).toBe(true);
  });

  it('restricts platform account APIs to administrators and enforces suspension immediately', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const adminOverview = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
    const tenantOverview = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${tenantToken}`);
    expect(adminOverview.status).toBe(200);
    expect(tenantOverview.status).toBe(403);

    const suspended = await request(app).patch(`/api/admin/contractors/${tenantId}`)
      .set('Authorization', `Bearer ${adminToken}`).send({ accountStatus: 'suspended' });
    expect(suspended.status).toBe(200);
    const blocked = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tenantToken}`);
    expect(blocked.status).toBe(403);

    const restored = await request(app).patch(`/api/admin/contractors/${tenantId}`)
      .set('Authorization', `Bearer ${adminToken}`).send({ accountStatus: 'active' });
    expect(restored.status).toBe(200);
    const allowedAgain = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tenantToken}`);
    expect(allowedAgain.status).toBe(200);
  });

  it('prevents removing the final active administrator', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const selfSuspend = await request(app).patch(`/api/admin/contractors/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`).send({ accountStatus: 'suspended' });
    expect(selfSuspend.status).toBe(409);
  });
});
