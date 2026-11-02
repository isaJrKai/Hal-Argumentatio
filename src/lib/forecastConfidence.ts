export function calibrateForecastConfidence(modelScore: number, sampleSize: number): number {
  const depthWeight = sampleSize >= 60 ? 1.0 : sampleSize >= 14 ? 0.85 : sampleSize >= 7 ? 0.70 : 0.45;
  const raw = Number.isFinite(modelScore) ? modelScore : 0;
  const calibrated = Math.min(0.93, Math.max(0, raw * depthWeight));
  return Math.round(calibrated * 100) / 100;
}
