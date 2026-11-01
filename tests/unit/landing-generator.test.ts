import { describe, expect, it } from 'vitest';
import { applyVerifiedBusinessDetails } from '../../src/services/landingGenerator';
import { TRADE_TEMPLATES } from '../../src/components/landing/templates';
import { generateLandingPageHtml } from '../../src/components/landing/htmlGenerator';
import { generateLandingPageTsx } from '../../src/components/landing/tsxGenerator';
import * as ts from 'typescript';

const clonePlumbingTemplate = () =>
  JSON.parse(JSON.stringify(TRADE_TEMPLATES.plumbing));

const businessDetails = {
  businessName: 'Dry Basement Co',
  city: 'Toronto',
  phone: '+14165550123',
  address: '123 Queen Street West',
  trade: 'sump_pump' as const,
  prompt: 'Sump pump installation, repair and battery backup services.'
};

describe('contractor landing page factual normalization', () => {
  it('replaces demo identity and removes unverified template claims when AI copy is unavailable', () => {
    const config = applyVerifiedBusinessDetails(clonePlumbingTemplate(), { ...businessDetails, trade: 'plumbing' }, false);

    expect(config.businessName).toBe('Dry Basement Co');
    expect(config.city).toBe('Toronto');
    expect(config.phone).toBe('+14165550123');
    expect(config.branding.logoText).toBe('Dry Basement Co');
    expect(config.licenseNumber).toBe('');
    expect(config.sections.header.ctaText).toBe('Call +14165550123');
    expect(config.sections.footer.address).toBe('123 Queen Street West');
    expect(config.sections.hero.headline).toBe('Plumbing Services in Toronto');
    expect(config.sections.services.items).toHaveLength(1);
    expect(config.sections.services.items[0].title).toBe('Plumbing Enquiries');
    expect(config.sections.trust_bar.active).toBe(false);
    expect(config.sections.reviews.active).toBe(false);
    expect(config.sections.reviews.items).toHaveLength(0);
    expect(config.sections.pricing_packages?.active).toBe(false);
    expect(config.sections.guarantee.active).toBe(false);
    expect(config.sections.online_booking.active).toBe(false);
    expect(config.sections.faq.active).toBe(false);
    expect(JSON.stringify(config)).not.toContain('APEX PLUMBING');
    expect(JSON.stringify(config)).not.toContain('(403) 555-0199');
    expect(JSON.stringify(config)).not.toContain('12,000+');
  });

  it('preserves valid AI-generated copy while keeping verified identity authoritative', () => {
    const template = clonePlumbingTemplate();
    template.title = 'A tailored title for the contractor';
    template.sections.hero.headline = 'Keep Toronto basements dry with a properly sized sump pump';
    template.sections.hero.subheadline = 'Installation and repair options based on the property and drainage requirements.';
    template.sections.services.items = [
      {
        id: 's1',
        title: 'Sump pump installation',
        description: 'Assess the basement and install a pump suited to the property.',
        priceEstimate: '$299',
        badge: 'Best value'
      }
    ];
    template.seo.metaTitle = 'Dry Basement Co | Toronto Sump Pump Services';

    const config = applyVerifiedBusinessDetails(template, businessDetails, true);

    expect(config.title).toBe('Dry Basement Co — Sump Pump Services in Toronto');
    expect(config.sections.hero.headline).toBe('Keep Toronto basements dry with a properly sized sump pump');
    expect(config.sections.hero.subheadline).toContain('property and drainage');
    expect(config.sections.services.items[0].title).toBe('Sump pump installation');
    expect(config.sections.services.items[0].priceEstimate).toBeUndefined();
    expect(config.sections.services.items[0].badge).toBeUndefined();
    expect(config.seo.metaTitle).toBe('Dry Basement Co | Toronto Sump Pump Services');
    expect(config.businessName).toBe('Dry Basement Co');
    expect(config.city).toBe('Toronto');
    expect(config.phone).toBe('+14165550123');
  });
  it('keeps curated specialist service content when AI is unavailable', () => {
    const specialist = JSON.parse(JSON.stringify(TRADE_TEMPLATES.sump_pump));
    const config = applyVerifiedBusinessDetails(specialist, {
      ...businessDetails,
      trade: 'sump_pump'
    }, false);

    expect(config.sections.hero.headline).toBe('Sump pump installation, repair and maintenance');
    expect(config.sections.services.items.length).toBeGreaterThan(1);
    expect(config.sections.services.items[0].title).toBe('Sump pump installation');
    expect(config.sections.reviews.active).toBe(false);
    expect(config.sections.service_areas.active).toBe(false);
  });

  it('renders only approved illustrative hero photography and omits a fabricated canonical URL', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.roofing));
    const html = generateLandingPageHtml(config);

    expect(html).toContain('https://images.unsplash.com/photo-1632759145351-1d592919f522');
    expect(html).toContain('Illustrative image');
    expect(html).not.toContain('https://hal.ai/landing/');
  });

  it('rejects non-HTTPS or non-approved hero image hosts', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.roofing));
    config.sections.hero.heroImageUrl = 'javascript:alert(1)';
    const html = generateLandingPageHtml(config);

    expect(html).not.toContain('javascript:alert(1)');
    expect(html).not.toContain('<img src="javascript:');
  });

  it('exports syntactically valid React TSX and does not report failed lead submissions as successful', () => {
    const config = JSON.parse(JSON.stringify(TRADE_TEMPLATES.roofing));
    config.businessName = 'North Ridge Roofing';
    config.city = 'Denver';
    config.phone = '';
    config.contractorId = 'contractor-test';
    config.sections.lead_form.buttonText = 'Request a quote';
    const source = generateLandingPageTsx(config);
    const result = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext
      }
    });
    const errors = (result.diagnostics || []).filter(
      diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
    );

    expect(errors).toHaveLength(0);
    expect(source).toContain("if (!res.ok) throw new Error");
    expect(source).toContain("setSubmitError");
    expect(source).not.toContain("Our on-duty dispatcher is routing a technician");
  });

});
