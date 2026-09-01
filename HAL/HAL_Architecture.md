# HAL — Canonical Architecture & Technical Specifications

## 03. 7-Layer Canonical Architecture
This architecture governs all intelligence and execution modules inside HAL:
1. **Event Layer**: Detects "What happened?" (e.g. leads generated, campaign spending ticks, weather alerts).
2. **Memory Layer**: Controls "What should be remembered?" (across working, operational, strategic, and identity tiers).
3. **Knowledge Layer**: Analyzes "How are things connected?" (using a rich relationship graph).
4. **World Model**: Represents "What is true right now?" (incorporating active market states, competitor bids, weather conditions).
5. **Intelligence Layer**: Explains "Why is it happening, and what may happen?" (generating trend forecasts and predictive indicators).
6. **Strategy Layer**: Decides "What should we do?" (proposing budget shifts, bid updates, and campaign changes).
7. **Execution Layer**: Executes "Do the work" (handling automated/approved operations).
8. **Learning Layer**: Inspects "What did we learn?" (closing the feedback loop by comparing forecasts with actual results).

---

## 04. Memory Specification (4 Tiers)
- **Working Memory** (Minutes to hours): Current conversations, active tasks, open decisions, running simulations.
- **Operational Memory** (Days to months): Leads, campaigns, calls, reports, forecasts, and revenue history.
- **Strategic Memory** (Months to years): High-level decisions, reasoning, outcomes, failed/successful initiatives, and structural market shifts.
- **Identity Memory** (Persistent truths): Company (mission, values, strategy, goals), People (Isaac, team, contractors), Operating Preferences (approval policies, risk tolerances, communication preferences).

---

## 05. Knowledge Model (Graph-Based)
Core entities include: `Company`, `Contractor`, `Customer`, `Lead`, `Campaign`, `Market`, `Competitor`, `Forecast`, `Goal`, `RevenueEvent`, `Decision`, `Simulation`, `Recommendation`, `Action`, and `Outcome`.
Key relationships track:
- `Campaign` generates `Lead`
- `Lead` assigned to `Contractor`
- `Lead` converted into `Revenue`
- `Decision` based on `Evidence`
- `Decision` created `Action`
- `Action` produced `Outcome`
- `Simulation` predicts `Outcome`
- `Simulation` informs `Decision`

---

## 06. Decision Engine Specification
- **Decision Loop**: Observe -> Interpret -> Retrieve Knowledge -> Forecast Outcomes -> Generate Alternatives -> Evaluate Tradeoffs -> Recommend -> Approve -> Execute -> Measure Outcomes -> Learn.
- **Decision Score Formula**:
  $$\text{Decision Score} = \frac{\text{Expected Value} \times \text{Confidence} \times \text{Strategic Alignment}}{\text{Reversibility} \mathbin{/} \text{Risk}}$$
