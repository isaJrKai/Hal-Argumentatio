import { describe, expect, it } from 'vitest';
import { filterGoogleAdsTerritoryRecords, matchesTerritoryContext } from '../../src/lib/forecastData';
import { validateTimesFmForecast } from '../../src/lib/timesfmClient';

const records = [
  { id: 'calgary-roofing', geo: 'Calgary, AB', campaignName: 'Roofing Leads' },
  { id: 'calgary-plumbing', geo: 'Calgary, AB', campaignName: 'Plumbing Search' },
  { id: 'austin-roofing', geo: 'Austin, TX', campaignName: 'Roofing Leads' },
  { id: 'unscoped', geo: null, campaignName: 'Roofing Leads' }
];

describe('TimesFM input and forecast invariants', () => {
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
