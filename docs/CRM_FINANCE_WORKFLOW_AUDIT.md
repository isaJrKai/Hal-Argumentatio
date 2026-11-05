# CRM, Finance and Business Workflow Audit

**Work branch:** `audit/crm-finance-business-workflows`  
**Base:** `main`  
**Production:** No production writes, migrations, or deployment performed.

## Scope and evidence standard

This audit traces the CRM/finance lifecycle from repository code and tests. A route existing or a UI displaying a status is not evidence of a successful business operation. A workflow is considered verified only when the canonical tenant-owned record, its state transition, related records, and durable event history agree.

No client, lead, sale, payment, or revenue test records were created.

## Confirmed implementation

- Lead discovery UI calls authenticated `POST /api/leads/harvest`; selected prospects are sent to `POST /api/leads/ingest`. The UI reports imported records and human review task counts.
- Lead reads and updates use authenticated PostgreSQL queries scoped by contractor ID. Lead status changes pass through `validateCrmTransition`.
- Revenue close-out in `POST /api/revenues` verifies lead ownership, rejects already-won leads, checks the CRM transition, and transactionally updates the lead, inserts the revenue record, lead events, work-ledger event, and audit entry.
- `GET /api/financials/overview` reads tenant-owned client projects from PostgreSQL and returns 503 rather than substituting legacy/cached values when that read fails.
- Financial snapshot tests cover active-retainer MRR/ARR and assert that unsupported CAC, LTV, churn, runway, history, and projections remain unavailable.
- CRM state-machine tests cover forward progression, legacy aliases, invalid transitions, and reactivation.
- The shared operating-layer specification explicitly requires an end-to-end test and tenant-isolation/retry/event-ordering coverage; those release gates were not marked complete in the existing document.

## Defect corrected on this branch

### Synthetic revenue-outcome measurement

The `POST /api/revenue/outcomes/measure` handler previously inserted hard-coded baseline, expected, and actual values (including sample revenue/ROAS/CPL/CAC), and when no revenue existed it generated an assumed uplift from a recommendation's impact score. When some tenant revenue existed, it attributed all revenue in a seven-day tenant-wide window to each executed recommendation and used a hard-coded spend denominator. This could create false learning and misleading financial performance.

The branch now:
- removes synthetic baseline, expected, and actual metrics;
- refuses to attribute unrelated tenant revenue to a recommendation without an explicit attribution record;
- marks closed observation windows `insufficient_data` instead of claiming an evaluated outcome;
- removes the fabricated execution-reference fallback;
- does not emit a successful/failed learning classification without evidence.

A regression test asserts these fail-closed invariants.

## Additional defects corrected on this branch

- The manual outcome-evaluation endpoint no longer substitutes default revenue/ROAS values. It now rejects evaluation unless the outcome is explicitly in the measured state and contains comparable finite numeric expected/actual metrics.
- Recommendation execution no longer manufactures a random “Manual Ref” identifier. The recommendation state update and immutable lifecycle event now commit in one transaction with a current-status predicate to prevent concurrent overwrites.
- Client-project creation now requires explicit business, city, service, package, and positive whole-dollar retainer values. When linked to a lead, that lead must belong to the tenant and already be closed-won; an existing linked project is rejected. Missing audit scores and target scores remain unavailable instead of being seeded with defaults.
- The project form no longer pre-fills a $2,400 retainer, and its lead picker offers only closed-won leads.
- Project updates accept explicit non-negative whole-dollar retainer changes and terminal cancellation states. The work event records prior/current retainer values.
- Financial MRR now counts only explicit active-delivery statuses (active, active_delivery, in_progress); onboarding and review projects are excluded until delivery is active.
- The recommendations endpoint now returns an empty tenant-scoped list instead of inserting a fabricated sample campaign recommendation.
- Proposal generation now requires a tenant-owned saved lead and explicit package/price inputs. It no longer estimates ROI from an arbitrary multiplier or invents audit scores; the response clearly identifies itself as a generated, non-persisted draft.
- Revenue simulations now require two campaigns with recorded spend and unambiguous lead-linked revenue. Ambiguous multi-touch attribution is excluded; unverified geo/general-growth scenarios are explicitly unsupported rather than assigned invented ROAS, percentage lift, or confidence values.
## Remaining verification gates

These items remain unverified and must not be represented as complete:

1. Full browser-level discovery → lead → audit → landing-page artifact → proposal/contract → approved outreach → delivery/follow-up → deal outcome → client project → revenue flow.
2. Exact frontend-to-backend route coverage for every proposal, contract, client-project and communications action.
3. Tenant A/B integration tests against a disposable PostgreSQL test database for CRUD, foreign-record access, duplicate requests, concurrent close-out, and rollback after partial failure.
4. Contract/proposal persistence and signature/execution semantics, including proof that draft/approved/signed are distinct states. The current proposal generator returns a generated response but no canonical proposal/contract table or durable signature workflow has been verified.
5. Integration coverage for won-lead project conversion, duplicate prevention under concurrent requests, lead linkage, and retainer changes/cancellation semantics. The current duplicate guard is an application-level pre-check, not a database uniqueness guarantee.
6. Revenue recognition versus cash collection/payment recording. The current `/api/revenues` close-out endpoint records a positive whole-dollar amount against a lead; it is not a payment processor or a complete invoice/receivables ledger.
7. End-to-end event correlation and ordering across audit, landing-page, outreach, deal, project, revenue, and forecast records.
8. Forecast evaluation against correctly attributed observations and evidence that only actual outcomes feed learning.
9. CI execution on the latest branch head. GitHub Actions must run the type-check, full Vitest suite, production build, and dependency audit; no local test runner is available through the repository connector.

## Safety and release

- Dedicated branch only; no direct `main` writes.
- No production data was read or modified through a privileged database connection.
- No production migration or deployment was performed.
- Do not merge until the branch CI is green and the remaining end-to-end/tenant-isolation gates have been addressed or explicitly accepted as limitations.
