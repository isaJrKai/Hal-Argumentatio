import { describe, expect, it } from 'vitest';
import { isInsufficientTimesFmHistory } from '../../src/lib/timesfmError';

describe('TimesFM insufficient-history classification', () => {
  it('recognizes the tenant-scoped empty-history condition', () => {
    expect(isInsufficientTimesFmHistory(new Error('Forecast unavailable: no tenant-scoped Google Ads history was found.'))).toBe(true);
  });

  it('recognizes insufficient imported history', () => {
    expect(isInsufficientTimesFmHistory('Insufficient Google Ads history for an eligible forecast')).toBe(true);
  });

  it('does not hide genuine inference failures', () => {
    expect(isInsufficientTimesFmHistory(new Error('TimesFM model weights failed to load'))).toBe(false);
    expect(isInsufficientTimesFmHistory(null)).toBe(false);
  });
});
