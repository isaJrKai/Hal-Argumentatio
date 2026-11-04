/**
 * Keep process-local rate-limit stores bounded and discard expired records.
 * This is a memory-safety guard, not a substitute for a shared limiter when
 * multiple application instances are running.
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
