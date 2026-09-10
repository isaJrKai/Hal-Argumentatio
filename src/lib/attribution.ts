/**
 * Deterministic Multi-Touch Attribution Weighting Models
 * Evaluates revenue attribution across touchpoints.
 */

export interface Touchpoint {
  id: string;
  timestamp: string | Date;
  channel: string;
  campaign?: string;
}

export interface AttributedTouchpoint extends Touchpoint {
  weight: number;
  allocatedRevenueUsd: number;
}

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'position_based_40_40_20';

/**
 * Calculates deterministic multi-touch attribution weights for a sequence of touchpoints.
 * Guarantees:
 * - Weights sum to 1.0 (or 0 if touches is empty)
 * - Deterministic allocation across identical inputs
 * - Robust against duplicate timestamps and missing campaigns
 */
export function calculateAttributionWeights(
  touchpoints: Touchpoint[],
  model: AttributionModel = 'linear',
  totalRevenueUsd: number = 0
): AttributedTouchpoint[] {
  if (!touchpoints || touchpoints.length === 0) {
    return [];
  }

  // Deduplicate exact duplicate touchpoints (same id or same channel + exact timestamp)
  const seen = new Set<string>();
  const uniqueTouches = touchpoints.filter(t => {
    const key = t.id || `${t.channel}_${new Date(t.timestamp).getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueTouches.length === 0) return [];

  // Sort chronologically
  const sorted = [...uniqueTouches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const count = sorted.length;

  let weights: number[] = [];

  if (count === 1) {
    weights = [1.0];
  } else {
    switch (model) {
      case 'first_touch':
        weights = sorted.map((_, i) => (i === 0 ? 1.0 : 0.0));
        break;

      case 'last_touch':
        weights = sorted.map((_, i) => (i === count - 1 ? 1.0 : 0.0));
        break;

      case 'linear': {
        const uniformWeight = Number((1.0 / count).toFixed(6));
        weights = sorted.map(() => uniformWeight);
        // Correct rounding drift on the last element to guarantee sum === 1.0
        const currentSum = weights.reduce((a, b) => a + b, 0);
        weights[count - 1] = Number((weights[count - 1] + (1.0 - currentSum)).toFixed(6));
        break;
      }

      case 'position_based_40_40_20': {
        if (count === 2) {
          weights = [0.5, 0.5];
        } else {
          // 40% first, 40% last, 20% distributed evenly across middle
          const middleWeight = Number((0.2 / (count - 2)).toFixed(6));
          weights = sorted.map((_, i) => {
            if (i === 0) return 0.4;
            if (i === count - 1) return 0.4;
            return middleWeight;
          });
          const currentSum = weights.reduce((a, b) => a + b, 0);
          weights[count - 1] = Number((weights[count - 1] + (1.0 - currentSum)).toFixed(6));
        }
        break;
      }
    }
  }

  return sorted.map((t, idx) => ({
    ...t,
    weight: weights[idx],
    allocatedRevenueUsd: Number((totalRevenueUsd * weights[idx]).toFixed(2))
  }));
}
