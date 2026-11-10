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
const tenantA = `prospect_flow_a_${suffix}`;
const tenantB = `prospect_flow_b_${suffix}`;
const emailA = `${tenantA}@example.test`;
const emailB = `${tenantB}@example.test`;
const password = 'Prospect-Flow-Test-Password-42!';
const artifactId = `lp_test_${suffix}`;
let dbAvailable = false;
let tokenA = '';
let tokenB = '';

async function login(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  return response.body.token as string;
}

const pageConfig = {
  title: 'Prospect flow test page',
  trade: 'general',
  businessName: 'Fixture Prospect Services',
  city: 'Kampala',
  phone: '+256700000000',
  licenseNumber: '',
  emergencyService: false,
  dispatchWindow: '',
  branding: {
    colorPreset: 'paper_ink',
    primaryColor: '#14532d',
    secondaryColor: '#172554',
    accentColor: '#f59e0b',
    fontStyle: 'modern_sans',
    logoText: 'Fixture Prospect Services'
  },
  sectionOrder: [],
  sections: {
    announcement_bar: { active: false, text: '', urgencyBadge: '' },
    header: { active: false, ctaText: '' },
    hero: { active: false, headline: '', subheadline: '', badgeText: '' },
    lead_form: { active: false, title: '', subtitle: '', buttonText: '', dispatchNote: '' },
    trust_bar: { active: false, badges: [] },
    services: { active: false, title: '', subtitle: '', items: [] },
    seasonal_alert: { active: false, tag: '', title: '', description: '', bulletPoints: [] },
    before_after: { active: false, title: '', subtitle: '', items: [] },
    reviews: { active: false, title: '', subtitle: '', rating: 0, totalReviews: 0, items: [] },
    service_areas: { active: false, title: '', subtitle: '', cities: [], guaranteeText: '' },
    guarantee: { active: false, badgeText: '', title: '', description: '', ctaText: '' },
    online_booking: { active: false, title: '', description: '', bookingUrl: '', buttonText: '' },
    faq: { active: false, title: '', items: [] },
    sticky_mobile_call: { active: false, crewStatus: '', buttonText: '' },
    footer: { active: false, address: '', copyright: '' }
  },
  seo: { metaTitle: 'Fixture Prospect Services', metaDescription: 'Test artifact only', schemaType: 'LocalBusiness' }
};

describe('upstream prospect import and landing-page artifact persistence', () => {
  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      await bootstrapPostgresTables(pool);
      dbAvailable = true;
      const passwordHash = hashPassword(password);
      await pool.query(
        `INSERT INTO contractors (id, company_name, email, city, service_type, role, password_hash)
         VALUES ($1, 'Prospect Flow Tenant A', $2, 'Kampala', 'General Services', 'user', $3),
                ($4, 'Prospect Flow Tenant B', $5, 'Kampala', 'General Services', 'user', $3)`,
        [tenantA, emailA, passwordHash, tenantB, emailB]
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
      await pool.query('DELETE FROM work_tasks WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM hermes_lab_artifacts WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM lead_events WHERE lead_id IN (SELECT id FROM leads WHERE contractor_id = ANY($1::text[]))', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM audit_logs WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM leads WHERE contractor_id = ANY($1::text[])', [[tenantA, tenantB]]);
      await pool.query('DELETE FROM contractors WHERE id = ANY($1::text[])', [[tenantA, tenantB]]);
    }
    await pool.end().catch(() => {});
  });

  it('imports a deterministic fixture once, queues human review, and keeps the lead tenant-scoped', async (ctx) => {
    if (!dbAvailable) return ctx.skip();
    const fixture = {
      businessName: 'Fixture Prospect Services',
      city: 'Kampala',
      serviceType: 'general services',
      sourceType: 'test_fixture',
      isSynthetic: true,
      websiteUrl: 'https://example.test',
      verificationStatus: 'UNVERIFIED_STAGING',
      dnsVerified: false
    };

    const first = await request(app)
      .post('/api/leads/ingest')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ leads: [fixture] });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ success: true, count: 1, queuedTasks: 1, skippedCount: 0 });
    const leadId = first.body.leads[0].id as string;

    const duplicate = await request(app)
      .post('/api/leads/ingest')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ leads: [fixture] });
    expect(duplicate.status).toBe(200);
    expect(duplicate.body).toMatchObject({ success: true, count: 0, queuedTasks: 0, skippedCount: 1 });

    const stored = await pool.query(
      'SELECT contractor_id, business_name, verification_status, dns_verified FROM leads WHERE id = $1',
      [leadId]
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]).toMatchObject({
      contractor_id: tenantA,
      business_name: 'Fixture Prospect Services',
      verification_status: 'UNVERIFIED_STAGING',
      dns_verified: false
    });

    const task = await pool.query(
      'SELECT contractor_id, entity_id, status, assigned_worker FROM work_tasks WHERE contractor_id = $1 AND entity_id = $2',
      [tenantA, leadId]
    );
    expect(task.rows).toHaveLength(1);
    expect(task.rows[0]).toMatchObject({ contractor_id: tenantA, entity_id: leadId, status: 'queued', assigned_worker: 'human' });

    const tenantBLeads = await request(app).get('/api/leads').set('Authorization', `Bearer ${tokenB}`);
    expect(tenantBLeads.status).toBe(200);
    expect(tenantBLeads.body.map((lead: { id: string }) => lead.id)).not.toContain(leadId);
  });

  it('saves and reloads a tenant-owned landing-page artifact without exposing it to another tenant', async (ctx) => {
    if (!dbAvailable) return ctx.skip();

    const saved = await request(app)
      .post('/api/landing-pages/save')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: artifactId, title: 'Prospect flow test page', pageConfig });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ success: true, id: artifactId, contractorId: tenantA });
    expect(saved.body.liveUrl).toBe(`/landing/${artifactId}`);

    const tenantAArtifacts = await request(app)
      .get('/api/hermes/artifacts')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(tenantAArtifacts.status).toBe(200);
    const stored = tenantAArtifacts.body.artifacts.find((artifact: { id: string }) => artifact.id === artifactId);
    expect(stored).toBeTruthy();
    expect(stored).toMatchObject({
      id: artifactId,
      contractorId: tenantA,
      toolId: 'landing_page',
      title: 'Prospect flow test page',
      status: 'ready'
    });
    expect(stored.content.pageConfig.businessName).toBe('Fixture Prospect Services');
    expect(stored.content.renderedOutput).toContain('Fixture Prospect Services');

    const tenantBArtifacts = await request(app)
      .get('/api/hermes/artifacts')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(tenantBArtifacts.status).toBe(200);
    expect(tenantBArtifacts.body.artifacts.map((artifact: { id: string }) => artifact.id)).not.toContain(artifactId);

    const persisted = await pool.query(
      'SELECT contractor_id, tool_id, status FROM hermes_lab_artifacts WHERE id = $1',
      [artifactId]
    );
    expect(persisted.rows).toEqual([{ contractor_id: tenantA, tool_id: 'landing_page', status: 'ready' }]);
  });
});
