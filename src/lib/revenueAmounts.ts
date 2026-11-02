/** Read revenue from the canonical PostgreSQL revenue_records contract. */
export function getRevenueAmountUsd(record: { amountUsd?: unknown } | null | undefined): number {
  const amount = Number(record?.amountUsd ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
