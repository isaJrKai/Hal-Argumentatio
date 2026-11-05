/**
 * Bound process-local rate-limit maps and remove expired records.
 * Shared/distributed limiting is still required when running multiple instances.
 */
export function pruneBoundedMap<K, V>(
  map: Map<K, V>,
  now: number,
  expiresAt: (value: V) => number,
  maxEntries: number
): void {
  for (const [key, value] of map) {
    if (expiresAt(value) <= now) map.delete(key);
  }
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}
