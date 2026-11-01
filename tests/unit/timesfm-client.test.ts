import { describe, expect, it } from 'vitest';
import { validateTimesFmForecast } from '../../src/lib/timesfmClient';

const validResponse = {
  success: true,
  model: 'google/timesfm-2.5-200m-pytorch',
  version: '2.5',
  backend: 'pytorch',
  input_points: 16,
  horizon: 2,
  forecast: [
    { step: 1, point: 12, lower: 8, upper: 16 },
    { step: 2, point: 14, lower: 9, upper: 20 }
  ]
};

describe('TimesFM response contract', () => {
  it('accepts correctly shaped, finite, ordered model output', () => {
    expect(validateTimesFmForecast(validResponse, 2).forecast).toHaveLength(2);
  });

  it('rejects a response that does not contain the requested horizon', () => {
    expect(() => validateTimesFmForecast(validResponse, 3)).toThrow(/contract/);
  });

  it('rejects non-finite forecast values', () => {
    const invalid = {
      ...validResponse,
      forecast: [{ ...validResponse.forecast[0], point: Number.NaN }, validResponse.forecast[1]]
    };
    expect(() => validateTimesFmForecast(invalid, 2)).toThrow(/invalid forecast point/);
  });

  it('rejects crossed quantile bounds', () => {
    const invalid = {
      ...validResponse,
      forecast: [{ step: 1, point: 12, lower: 15, upper: 16 }, validResponse.forecast[1]]
    };
    expect(() => validateTimesFmForecast(invalid, 2)).toThrow(/invalid forecast point/);
  });
});
