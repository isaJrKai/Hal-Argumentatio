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
