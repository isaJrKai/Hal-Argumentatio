export function matchesTerritoryContext(
  recordCity: unknown,
  recordNiche: unknown,
  targetCity: string,
  targetNiche: string
): boolean {
  const cityNeedle = targetCity.trim().toLocaleLowerCase();
  const nicheNeedle = targetNiche.trim().toLocaleLowerCase();
  const cityValue = String(recordCity || '').trim().toLocaleLowerCase();
  const nicheValue = String(recordNiche || '').trim().toLocaleLowerCase();
  return Boolean(cityNeedle && nicheNeedle && cityValue && nicheValue)
    && cityValue.includes(cityNeedle)
    && nicheValue.includes(nicheNeedle);
}

export function filterGoogleAdsTerritoryRecords<T extends {
  geo?: string | null;
  campaignName?: string | null;
  keyword?: string | null;
  searchTerm?: string | null;
}>(
  records: T[],
  targetNiche: string,
  targetCity: string
): T[] {
  const cityNeedle = targetCity.trim().toLocaleLowerCase();
  const nicheNeedle = targetNiche.trim().toLocaleLowerCase();
  if (!cityNeedle || !nicheNeedle) return [];
  return records.filter((record) => {
    const geo = String(record.geo || '').trim().toLocaleLowerCase();
    const tradeText = [record.campaignName, record.keyword, record.searchTerm]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    return matchesTerritoryContext(geo, tradeText, targetCity, targetNiche);
  });
}

export function buildWeeklyDemandSeries<T extends {
  date: Date | string;
  conversions?: number | string | null;
}>(records: T[]): number[] {
  const buckets = new Map<string, { conversions: number; observedDays: Set<string> }>();
  for (const record of records) {
    const date = new Date(record.date);
    if (!Number.isFinite(date.getTime())) return [];
    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const weekdayOffset = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - weekdayOffset);
    const weekKey = day.toISOString().slice(0, 10);
    const dateKey = new Date(record.date).toISOString().slice(0, 10);
    const bucket = buckets.get(weekKey) || { conversions: 0, observedDays: new Set<string>() };
    bucket.conversions += Number(record.conversions || 0);
    bucket.observedDays.add(dateKey);
    buckets.set(weekKey, bucket);
  }

  const weeks = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (weeks.length < 8 || weeks.some(([, bucket]) => bucket.observedDays.size < 5)) return [];
  for (let index = 1; index < weeks.length; index += 1) {
    const previous = Date.parse(`${weeks[index - 1][0]}T00:00:00.000Z`);
    const current = Date.parse(`${weeks[index][0]}T00:00:00.000Z`);
    if (current - previous !== 7 * 24 * 60 * 60 * 1000) return [];
  }
  return weeks.map(([, bucket]) => bucket.conversions);
}
