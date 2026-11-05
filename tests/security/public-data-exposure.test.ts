import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Public data exposure security', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

  it('does not expose internal lead notes, sales strategy, urgency or predicted LTV in public audit reports', () => {
    const start = source.indexOf("app.get('/api/public/audit/:id'");
    const end = source.indexOf("app.post('/api/public/audit/:id/book'", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const route = source.slice(start, end);
    expect(route).not.toContain('lead.notes');
    expect(route).not.toContain('lead.predictedLtv');
    expect(route).not.toContain('lead.urgencyScore');
    expect(route).not.toContain('outreachStrategy');
  });

  it('only serves published landing-page artifacts through public endpoints', () => {
    const jsonStart = source.indexOf("app.get('/api/public/landing/:id'");
    const htmlStart = source.indexOf("app.get('/landing/:id'");
    const htmlEnd = source.indexOf('// ─── CONTRACTOR LANDING PAGE STUDIO ENGINE', htmlStart);
    expect(jsonStart).toBeGreaterThanOrEqual(0);
    expect(htmlStart).toBeGreaterThan(jsonStart);
    const jsonRoute = source.slice(jsonStart, htmlStart);
    const htmlRoute = source.slice(htmlStart, htmlEnd);
    for (const route of [jsonRoute, htmlRoute]) {
      expect(route).toContain("inArray(hermesLabArtifacts.status, ['ready', 'deployed'])");
      expect(route).toContain("eq(hermesLabArtifacts.toolId, 'landing_page')");
    }
    expect(jsonRoute).toContain('hasOwnedLandingPageConfig(artifact)');
    expect(jsonRoute).toContain('id: hermesLabArtifacts.id');
    const publicProjection = jsonRoute.slice(jsonRoute.indexOf('return res.json({'));
    expect(publicProjection).not.toContain('contractorId');
    expect(htmlRoute).toContain('hasOwnedLandingPageConfig(artifact)');
  });

  it('never publishes arbitrary client-supplied HTML or unowned page configuration', () => {
    const saveStart = source.indexOf("app.post('/api/landing-pages/save'");
    const saveEnd = source.indexOf("app.get('/api/public/form/dispatch'", saveStart);
    expect(saveStart).toBeGreaterThanOrEqual(0);
    expect(saveEnd).toBeGreaterThan(saveStart);
    const saveRoute = source.slice(saveStart, saveEnd);
    expect(saveRoute).toContain('!pageConfig');
    expect(saveRoute).toContain('const ownedPageConfig = {');
    expect(saveRoute).toContain('eq(leads.contractorId, contractorId)');
    expect(saveRoute).toContain("status: 'draft'");
    expect(saveRoute).toContain('sourceLeadId: sourceLead?.id || null');
    expect(saveRoute).toContain('generateLandingPageHtml(ownedPageConfig)');
    expect(saveRoute).not.toContain('renderedHtml\n        });');

    const publishStart = source.indexOf("app.post('/api/landing-pages/:id/publish'");
    const publishEnd = source.indexOf("app.get('/api/public/form/dispatch'", publishStart);
    expect(publishStart).toBeGreaterThanOrEqual(0);
    expect(publishEnd).toBeGreaterThan(publishStart);
    const publishRoute = source.slice(publishStart, publishEnd);
    expect(publishRoute).toContain('req.body?.confirmPublish !== true');
    expect(publishRoute).toContain("sourceLead.verificationStatus !== 'VERIFIED'");
    expect(publishRoute).toContain("identityEvidence.businessIdentityConfirmed !== true");
    expect(publishRoute).toContain("status: 'deployed'");
  });
});
