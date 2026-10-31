export interface FinancialProjectLike {
  id?: string | null;
  leadId?: string | null;
  status?: string | null;
  monthlyRetainerUsd?: number | string | null;
  packageTier?: string | null;
}

export interface FinancialSnapshotCore {
  currentMrrUsd: number;
  arrUsd: number;
  activeClientCount: number;
  averageContractLengthMonths: number | null;
  averageLtvUsd: number | null;
  blendedCacUsd: number | null;
  ltvToCacRatio: number | null;
  churnRatePercent: number | null;
  cashRunwayMonths: number | null;
  projectedMrr6Months: number | null;
  projectedMrr12Months: number | null;
  mrrHistory: { month: string; mrr: number; clients: number; newRevenue: number; churnedRevenue: number }[];
  tierDistribution: { tier: string; count: number; totalRevenue: number }[];
}

const TERMINAL_PROJECT_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'churned', 'archived']);

function finiteNonNegativeAmount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Build the financial overview only from persisted client-project contracts.
 * Metrics that require acquisition spend, payment history, contract duration,
 * churn cohorts, or cash/burn records remain null until those data sources exist.
 */
export function buildFinancialSnapshotCore(projects: readonly FinancialProjectLike[]): FinancialSnapshotCore {
  const activeProjects = projects.filter(project => {
    const status = String(project.status || '').trim().toLowerCase();
    return !TERMINAL_PROJECT_STATUSES.has(status);
  });

  const currentMrrUsd = activeProjects.reduce(
    (total, project) => total + finiteNonNegativeAmount(project.monthlyRetainerUsd),
    0
  );

  const tiers = new Map<string, { count: number; totalRevenue: number }>();
  for (const tier of ['Growth', 'Dominance', 'Enterprise']) {
    tiers.set(tier, { count: 0, totalRevenue: 0 });
  }

  for (const project of activeProjects) {
    const tier = String(project.packageTier || 'Unclassified').trim() || 'Unclassified';
    const current = tiers.get(tier) || { count: 0, totalRevenue: 0 };
    current.count += 1;
    current.totalRevenue += finiteNonNegativeAmount(project.monthlyRetainerUsd);
    tiers.set(tier, current);
  }

  return {
    currentMrrUsd,
    // This is an annualized contract run-rate, not recognized or collected revenue.
    arrUsd: currentMrrUsd * 12,
    activeClientCount: new Set(activeProjects.map(project => project.leadId || project.id).filter(Boolean)).size,
    averageContractLengthMonths: null,
    averageLtvUsd: null,
    blendedCacUsd: null,
    ltvToCacRatio: null,
    churnRatePercent: null,
    cashRunwayMonths: null,
    projectedMrr6Months: null,
    projectedMrr12Months: null,
    // No dated MRR snapshots are stored by the current project schema.
    mrrHistory: [],
    tierDistribution: Array.from(tiers.entries()).map(([tier, values]) => ({
      tier,
      count: values.count,
      totalRevenue: values.totalRevenue
    }))
  };
}
