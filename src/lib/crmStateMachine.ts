export type CrmStage =
  | 'new'
  | 'contacted'
  | 'unresponsive'
  | 'qualified'
  | 'sal'
  | 'proposal'
  | 'closed_won'
  | 'closed_lost'
  | 'retained'
  | 'churned'
  | 'reactivated';

/**
 * Legacy/UI aliases are normalized before transition validation.
 * Keep this map explicit so old records remain readable without allowing
 * arbitrary unknown states to bypass the state machine.
 */
export const STAGE_SYNONYMS: Record<string, CrmStage> = {
  converted: 'closed_won',
  won: 'closed_won',
  customer: 'closed_won',
  dead: 'closed_lost',
  lost: 'closed_lost',
  appointment: 'proposal',
  booked: 'proposal',
  opportunity: 'proposal',
  estimate: 'proposal'
};

const CANONICAL_STAGES = new Set<CrmStage>([
  'new',
  'contacted',
  'unresponsive',
  'qualified',
  'sal',
  'proposal',
  'closed_won',
  'closed_lost',
  'retained',
  'churned',
  'reactivated'
]);

export function canonicalizeStage(stage: string): string {
  const normalized = (stage || '').toLowerCase().trim();
  if (!normalized) return '';
  return STAGE_SYNONYMS[normalized] || normalized;
}

export function isKnownCrmStage(stage: string): boolean {
  return CANONICAL_STAGES.has(canonicalizeStage(stage) as CrmStage);
}

/**
 * Canonical commercial pipeline transition matrix.
 * Aliases are normalized before lookup; unknown values fail closed.
 */
export const ALLOWED_CRM_TRANSITIONS: Record<CrmStage, CrmStage[]> = {
  new: ['contacted', 'qualified', 'unresponsive', 'closed_lost'],
  contacted: ['qualified', 'unresponsive', 'proposal', 'closed_lost'],
  unresponsive: ['contacted', 'closed_lost', 'reactivated'],
  qualified: ['sal', 'proposal', 'closed_lost'],
  sal: ['proposal', 'closed_lost'],
  proposal: ['closed_won', 'closed_lost', 'contacted'],
  closed_won: ['retained', 'churned', 'contacted', 'closed_lost'],
  closed_lost: ['reactivated'],
  retained: ['churned', 'contacted'],
  churned: ['reactivated'],
  reactivated: ['contacted', 'qualified', 'proposal']
};

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a CRM transition after canonicalizing supported legacy aliases.
 * Same-stage no-ops are allowed, but unknown stages cannot be used as a
 * recovery bypass. Legacy data should be normalized explicitly by migration
 * or an authorized repair workflow.
 */
export function validateCrmTransition(currentStage: string, nextStage: string): TransitionValidationResult {
  const currentRaw = (currentStage || '').toLowerCase().trim();
  const nextRaw = (nextStage || '').toLowerCase().trim();

  if (!currentRaw || !nextRaw) {
    return { valid: false, reason: 'Both current and next CRM stages are required.' };
  }

  const currentCanonical = canonicalizeStage(currentRaw);
  const nextCanonical = canonicalizeStage(nextRaw);

  if (currentCanonical === nextCanonical) {
    // Preserve idempotent updates for an unchanged legacy value, but never
    // treat a change to an unknown state as a valid transition.
    if (currentRaw === nextRaw) return { valid: true };
    if (isKnownCrmStage(currentCanonical)) return { valid: true };
  }

  if (!isKnownCrmStage(currentCanonical)) {
    return {
      valid: false,
      reason: `Unknown current CRM stage "${currentStage}". Normalize the legacy stage before transitioning it.`
    };
  }

  if (!isKnownCrmStage(nextCanonical)) {
    return {
      valid: false,
      reason: `Unknown target CRM stage "${nextStage}".`
    };
  }

  const allowedTargets = ALLOWED_CRM_TRANSITIONS[currentCanonical as CrmStage];
  if (!allowedTargets.includes(nextCanonical as CrmStage)) {
    return {
      valid: false,
      reason: `Illegal CRM pipeline transition from "${currentStage}" to "${nextStage}". Permitted targets: [${allowedTargets.join(', ')}]`
    };
  }

  return { valid: true };
}
