# HAL Phase 6D: Outcome Tracking & Learning Loop Specification

## Executive Summary
Phase 6D establishes HAL’s Outcome Tracking & Learning Loop, connecting recommendations and experiments to real-world business outcomes. The primary purpose of Phase 6D is **not** to generate new recommendations and **not** to execute Google Ads changes, but rather to evaluate whether HAL's past recommendations and simulations actually worked.

---

## 1. Outcome State Machine
Outcomes move through a strict deterministic lifecycle:
1. **`pending_observation`**: Initial state when an executed recommendation enters the observation window (`now < observation_end`).
2. **`observing`**: Active tracking state during the post-execution observation window.
3. **`measured`**: Raw post-execution metrics have been gathered and compared against baseline metrics.
4. **`evaluated`**: Finalized state where prediction accuracy has been computed and outcome classification is assigned.
5. **`insufficient_data`**: Fallback state assigned when sample sizes, tracking pixels, or baseline records are incomplete.

---

## 2. Prediction Accuracy Formula
Prediction accuracy is calculated deterministically without opaque AI scoring. For any predicted metric (e.g., Revenue or ROAS):

$$\text{Metric Accuracy} = \max\left(0, \min\left(1, 1 - \frac{|\text{Expected} - \text{Actual}|}{|\text{Expected}|}\right)\right)$$

Composite prediction accuracy is the arithmetic mean across key business dimensions:

$$\text{Prediction Accuracy} = \frac{\text{Accuracy}_{\text{Revenue}} + \text{Accuracy}_{\text{ROAS}}}{2}$$

### Division-by-Zero Protection
- If $\text{Expected} = 0$ and $\text{Actual} = 0$, accuracy defaults to `1.0`.
- If $\text{Expected} = 0$ and $\text{Actual} > 0$, accuracy defaults to `0.0`.
- Bounded strictly between `0.0` and `1.0`.

---

## 3. Outcome Classification Thresholds
HAL classifies outcomes deterministically based on prediction accuracy and revenue performance:

- **`successful`**: 
  - $\text{Prediction Accuracy} \ge 85\%$ ($0.85$) **AND** $\text{Actual Revenue} \ge 90\%$ ($\ge 0.90 \times \text{Expected Revenue}$).
- **`partially_successful`**: 
  - $\text{Prediction Accuracy} \in [60\%, 84.9\%]$.
- **`neutral`**: 
  - $\text{Prediction Accuracy} \in [40\%, 59.9\%]$.
- **`failed`**: 
  - $\text{Prediction Accuracy} < 40\%$ ($0.40$).
- **`insufficient_data`**: 
  - Active observation window or missing telemetry.

---

## 4. Safety & Governance Boundary
- **Zero Google Ads Mutation**: Phase 6D does not modify budgets, bids, pause campaigns, or call external advertising mutation APIs.
- **Human-Only Execution**: Recommendations remain advisory until explicitly approved and executed by human operators.
