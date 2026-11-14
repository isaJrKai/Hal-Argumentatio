/** True when a tenant has no eligible imported Ads history for forecasting. */
export function isInsufficientTimesFmHistory(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return normalized.includes('no tenant-scoped google ads history')
    || normalized.includes('insufficient google ads history');
}
