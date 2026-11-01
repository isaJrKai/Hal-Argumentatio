import {
  ALLOWED_CRM_TRANSITIONS,
  canonicalizeStage,
  isKnownCrmStage,
  type CrmStage
} from './crmStateMachine';

export const CRM_BOARD_STAGES: CrmStage[] = [
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
];

export const DEFAULT_CRM_BOARD_STAGE_NAMES: Record<CrmStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  unresponsive: 'Unresponsive',
  qualified: 'Qualified',
  sal: 'Sales Accepted',
  proposal: 'Proposal',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  retained: 'Retained',
  churned: 'Churned',
  reactivated: 'Reactivated'
};

/** Convert supported legacy aliases to the canonical board stage. */
export function getCrmBoardStage(status: string | null | undefined): CrmStage | null {
  const normalized = canonicalizeStage(status || '');
  return isKnownCrmStage(normalized) ? normalized as CrmStage : null;
}

/** Return every next stage the CRM state machine permits from this stage. */
export function getAllowedCrmBoardStages(status: string | null | undefined): CrmStage[] {
  const current = getCrmBoardStage(status);
  return current ? [...(ALLOWED_CRM_TRANSITIONS[current] || [])] : [];
}

/** Return only a transition permitted by the CRM state machine. */
export function getAdjacentCrmBoardStage(
  status: string | null | undefined,
  direction: 'forward' | 'backward'
): CrmStage | null {
  const current = getCrmBoardStage(status);
  if (!current) return null;

  const allowed = ALLOWED_CRM_TRANSITIONS[current] || [];
  if (direction === 'forward') return allowed[0] || null;

  const currentIndex = CRM_BOARD_STAGES.indexOf(current);
  return allowed
    .filter(stage => CRM_BOARD_STAGES.indexOf(stage) < currentIndex)
    .sort((a, b) => CRM_BOARD_STAGES.indexOf(b) - CRM_BOARD_STAGES.indexOf(a))[0] || null;
}
