import { describe, it, expect } from 'vitest';
import {
  calculateCpl,
  calculateCpq,
  calculateCostPerSal,
  calculateCostPerAppointment,
  calculateCac,
  calculateRoas,
  calculateMarginPct,
  calculateFunnelConversions,
  calculateMetricAccuracy,
  calculatePredictionAccuracy,
  calculateRevenueDelta,
  calculateRoasDelta,
  classifyOutcome
} from '../../src/lib/revenueMath';

describe('Unit: Revenue & Funnel Mathematical Invariants', () => {
  describe('Zero-Denominator & Edge Case Protection', () => {
    it('returns 0 for CPL when leads is 0 or negative', () => {
      expect(calculateCpl(1000, 0)).toBe(0);
      expect(calculateCpl(1000, -5)).toBe(0);
      expect(calculateCpl(0, 50)).toBe(0);
      expect(calculateCpl(-100, 50)).toBe(0);
    });

    it('returns 0 for CPQ when qualified leads is 0', () => {
      expect(calculateCpq(2500, 0)).toBe(0);
      expect(calculateCpq(0, 10)).toBe(0);
    });

    it('returns 0 for CAC when customer count is 0', () => {
      expect(calculateCac(5000, 0)).toBe(0);
      expect(calculateCac(0, 0)).toBe(0);
    });

    it('returns 0 for ROAS when spend is 0', () => {
      expect(calculateRoas(15000, 0)).toBe(0);
      expect(calculateRoas(0, 1000)).toBe(0);
    });

    it('returns 0 for margin when revenue is 0', () => {
      expect(calculateMarginPct(0, 500)).toBe(0);
    });
  });

  describe('Known Input/Output Vectors', () => {
    it('calculates deterministic funnel metrics correctly', () => {
      const spend = 10000;
      const leads = 200;
      const qualified = 100;
      const sal = 50;
      const appointments = 25;
      const customers = 10;
      const revenue = 45000;

      // CPL: $10,000 / 200 = $50.00
      expect(calculateCpl(spend, leads)).toBe(50);

      // CPQ: $10,000 / 100 = $100.00
      expect(calculateCpq(spend, qualified)).toBe(100);

      // CP-SAL: $10,000 / 50 = $200.00
      expect(calculateCostPerSal(spend, sal)).toBe(200);

      // CP-Appt: $10,000 / 25 = $400.00
      expect(calculateCostPerAppointment(spend, appointments)).toBe(400);

      // CAC: $10,000 / 10 = $1,000.00
      expect(calculateCac(spend, customers)).toBe(1000);

      // ROAS: $45,000 / $10,000 = 4.5x
      expect(calculateRoas(revenue, spend)).toBe(4.5);

      // Margin: ($45,000 - $10,000) / $45,000 = 77.78%
      expect(calculateMarginPct(revenue, spend)).toBe(77.78);
    });

    it('calculates stage-to-stage funnel conversion percentages', () => {
      const counts = {
        clicks: 1000,
        leads: 100,
        qualified: 50,
        sal: 25,
        appointments: 10,
        customers: 5
      };

      const conversions = calculateFunnelConversions(counts);
      expect(conversions.clickToLead).toBe(10); // 100/1000 = 10%
      expect(conversions.leadToQualified).toBe(50); // 50/100 = 50%
      expect(conversions.qualifiedToSal).toBe(50); // 25/50 = 50%
      expect(conversions.salToAppointment).toBe(40); // 10/25 = 40%
      expect(conversions.appointmentToCustomer).toBe(50); // 5/10 = 50%
      expect(conversions.overallLeadToCustomer).toBe(5); // 5/100 = 5%
    });
  });

  describe('Outcome & Prediction Accuracy Math', () => {
    it('computes symmetric metric accuracy bound to [0, 1]', () => {
      expect(calculateMetricAccuracy(100, 100)).toBe(1.0);
      expect(calculateMetricAccuracy(100, 90)).toBe(0.9);
      expect(calculateMetricAccuracy(100, 110)).toBe(0.9);
      expect(calculateMetricAccuracy(100, 0)).toBe(0);
      expect(calculateMetricAccuracy(100, 300)).toBe(0); // Over-deviation bounded to 0
    });

    it('calculates composite accuracy between revenue and ROAS', () => {
      // Expected: $10,000 rev, 4.0 roas. Actual: $9,000 rev, 3.8 roas
      // Rev acc = 0.9, ROAS acc = 1 - (0.2 / 4.0) = 0.95. Mean = 0.925
      const acc = calculatePredictionAccuracy(10000, 9000, 4.0, 3.8);
      expect(acc).toBe(0.925);
    });

    it('classifies outcomes into deterministic categories', () => {
      expect(classifyOutcome(0.90, 10000, 9500, 'evaluated')).toBe('successful');
      expect(classifyOutcome(0.70, 10000, 8000, 'evaluated')).toBe('partially_successful');
      expect(classifyOutcome(0.50, 10000, 5000, 'evaluated')).toBe('neutral');
      expect(classifyOutcome(0.30, 10000, 2000, 'evaluated')).toBe('failed');
      expect(classifyOutcome(0.95, 10000, 9500, 'pending_observation')).toBe('insufficient_data');
    });
  });
});
