const GENERIC_TRADE_WORDS = new Set(['contractor', 'contractors', 'service', 'services', 'company', 'companies', 'business', 'businesses', 'llc', 'inc', 'the', 'and', 'of']);

export function matchesTradeContext(recordNiche: unknown, targetNiche: string): boolean {
  const haystack = String(recordNiche || '').trim().toLocaleLowerCase();
  const requested = targetNiche.trim().toLocaleLowerCase();
  if (!haystack || !requested) return false;
  if (haystack.includes(requested)) return true;
  const tokens = requested.split(/[^a-z0-9]+/).filter(token => token.length >= 3 && !GENERIC_TRADE_WORDS.has(token));
  return tokens.length ? tokens.some(token => haystack.includes(token)) : haystack.includes(requested);
}

export function matchesTerritoryContext(
  recordCity: unknown,
  recordNiche: unknown,
  targetCity: string,
  targetNiche: string
): boolean {
  const cityNeedle = targetCity.split(',')[0].trim().toLocaleLowerCase();
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
    return matchesTerritoryContext(geo, tradeText, targetCity, targetNiche) && matchesTradeContext(tradeText, targetNiche);
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
  const completeWeeks = weeks.filter(([weekKey, bucket]) => {
    const days = [...bucket.observedDays].sort();
    const weekStart = Date.parse(`${weekKey}T00:00:00.000Z`);
    const firstOffset = (Date.parse(`${days[0]}T00:00:00.000Z`) - weekStart) / 86400000;
    const lastOffset = (Date.parse(`${days[days.length - 1]}T00:00:00.000Z`) - weekStart) / 86400000;
    return days.length >= 5 && firstOffset <= 1 && lastOffset >= 4;
  });
  if (completeWeeks.length < 8) return [];
  for (let index = 1; index < completeWeeks.length; index += 1) {
    const previous = Date.parse(`${completeWeeks[index - 1][0]}T00:00:00.000Z`);
    const current = Date.parse(`${completeWeeks[index][0]}T00:00:00.000Z`);
    if (current - previous !== 7 * 24 * 60 * 60 * 1000) return [];
  }
  return completeWeeks.map(([, bucket]) => bucket.conversions);
}


/**
 * Scheduled forecasts describe the week immediately following the last
 * observed week. That target week may already have started when the batch
 * runs, so compare calendar-week boundaries rather than requiring the
 * Monday timestamp to be later than the current instant.
 */
export function isCurrentOrFutureForecastWeek(
  targetDate: Date | string,
  now: Date = new Date()
): boolean {
  const target = new Date(targetDate);
  if (!Number.isFinite(target.getTime()) || !Number.isFinite(now.getTime())) return false;

  const weekStart = (value: Date) => {
    const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return start.getTime();
  };

  return weekStart(target) >= weekStart(now);
}
