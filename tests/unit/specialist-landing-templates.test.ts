import { describe, expect, it } from 'vitest';
import { TRADE_TEMPLATES } from '../../src/components/landing/templates';

describe('specialist contractor landing templates', () => {
  const specialistTrades = ['sump_pump', 'waterproofing', 'flood_restoration', 'emergency_dispatch'];

  it('provides a complete template for every requested specialist trade', () => {
    for (const trade of specialistTrades) {
      const template = TRADE_TEMPLATES[trade];
      expect(template).toBeDefined();
      expect(template.trade).toBe(trade);
      expect(template.sections.hero.headline.length).toBeGreaterThan(10);
      expect(template.sections.services.items.length).toBeGreaterThan(0);
      expect(template.sections.lead_form.active).toBe(true);
    }
  });

  it('does not seed fabricated proof, prices, service areas, or customer reviews', () => {
    for (const trade of specialistTrades) {
      const template = TRADE_TEMPLATES[trade];
      expect(template.sections.reviews.active).toBe(false);
      expect(template.sections.reviews.items).toEqual([]);
      expect(template.sections.reviews.totalReviews).toBe(0);
      expect(template.sections.service_areas.active).toBe(false);
      expect(template.sections.service_areas.cities).toEqual([]);
      expect(template.sections.pricing_packages?.active).toBe(false);
      expect(template.sections.pricing_packages?.items).toEqual([]);
      expect(template.licenseNumber).toMatch(/Add verified/i);
      expect(template.phone).toBe('');
    }
  });

  it('keeps example contact and availability claims disabled until the owner configures them', () => {
    for (const trade of specialistTrades) {
      const template = TRADE_TEMPLATES[trade];
      expect(template.sections.announcement_bar.active).toBe(false);
      expect(template.sections.trust_bar.active).toBe(false);
      expect(template.sections.sticky_mobile_call.active).toBe(false);
      expect(template.sections.online_booking.active).toBe(false);
      expect(template.sections.before_after.items).toEqual([]);
    }
  });
});
