import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestTimesFmForecast, validateTimesFmForecast } from '../../src/lib/timesfmClient';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const validSeries = [1, 2, 3, 5, 4, 6, 7, 8];

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


describe('TimesFM inference failure handling', () => {
  it('fails closed when private service credentials are missing', async () => {
    vi.stubEnv('TIMESFM_SERVICE_URL', '');
    vi.stubEnv('TIMESFM_API_KEY', '');
    await expect(requestTimesFmForecast(validSeries, 2)).rejects.toThrow(/not configured/);
  });

  it('rejects empty, short, non-finite, negative, and constant histories before calling the service', async () => {
    vi.stubEnv('TIMESFM_SERVICE_URL', 'https://timesfm.example');
    vi.stubEnv('TIMESFM_API_KEY', 'x'.repeat(32));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestTimesFmForecast([], 2)).rejects.toThrow(/at least 8/);
    await expect(requestTimesFmForecast([1, 2, 3, 4, 5, 6, 7, Number.NaN], 2)).rejects.toThrow(/finite/);
    await expect(requestTimesFmForecast([-1, 2, 3, 4, 5, 6, 7, 8], 2)).rejects.toThrow(/finite/);
    await expect(requestTimesFmForecast([2, 2, 2, 2, 2, 2, 2, 2], 2)).rejects.toThrow(/variation/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces an inference service outage without substituting a forecast', async () => {
    vi.stubEnv('TIMESFM_SERVICE_URL', 'https://timesfm.example');
    vi.stubEnv('TIMESFM_API_KEY', 'x'.repeat(32));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(requestTimesFmForecast(validSeries, 2)).rejects.toThrow(/HTTP 503/);
  });

  it('rejects insecure non-local service URLs', async () => {
    vi.stubEnv('TIMESFM_SERVICE_URL', 'http://timesfm.example');
    vi.stubEnv('TIMESFM_API_KEY', 'x'.repeat(32));
    await expect(requestTimesFmForecast(validSeries, 2)).rejects.toThrow(/HTTPS/);
  });
});
