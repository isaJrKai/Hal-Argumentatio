import { describe, expect, it } from 'vitest';
import { autoRemediateGate, auditLandingPage } from '../../src/services/landingQualityGate';
import { TRADE_TEMPLATES } from '../../src/components/landing/templates';

describe('landing page quality gate evidence boundaries', () => {
  it('never auto-verifies reviews or invents license credentials', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.plumbing));
    config.licenseNumber = '';
    config.sections.reviews.items = [{ id: 'review-1', name: 'Customer', location: 'Kampala', date: '', stars: 5, text: 'Example review', verified: false }];
    const fixed = autoRemediateGate(config, 'proof_specificity');

    expect(fixed.licenseNumber).toBe('');
    expect(fixed.sections.reviews.items[0].verified).toBe(false);
  });

  it('uses neutral copy when repairing missing hero content', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.plumbing));
    config.licenseNumber = '';
    config.sections.hero.headline = '';
    config.sections.hero.subheadline = '';
    const fixed = autoRemediateGate(config, 'above_the_fold');

    expect(fixed.sections.hero.headline).toContain('Professional');
    expect(fixed.sections.hero.subheadline).toContain('Contact');
    expect(fixed.sections.hero.subheadline).not.toContain('100%');
    expect(fixed.licenseNumber).toBe('');
  });

  it('does not invent a phone number or claim crews are on duty', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.plumbing));
    config.phone = '';
    const fixed = autoRemediateGate(config, 'mobile_readiness');

    expect(fixed.sections.sticky_mobile_call.buttonText).not.toContain('800');
    expect(fixed.sections.sticky_mobile_call.crewStatus).toContain('Confirm availability');
  });

  it('does not claim WCAG, mobile, motion, or performance checks passed without measurements', () => {
    const report = auditLandingPage(TRADE_TEMPLATES.plumbing);
    const byId = new Map(report.gates.map(gate => [gate.id, gate]));

    expect(byId.get('a11y_contrast')?.status).toBe('warning');
    expect(byId.get('purposeful_motion')?.status).toBe('warning');
    expect(byId.get('performance_seo')?.status).toBe('warning');
    expect(report.readyToPublish).toBe(false);
  });
});
