import { describe, expect, it } from 'vitest';
import { calibrateForecastConfidence } from '../../src/lib/forecastConfidence';

describe('forecast confidence calibration', () => {
  it('preserves zero confidence instead of imposing an arbitrary floor', () => {
    expect(calibrateForecastConfidence(0, 90)).toBe(0);
  });

  it('reduces model-reported confidence when the sample is shallow', () => {
    expect(calibrateForecastConfidence(1, 3)).toBe(0.45);
    expect(calibrateForecastConfidence(1, 8)).toBe(0.7);
    expect(calibrateForecastConfidence(1, 20)).toBe(0.85);
  });

  it('caps the displayed score and rejects non-finite model values', () => {
    expect(calibrateForecastConfidence(1.5, 100)).toBe(0.93);
    expect(calibrateForecastConfidence(Number.NaN, 100)).toBe(0);
  });
});
