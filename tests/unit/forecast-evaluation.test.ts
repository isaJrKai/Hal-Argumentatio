import { describe, expect, it } from 'vitest';
import { evaluateTimesFmBatchActual, getTimesFmBatchEvaluationWindow } from '../../src/lib/forecastEvaluation';

const targetMonday = new Date('2026-11-02T00:00:00.000Z');
const completeWindow = { start: targetMonday, end: new Date('2026-11-09T00:00:00.000Z') };

function adsRows(city = 'Calgary, AB', campaign = 'Roofing Leads') {
  return Array.from({ length: 5 }, (_, day) => ({
    date: new Date(Date.UTC(2026, 10, 2 + day)), conversions: day + 1, geo: city, campaignName: campaign
  }));
}

describe('TimesFM batch forecast evaluation window', () => {
  it('waits until the full target week has elapsed', () => {
    expect(getTimesFmBatchEvaluationWindow(targetMonday, new Date('2026-11-08T23:59:59Z'))).toBeNull();
    expect(getTimesFmBatchEvaluationWindow(targetMonday, new Date('2026-11-09T00:00:00Z'))).toEqual(completeWindow);
  });
  it('rejects invalid and non-Monday target dates', () => {
    expect(getTimesFmBatchEvaluationWindow('invalid', new Date('2026-11-20T00:00:00Z'))).toBeNull();
    expect(getTimesFmBatchEvaluationWindow('2026-11-03T00:00:00Z', new Date('2026-11-20T00:00:00Z'))).toBeNull();
  });
  it('sums actual Google Ads conversions only for the requested territory and niche', () => {
    const rows = [...adsRows(), ...adsRows('Austin, TX', 'Roofing Leads'), ...adsRows('Calgary, AB', 'Plumbing Leads')];
    expect(evaluateTimesFmBatchActual(rows, 'Calgary, AB', 'Roofing', completeWindow)).toBe(15);
  });
  it('does not turn an incomplete target week into a zero actual', () => {
    expect(evaluateTimesFmBatchActual(adsRows().slice(0, 4), 'Calgary, AB', 'Roofing', completeWindow)).toBeNull();
  });
  it('does not evaluate data that lacks the requested city or niche', () => {
    expect(evaluateTimesFmBatchActual(adsRows('Austin, TX'), 'Calgary, AB', 'Roofing', completeWindow)).toBeNull();
    expect(evaluateTimesFmBatchActual(adsRows('Calgary, AB', 'Plumbing Leads'), 'Calgary, AB', 'Roofing', completeWindow)).toBeNull();
  });
  it('preserves a measured zero when a complete week has observed zero conversions', () => {
    expect(evaluateTimesFmBatchActual(adsRows().map(row => ({ ...row, conversions: 0 })), 'Calgary, AB', 'Roofing', completeWindow)).toBe(0);
  });
});
