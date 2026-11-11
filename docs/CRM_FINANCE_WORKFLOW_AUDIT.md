# CRM, Finance and Business Workflow Audit

**Work branch:** `integration/crm-finance-mainline`  
**Base:** `main` at `080726d677823eeef69bc1cd882367fc8d12ebc1`  
**Production:** No production writes, migrations, or deployment performed.

## Scope and evidence standard

This audit traces the CRM/finance lifecycle from repository code and tests. A route existing or a UI displaying a status is not evidence of a successful business operation. A workflow is considered verified only when the canonical tenant-owned record, its state transition, related records, and durable event history agree.

No client, lead, sale, payment, or revenue test records were created.

## Landing-page publication safety correction in progress

The release candidate now changes the save contract so `POST /api/landing-pages/save` creates or updates a tenant-owned `draft`, not a publicly accessible `ready` artifact. The save response no longer returns a public URL. The Landing Page Studio labels the saved artifact private and does not expose a Live link unless the artifact is already in a published state. Unknown artifact IDs no longer fall back to rendering the default plumbing template.

The integration test now asserts that a saved draft is not publicly reachable and that another tenant cannot overwrite the artifact by reusing its ID. A Playwright browser test also exercises the Landing Page Studio save → private draft → explicit publish → edit/revoke sequence against the real application and PostgreSQL. The explicit publish action now requires the hash returned by the latest save. The server recomputes the hash from the stored page configuration and rendered output, compares it in constant time, and records the approving tenant and version hash before making the artifact public. Any subsequent save returns the artifact to private draft state.

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
- Proposal generation is tenant-scoped and persists a durable draft. Tenant-scoped list/read and internal approve/void transitions are available. Approved proposals can create seven-day, one-time client acceptance links; acceptance records the typed name/email, explicit consent, timestamp, request IP/user-agent, and SHA-256 hash of the proposal content. This is first-party acceptance evidence, not external identity verification or a guarantee of legal enforceability.

The test harness exports the Express app but skips listener/background-worker startup under `NODE_ENV=test`. Each test tenant and its records use unique identifiers and are cleaned from the CI/local PostgreSQL database. PostgreSQL-backed HTTP tests cover the sequential proposal → internal approval → revenue close-out → project → active delivery → financial MRR lifecycle, proposal acceptance, invoice issue/partial receipt/full settlement, invoice voiding, tenant isolation, overpayment rejection, and concurrent payment races. Work-ledger payloads carry a stable `workflowId` from lead through proposal, revenue, project, invoice, and receipt events. A Playwright browser test registers a tenant, uses a real saved lead in Document Studio, generates and approves a proposal, opens the one-time acceptance page in a separate browser page, records client acceptance, closes the deal, creates and activates a client project, then uses Client Work Orders to issue an invoice and record a receipt. The browser test asserts the resulting proposal, invoice, and payment rows in PostgreSQL.

## Remaining verification gates

These boundaries remain explicit; do not market them as completed:

1. The browser journey now verifies Document Studio proposal creation and acceptance through project delivery, invoicing, and receipt recording. It does not yet exercise the full lead-harvest/discovery → audit/diagnostic → landing-page generation → approved outreach → external provider delivery/follow-up journey in a browser. Those upstream surfaces and external delivery outcomes still require separate end-to-end coverage.
2. Client acceptance is implemented as first-party typed-name/email consent with a one-time hashed link, timestamp, request metadata, and content hash. No DocuSign, Dropbox Sign, or other external e-signature provider is connected; identity verification and provider-issued signature certificates are not present. The UI explicitly describes this as first-party acceptance and must not call it externally verified.
3. Invoices and receipts are persisted in a tenant-scoped manual ledger with partial/full payment, voiding, row locking, overpayment protection, and work-ledger events. Receipt methods (cash, bank transfer, card terminal, cheque, other) are operator-recorded; there is no bank feed, payment processor webhook, or independently verified settlement. The API marks receipts `settlementVerified: false`. This is an invoice/receivables ledger, not proof of funds clearing.
4. Workflow correlation now links the exercised CRM → proposal → revenue → project → invoice → receipt events through a stable `workflowId`. Correlation and ordering with external landing-page, outreach, delivery-provider, and forecasting systems remain unverified.
5. Forecast evaluation against correctly attributed observations remains limited. Unsupported forecasts and learning outcomes stay unavailable rather than being populated with synthetic metrics.
6. Extend tenant-isolation and rollback-after-partial-failure coverage to the remaining CRM, contracts, and communications routes. The covered concurrency races include won-lead conversion, revenue close-out, retainer updates, cancellation, and invoice receipts.
7. Production schema migration, production data verification, and deployment have not been performed. The new invoice and signing-link tables/columns are included in the idempotent PostgreSQL bootstrap, but the production migration must be run and verified under the production database role before rollout.
8. Final-head CI must pass after the documentation and PR metadata are updated. CI must include PostgreSQL 16 integration tests, type checks, build, dependency audit, and the Playwright browser workflow. Earlier green runs do not validate later commits.

## Safety and release

- Dedicated branch only; no direct `main` writes.
- No production data was read or modified through a privileged database connection.
- No production migration or deployment was performed.
- This integration branch was created directly from current `main` and has no commits behind `main`; compare counts may increase as the release candidate is refined. The original workstream branch remains untouched and is not the release candidate.
- Do not merge until the branch CI is green and the remaining end-to-end/tenant-isolation gates have been addressed or explicitly accepted as limitations.
