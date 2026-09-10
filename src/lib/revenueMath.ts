/**
 * HAL Phase 6D: Deterministic Revenue Math & Metrics Utility
 * Centralizes auditable mathematical formulas strictly separated from AI logic.
 */

export interface MetricPrediction {
  expected: number;
  actual: number;
}

export interface OutcomeClassificationResult {
  accuracy: number;
  classification: 'successful' | 'partially_successful' | 'neutral' | 'failed' | 'insufficient_data';
  revenueDelta: number;
  roasDelta: number;
}

/**
 * Calculates prediction accuracy for a single metric with division-by-zero protection.
 * Formula: 1 - abs(expected - actual) / abs(expected)
 */
export function calculateMetricAccuracy(expected: number, actual: number): number {
  if (expected === 0 && actual === 0) return 1.0;
  if (expected === 0) return 0.0;
  const error = Math.abs(expected - actual) / Math.abs(expected);
  const accuracy = 1 - error;
  return Math.max(0, Math.min(1, accuracy));
}

/**
 * Calculates composite prediction accuracy across revenue and ROAS.
 */
export function calculatePredictionAccuracy(
  expectedRevenue: number,
  actualRevenue: number,
  expectedRoas: number,
  actualRoas: number
): number {
  const revAcc = calculateMetricAccuracy(expectedRevenue, actualRevenue);
  const roasAcc = calculateMetricAccuracy(expectedRoas, actualRoas);
  return Number(((revAcc + roasAcc) / 2).toFixed(4));
}

/**
 * Calculates revenue delta (Actual - Expected).
 */
export function calculateRevenueDelta(expectedRevenue: number, actualRevenue: number): number {
  return Number((actualRevenue - expectedRevenue).toFixed(2));
}

/**
 * Calculates ROAS delta (Actual - Expected).
 */
export function calculateRoasDelta(expectedRoas: number, actualRoas: number): number {
  return Number((actualRoas - expectedRoas).toFixed(2));
}

/**
 * Determines outcome classification based on deterministic thresholds.
 * Thresholds:
 * - successful: accuracy >= 0.85 AND actualRevenue >= expectedRevenue * 0.90
 * - partially_successful: accuracy >= 0.60
 * - neutral: accuracy >= 0.40
 * - failed: accuracy < 0.40
 * - insufficient_data: if status is pending or missing
 */
export function classifyOutcome(
  predictionAccuracy: number,
  expectedRevenue: number,
  actualRevenue: number,
  status: string
): 'successful' | 'partially_successful' | 'neutral' | 'failed' | 'insufficient_data' {
  if (status === 'pending_observation' || status === 'observing') {
    return 'insufficient_data';
  }
  if (predictionAccuracy >= 0.85 && actualRevenue >= expectedRevenue * 0.90) {
    return 'successful';
  } else if (predictionAccuracy >= 0.60) {
    return 'partially_successful';
  } else if (predictionAccuracy >= 0.40) {
    return 'neutral';
  } else if (status === 'evaluated' || status === 'measured') {
    return 'failed';
  }
  return 'insufficient_data';
}

/**
 * Funnel stage counts for rate calculation
 */
export interface FunnelCounts {
  impressions?: number;
  clicks?: number;
  leads: number;
  qualified: number;
  sal: number;
  appointments: number;
  opportunities?: number;
  customers: number;
}

/**
 * Calculates Cost Per Lead (CPL) with zero-denominator protection.
 */
export function calculateCpl(spend: number, leads: number): number {
  if (!leads || leads <= 0 || !spend || spend <= 0) return 0;
  return Number((spend / leads).toFixed(2));
}

/**
 * Calculates Cost Per Qualified Lead (CPQ) with zero-denominator protection.
 */
export function calculateCpq(spend: number, qualified: number): number {
  if (!qualified || qualified <= 0 || !spend || spend <= 0) return 0;
  return Number((spend / qualified).toFixed(2));
}

/**
 * Calculates Cost Per Sales Accepted Lead (CP-SAL) with zero-denominator protection.
 */
export function calculateCostPerSal(spend: number, sal: number): number {
  if (!sal || sal <= 0 || !spend || spend <= 0) return 0;
  return Number((spend / sal).toFixed(2));
}

/**
 * Calculates Cost Per Appointment with zero-denominator protection.
 */
export function calculateCostPerAppointment(spend: number, appointments: number): number {
  if (!appointments || appointments <= 0 || !spend || spend <= 0) return 0;
  return Number((spend / appointments).toFixed(2));
}

/**
 * Calculates Customer Acquisition Cost (CAC) with zero-denominator protection.
 */
export function calculateCac(spend: number, customers: number): number {
  if (!customers || customers <= 0 || !spend || spend <= 0) return 0;
  return Number((spend / customers).toFixed(2));
}

/**
 * Calculates Return on Ad Spend (ROAS) with zero-denominator protection.
 */
export function calculateRoas(revenue: number, spend: number): number {
  if (!spend || spend <= 0 || !revenue || revenue <= 0) return 0;
  return Number((revenue / spend).toFixed(2));
}

/**
 * Calculates Net / Gross Margin Percentage.
 */
export function calculateMarginPct(revenue: number, costs: number): number {
  if (!revenue || revenue <= 0) return 0;
  return Number((((revenue - costs) / revenue) * 100).toFixed(2));
}

/**
 * Calculates stage-to-stage conversion rates across the 7-stage revenue funnel.
 */
export function calculateFunnelConversions(counts: FunnelCounts) {
  const clickToLead = counts.clicks && counts.clicks > 0 ? Number(((counts.leads / counts.clicks) * 100).toFixed(2)) : 0;
  const leadToQualified = counts.leads > 0 ? Number(((counts.qualified / counts.leads) * 100).toFixed(2)) : 0;
  const qualifiedToSal = counts.qualified > 0 ? Number(((counts.sal / counts.qualified) * 100).toFixed(2)) : 0;
  const salToAppointment = counts.sal > 0 ? Number(((counts.appointments / counts.sal) * 100).toFixed(2)) : 0;
  const appointmentToCustomer = counts.appointments > 0 ? Number(((counts.customers / counts.appointments) * 100).toFixed(2)) : 0;
  const overallLeadToCustomer = counts.leads > 0 ? Number(((counts.customers / counts.leads) * 100).toFixed(2)) : 0;

  return {
    clickToLead,
    leadToQualified,
    qualifiedToSal,
    salToAppointment,
    appointmentToCustomer,
    overallLeadToCustomer
  };
}

