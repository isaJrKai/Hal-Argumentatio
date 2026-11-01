export interface LeadValueEvidence {
  status: string;
  predictedLtvUsd?: number | null;
}

export interface KnownLeadValueSummary {
  totalUsd: number;
  measuredCount: number;
  unmeasuredCount: number;
}

/** Sum only explicitly recorded values; never substitute a default valuation. */
export function summarizeKnownLeadValue(leads: readonly LeadValueEvidence[]): KnownLeadValueSummary {
  const included = leads.filter(lead => lead.status !== 'dead' && lead.status !== 'closed_lost');
  const measured = included.filter(lead =>
    typeof lead.predictedLtvUsd === 'number' &&
    Number.isFinite(lead.predictedLtvUsd) &&
    lead.predictedLtvUsd >= 0
  );

  return {
    totalUsd: measured.reduce((total, lead) => total + (lead.predictedLtvUsd as number), 0),
    measuredCount: measured.length,
    unmeasuredCount: included.length - measured.length
  };
}

export function isMeasuredScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function isMeasuredRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5;
}
