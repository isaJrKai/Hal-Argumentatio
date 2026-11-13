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
const buyerId = 'buyer_demo_http_' + suffix;
const buyerEmail = buyerId + '@example.test';
const password = 'Buyer-Demo-HTTP-Test-Password-42!';
let token = '';
let dbAvailable = false;
const previousDemoEnabled = process.env.HAL_DEMO_LOGIN_ENABLED;
const previousDemoAccountId = process.env.HAL_DEMO_ACCOUNT_ID;

describe('buyer demo read-only HTTP enforcement', () => {
  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      await bootstrapPostgresTables(pool);
      dbAvailable = true;
      await pool.query(
        `INSERT INTO contractors (id, company_name, email, city, service_type, role, password_hash)
         VALUES ($1, 'Buyer Demo HTTP Test', $2, 'Kampala', 'Testing', 'user', $3)`,
        [buyerId, buyerEmail, hashPassword(password)]
      );
      process.env.HAL_DEMO_LOGIN_ENABLED = 'true';
      process.env.HAL_DEMO_ACCOUNT_ID = buyerId;
      const login = await request(app).post('/api/auth/login').send({ email: buyerEmail, password });
      expect(login.status).toBe(200);
      expect(login.body.token).toEqual(expect.any(String));
      token = login.body.token as string;
    } catch (error) {
      if (process.env.CI) throw error;
      dbAvailable = false;
    }
  }, 30000);

  afterAll(async () => {
    if (previousDemoEnabled === undefined) delete process.env.HAL_DEMO_LOGIN_ENABLED;
    else process.env.HAL_DEMO_LOGIN_ENABLED = previousDemoEnabled;
    if (previousDemoAccountId === undefined) delete process.env.HAL_DEMO_ACCOUNT_ID;
    else process.env.HAL_DEMO_ACCOUNT_ID = previousDemoAccountId;
    if (dbAvailable) {
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = $1', [buyerId]);
      await pool.query('DELETE FROM contractors WHERE id = $1', [buyerId]);
    }
    await pool.end().catch(() => {});
  });

  it('allows authenticated read requests for the configured buyer account', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const response = await request(app).get('/api/leads').set('Authorization', 'Bearer ' + token);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('rejects authenticated mutation requests and proves no lead was persisted', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const response = await request(app).post('/api/leads')
      .set('Authorization', 'Bearer ' + token)
      .send({ businessName: 'Must Not Be Created', city: 'Kampala', niche: 'security-test' });
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('DEMO_READ_ONLY');
    expect(response.headers['cache-control']).toBe('no-store');
    const persisted = await pool.query(
      'SELECT id FROM leads WHERE contractor_id = $1 AND business_name = $2',
      [buyerId, 'Must Not Be Created']
    );
    expect(persisted.rowCount).toBe(0);
  });
});
