export type CrmStage = 
  | 'new'
  | 'contacted'
  | 'unresponsive'
  | 'qualified'
  | 'sal'
  | 'proposal'
  | 'customer'
  | 'closed_won'
  | 'closed_lost'
  | 'converted'
  | 'dead'
  | 'retained'
  | 'churned'
  | 'reactivated';

/**
 * Stage synonyms mapping UI-facing and CRM-specific aliases to canonical stages
 */
export const STAGE_SYNONYMS: Record<string, string> = {
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

export function canonicalizeStage(stage: string): string {
  const s = (stage || 'new').toLowerCase().trim();
  return STAGE_SYNONYMS[s] || s;
}

/**
 * Canonical Commercial Pipeline State Machine Matrix
 * Enforces business progression invariants and prevents arbitrary pipeline jumps.
 */
export const ALLOWED_CRM_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'qualified', 'unresponsive', 'closed_lost', 'dead'],
  contacted: ['qualified', 'unresponsive', 'proposal', 'closed_lost', 'dead'],
  unresponsive: ['contacted', 'closed_lost', 'dead', 'reactivated'],
  qualified: ['sal', 'proposal', 'closed_lost', 'dead'],
  sal: ['proposal', 'closed_lost', 'dead'],
  proposal: ['customer', 'closed_won', 'converted', 'closed_lost', 'dead', 'contacted'],
  customer: ['retained', 'churned', 'contacted', 'closed_lost', 'dead'],
  closed_won: ['retained', 'churned', 'contacted', 'closed_lost', 'dead'],
  converted: ['retained', 'churned', 'contacted', 'closed_lost', 'dead'],
  closed_lost: ['reactivated'],
  dead: ['reactivated'],
  retained: ['churned', 'contacted'],
  churned: ['reactivated'],
  reactivated: ['contacted', 'qualified', 'proposal']
};

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether transitioning from currentStage to nextStage conforms to CRM pipeline invariants.
 */
export function validateCrmTransition(currentStage: string, nextStage: string): TransitionValidationResult {
  const currentRaw = (currentStage || 'new').toLowerCase().trim();
  const nextRaw = (nextStage || '').toLowerCase().trim();

  // No-op transition is always valid
  if (currentRaw === nextRaw) {
    return { valid: true };
  }

  const currentCanonical = canonicalizeStage(currentRaw);
  const nextCanonical = canonicalizeStage(nextRaw);

  if (currentCanonical === nextCanonical) {
    return { valid: true };
  }

  const allowedTargets = ALLOWED_CRM_TRANSITIONS[currentRaw] || ALLOWED_CRM_TRANSITIONS[currentCanonical];
  if (!allowedTargets) {
    // If unknown origin stage, allow transition to known standard stages to permit recovery
    return { valid: true };
  }

  const isDirectlyAllowed = allowedTargets.includes(nextRaw) || allowedTargets.includes(nextCanonical);
  if (!isDirectlyAllowed) {
    return {
      valid: false,
      reason: `Illegal CRM pipeline transition from "${currentStage}" to "${nextStage}". Permitted targets: [${allowedTargets.join(', ')}]`
    };
  }

  return { valid: true };
}

