import { describe, expect, it } from 'vitest';
import { buildWeeklyDemandSeries, filterGoogleAdsTerritoryRecords, matchesTerritoryContext } from '../../src/lib/forecastData';
import { validateTimesFmForecast } from '../../src/lib/timesfmClient';

const records = [
  { id: 'calgary-roofing', geo: 'Calgary, AB', campaignName: 'Roofing Leads' },
  { id: 'calgary-plumbing', geo: 'Calgary, AB', campaignName: 'Plumbing Search' },
  { id: 'austin-roofing', geo: 'Austin, TX', campaignName: 'Roofing Leads' },
  { id: 'unscoped', geo: null, campaignName: 'Roofing Leads' }
];

function makeWeeklyRecords(weeks = 8) {
  const records: Array<{ date: string; conversions: number }> = [];
  const firstMonday = Date.UTC(2026, 0, 5);
  for (let week = 0; week < weeks; week += 1) {
    for (let day = 0; day < 5; day += 1) {
      records.push({
        date: new Date(firstMonday + (week * 7 + day) * 86400000).toISOString(),
        conversions: week + 1
      });
    }
  }
  return records;
}

describe('TimesFM input and forecast invariants', () => {
  it('builds a model series only from contiguous weeks with five observed days', () => {
    expect(buildWeeklyDemandSeries(makeWeeklyRecords())).toHaveLength(8);
    const incomplete = makeWeeklyRecords().filter((record, index) => index !== 12);
    expect(buildWeeklyDemandSeries(incomplete)).toEqual([]);
  });

  it('rejects missing weeks instead of compressing time gaps', () => {
    const withGap = makeWeeklyRecords().filter((record) => {
      const date = new Date(record.date);
      return date < new Date(Date.UTC(2026, 0, 19)) || date >= new Date(Date.UTC(2026, 0, 26));
    });
    expect(buildWeeklyDemandSeries(withGap)).toEqual([]);
  });

  it('changes the selected historical series when the city changes', () => {
    expect(filterGoogleAdsTerritoryRecords(records, 'roofing', 'Calgary').map(x => x.id))
      .toEqual(['calgary-roofing']);
    expect(filterGoogleAdsTerritoryRecords(records, 'roofing', 'Austin').map(x => x.id))
      .toEqual(['austin-roofing']);
  });

  it('changes the selected historical series when the trade changes', () => {
    expect(filterGoogleAdsTerritoryRecords(records, 'plumbing', 'Calgary').map(x => x.id))
      .toEqual(['calgary-plumbing']);
  });

  it('uses the selected territory for neural graph records', () => {
    expect(matchesTerritoryContext('Kampala Central', 'Roofing', 'Kampala', 'roofing')).toBe(true);
    expect(matchesTerritoryContext('Kampala Central', 'Plumbing', 'Kampala', 'roofing')).toBe(false);
    expect(matchesTerritoryContext('Entebbe', 'Roofing', 'Kampala', 'roofing')).toBe(false);
  });

  it('fails closed for missing territory metadata', () => {
    expect(filterGoogleAdsTerritoryRecords(records, 'roofing', '').length).toBe(0);
    expect(filterGoogleAdsTerritoryRecords(records, 'roofing', 'Calgary').map(x => x.id))
      .not.toContain('unscoped');
  });

  it('accepts TimesFM median and q10/q90 bounds only when ordered', () => {
    const valid = {
      success: true,
      model: 'google/timesfm-2.5-200m-pytorch',
      version: '2.5',
      backend: 'pytorch',
      input_points: 12,
      horizon: 2,
      forecast: [
        { step: 1, point: 10, lower: 7, upper: 14 },
        { step: 2, point: 12, lower: 8, upper: 16 }
      ]
    };
    expect(validateTimesFmForecast(valid, 2).forecast).toHaveLength(2);
    expect(() => validateTimesFmForecast({ ...valid, horizon: 3 }, 2)).toThrow();
  });
});
