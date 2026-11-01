import { describe, expect, it } from 'vitest';
import { getAdjacentCrmBoardStage, getCrmBoardStage, CRM_BOARD_STAGES } from '../../src/lib/crmBoard';

describe('CRM board stages', () => {
  it('includes every canonical CRM stage', () => {
    expect(CRM_BOARD_STAGES).toHaveLength(11);
    expect(CRM_BOARD_STAGES).toContain('proposal');
    expect(CRM_BOARD_STAGES).toContain('closed_won');
    expect(CRM_BOARD_STAGES).toContain('reactivated');
  });

  it('normalizes supported legacy statuses', () => {
    expect(getCrmBoardStage('converted')).toBe('closed_won');
    expect(getCrmBoardStage('dead')).toBe('closed_lost');
  });

  it('returns null for unknown or missing stages', () => {
    expect(getCrmBoardStage('mystery-stage')).toBeNull();
    expect(getCrmBoardStage(null)).toBeNull();
  });

  it('uses only transitions permitted by the CRM state machine', () => {
    expect(getAdjacentCrmBoardStage('new', 'forward')).toBe('contacted');
    expect(getAdjacentCrmBoardStage('contacted', 'forward')).toBe('qualified');
    expect(getAdjacentCrmBoardStage('proposal', 'forward')).toBe('closed_won');
    expect(getAdjacentCrmBoardStage('proposal', 'backward')).toBe('contacted');
    expect(getAdjacentCrmBoardStage('new', 'backward')).toBeNull();
    expect(getAdjacentCrmBoardStage('mystery-stage', 'forward')).toBeNull();
  });
});
