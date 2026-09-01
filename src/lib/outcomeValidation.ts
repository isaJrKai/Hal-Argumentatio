/**
 * HAL Phase 6D: Outcome Validation & Guardrails Helper
 * Validates revenue outcome payloads, enforces observation window rules, and guards against division by zero.
 */

import { calculateMetricAccuracy, calculatePredictionAccuracy, classifyOutcome } from './revenueMath';

export interface OutcomeValidationInput {
  expectedRevenue: number;
  actualRevenue: number;
  expectedRoas: number;
  actualRoas: number;
  observationStart: string | Date;
  observationEnd: string | Date;
  status: string;
}

export interface OutcomeValidationResult {
  isValid: boolean;
  errors: string[];
  validatedStatus: string;
  predictionAccuracy: number;
  classification: string;
}

/**
 * Validates incoming outcome payload and computes deterministic metrics.
 */
export function validateAndProcessOutcome(input: OutcomeValidationInput): OutcomeValidationResult {
  const errors: string[] = [];
  const now = new Date();
  const obsStart = new Date(input.observationStart);
  const obsEnd = new Date(input.observationEnd);

  if (isNaN(obsStart.getTime()) || isNaN(obsEnd.getTime())) {
    errors.push('Invalid observation start or end timestamp.');
  }

  if (obsEnd <= obsStart) {
    errors.push('Observation end must be strictly after observation start.');
  }

  // Check observation window rule: Cannot be 'measured' or 'evaluated' if now < obsEnd
  let validatedStatus = input.status;
  if (now < obsEnd && (validatedStatus === 'measured' || validatedStatus === 'evaluated')) {
    errors.push(`Status '${validatedStatus}' is invalid while observation window is still active (ends ${obsEnd.toISOString()}). Forcing status to 'pending_observation'.`);
    validatedStatus = 'pending_observation';
  }

  // Guard against division by zero during accuracy calculations
  const expectedRev = Math.max(0, input.expectedRevenue);
  const actualRev = Math.max(0, input.actualRevenue);
  const expectedRoas = Math.max(0, input.expectedRoas);
  const actualRoas = Math.max(0, input.actualRoas);

  const predictionAccuracy = calculatePredictionAccuracy(expectedRev, actualRev, expectedRoas, actualRoas);
  const classification = classifyOutcome(predictionAccuracy, expectedRev, actualRev, validatedStatus);

  return {
    isValid: errors.length === 0,
    errors,
    validatedStatus,
    predictionAccuracy,
    classification
  };
}
