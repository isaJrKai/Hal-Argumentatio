# CRM, Finance and Business Workflow Audit

**Work branch:** `integration/crm-finance-mainline`  
**Base:** `main` at `080726d677823eeef69bc1cd882367fc8d12ebc1`  
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
- Outcome dashboard summaries now keep measured observations separate from evaluated outcomes, so an unevaluated measurement cannot inflate the evaluated count or prediction-accuracy average.
- Recommendation execution no longer manufactures a random “Manual Ref” identifier. The recommendation state update and immutable lifecycle event now commit in one transaction with a current-status predicate to prevent concurrent overwrites.
- Client-project creation now requires explicit business, city, service, package, and positive whole-dollar retainer values. When linked to a lead, that lead must belong to the tenant, already be closed-won, and match the submitted business name/city; an existing linked project is rejected. Missing audit scores and target scores remain unavailable instead of being seeded with defaults.
- The project form no longer pre-fills a $2,400 retainer, and its lead picker offers only closed-won leads.
- Project updates accept explicit non-negative whole-dollar retainer changes and terminal cancellation states. The project write and work event commit atomically, recording prior/current status and retainer values. The update now uses an optimistic status/timestamp predicate so stale concurrent requests cannot overwrite a newer terminal status; a stale write returns HTTP 409.
- Financial MRR now counts only explicit active-delivery statuses (active, active_delivery, in_progress); onboarding and review projects are excluded until delivery is active.
- The recommendations endpoint now returns an empty tenant-scoped list instead of inserting a fabricated sample campaign recommendation.
- The automated decision engine now compares only campaigns with recorded spend and unambiguous lead-linked closed-won revenue. It no longer assigns unattributed revenue to an unknown campaign or invents geo attribution, confidence, impact scores, or uplift amounts; geographic recommendations remain explicitly unsupported.
- Revenue experiment creation now requires an explicit baseline and expected outcome; an experiment cannot be marked complete without an actual-outcome record, and optional numeric impacts are validated.
- Proposal generation now requires a tenant-owned saved lead and explicit package/price inputs. It no longer estimates ROI from an arbitrary multiplier or invents audit scores. Proposal content is persisted as a tenant-owned immutable draft with list/read, internal approve, and void routes plus correlated work-ledger events. Internal approval is explicitly not a client signature or an executed contract.
- Revenue simulations now require two campaigns with recorded spend and unambiguous lead-linked revenue. Ambiguous multi-touch attribution is excluded; unverified geo/general-growth scenarios are explicitly unsupported rather than assigned invented ROAS, percentage lift, or confidence values.
## Route-level PostgreSQL verification added

A real HTTP integration suite imports the Express application and uses Supertest against PostgreSQL. It creates two isolated test tenants and verifies:
- Cross-tenant won-lead conversion is rejected without creating a project.
- Project creation persists both the tenant-owned project and its work-ledger event; duplicate conversion is rejected. Two simultaneous HTTP conversions of the same won lead are also tested: exactly one request succeeds, one receives HTTP 409, and only one project plus one creation event persist.
- Project listing and updates are tenant-scoped.
- Tenant B cannot read, update, or delete Tenant A's lead through the HTTP routes.
- Tenant B cannot record revenue against Tenant A's lead; Tenant A can close a qualified proposal-stage lead and atomically persist the revenue record, lead-stage events, and work-ledger event.
- Two concurrent HTTP close-out attempts for the same lead are expected to produce exactly one successful close and one HTTP 409 conflict; the conditional-update race is mapped to a business conflict rather than a database-unavailable response.
- Duplicate revenue close-out is rejected, and revenue listing remains tenant-scoped.
- An activated client project contributes to Tenant A's contract MRR/ARR, while Tenant B's financial overview remains zero for that project; a cancelled project cannot be reactivated through the route.
- Proposal generation is tenant-scoped, persists a durable draft, and exposes tenant-scoped list/read plus internal approve/void transitions. Internal approval is not a client signature or executed contract.

The test harness exports the Express app but skips listener/background-worker startup under `NODE_ENV=test`. Each test tenant and its records use unique identifiers and are cleaned from the CI/local PostgreSQL database. A sequential HTTP lifecycle test now exercises persisted proposal generation → internal approval → revenue close-out → client-project creation → active delivery → financial MRR, and checks the canonical lead, revenue, project, and financial records. This is API-level integration coverage for the exercised CRM/finance endpoints, not browser automation and not the complete discovery/audit/landing-page/approved-outreach/delivery-provider lifecycle.

## Remaining verification gates

These items remain unverified and must not be represented as complete:

1. Browser-level discovery → lead → audit → landing-page artifact → proposal/contract → approved outreach → delivery/follow-up → deal outcome → client project → revenue flow. The proposal-to-revenue-to-delivery API path is now covered, but the full browser journey and external landing-page/outreach delivery are not.
2. Exact frontend-to-backend route coverage for every proposal, contract, client-project and communications action.
3. Extend PostgreSQL-backed Tenant A/B HTTP tests to the remaining CRM/finance routes and add rollback-after-partial-failure coverage. Concurrent revenue close-out is now covered by the new HTTP test and must pass CI on the final branch head.
4. Proposal drafts and internal approval/void states are now persisted and tenant-scoped. Client signature capture, external e-sign provider verification, executed-contract storage, and signature/execution semantics remain unimplemented; an internally approved proposal must not be represented as signed or legally executed.
5. Route-level concurrency coverage includes simultaneous won-lead project conversion, simultaneous revenue close-out, simultaneous retainer edits, and a retainer-edit/cancellation race. These tests assert one winner, one HTTP 409 stale-write conflict, and consistent persisted event history. The isolated optimistic-predicate test remains supplemental rather than the sole evidence.
6. Revenue recognition versus cash collection/payment recording. The current `/api/revenues` close-out endpoint records a positive whole-dollar amount against a lead; it is not a payment processor or a complete invoice/receivables ledger.
7. End-to-end event correlation and ordering across audit, landing-page, outreach, deal, project, revenue, and forecast records.
8. Forecast evaluation against correctly attributed observations and evidence that only actual outcomes feed learning.
9. GitHub Actions CI must pass on the final branch head after the route-level concurrency, persisted proposal lifecycle, and CRM lifecycle changes. CI #1317 passed on the latest test-code commit; this audit-only update is also subject to a final-head CI rerun. Earlier green runs do not validate later commits. Non-blocking runner/toolchain warnings remain (Node.js 20 action deprecation, `punycode` deprecation, bundle-size warning, and local PostgreSQL trust-auth warning). CI provisions PostgreSQL 16 as a healthy service and supplies `DATABASE_URL`.

## Safety and release

- Dedicated branch only; no direct `main` writes.
- No production data was read or modified through a privileged database connection.
- No production migration or deployment was performed.
- This integration branch was created directly from current `main` and has no commits behind `main`; compare counts may increase as the release candidate is refined. The original workstream branch remains untouched and is not the release candidate.
- Do not merge until the branch CI is green and the remaining end-to-end/tenant-isolation gates have been addressed or explicitly accepted as limitations.
