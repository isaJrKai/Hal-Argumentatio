import { filterGoogleAdsTerritoryRecords } from './forecastData';

export interface TimesFmEvaluationWindow {
  start: Date;
  end: Date;
}

export interface GoogleAdsForecastObservation {
  date: Date | string;
  conversions?: number | string | null;
  geo?: string | null;
  campaignName?: string | null;
  keyword?: string | null;
  searchTerm?: string | null;
}

/** A batch forecast target is a UTC Monday; it is evaluable only after Sunday ends. */
export function getTimesFmBatchEvaluationWindow(
  targetDate: Date | string,
  now: Date = new Date()
): TimesFmEvaluationWindow | null {
  const target = new Date(targetDate);
  if (!Number.isFinite(target.getTime()) || !Number.isFinite(now.getTime())) return null;
  if (target.getUTCDay() !== 1) return null;
  const start = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()));
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return end.getTime() <= now.getTime() ? { start, end } : null;
}

/** Returns a real weekly conversion total, or null when territory/history is incomplete. */
export function evaluateTimesFmBatchActual(
  rows: GoogleAdsForecastObservation[],
  city: string,
  niche: string,
  window: TimesFmEvaluationWindow
): number | null {
  const territoryRows = filterGoogleAdsTerritoryRecords(rows, niche, city);
  const scoped = territoryRows.filter(row => {
    const timestamp = new Date(row.date).getTime();
    return Number.isFinite(timestamp) && timestamp >= window.start.getTime() && timestamp < window.end.getTime();
  });
  const observedDays = [...new Set(scoped.map(row => new Date(row.date).toISOString().slice(0, 10)))].sort();
  if (observedDays.length < 5) return null;
  const firstOffset = (Date.parse(observedDays[0] + 'T00:00:00.000Z') - window.start.getTime()) / 86400000;
  const lastOffset = (Date.parse(observedDays[observedDays.length - 1] + 'T00:00:00.000Z') - window.start.getTime()) / 86400000;
  if (firstOffset > 1 || lastOffset < 4) return null;
  let total = 0;
  for (const row of scoped) {
    const value = Number(row.conversions ?? 0);
    if (!Number.isFinite(value) || value < 0) return null;
    total += value;
  }
  return Number.isFinite(total) ? total : null;
}
