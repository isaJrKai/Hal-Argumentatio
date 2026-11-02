# HAL System Plumbing Audit

**Status:** Active integration pass  
**Branch:** `fix/system-sync-json-contracts`  
**Pull request:** #31

## Integration standard

A workflow is considered connected only when its data is persisted in the authoritative store, tenant ownership is enforced, downstream modules read the same record, state transitions are recorded, and failures are visible. A UI action or queued task alone is not proof of execution.

## Confirmed findings

1. **Split persistence remains in the architecture.** PostgreSQL is authoritative for several core domains, while the legacy JSON store in `src/db/db.ts` still handles connector credentials, audit logs, scheduler records and other legacy domains. The stores are not yet consolidated. Do not describe the whole application as using one durable store.
2. **Maps ingestion previously stopped at lead creation.** The additive and replacement Maps/territory import routes did not create work-queue assignments. The integration branch now creates tenant-scoped human qualification tasks and correlated work-ledger events for imported leads.
3. **Worker capabilities are intentionally unequal.** Human work is manually executed; Hermes has a limited verified executor scope; Gemini and Nemotron are configured reasoning providers, not independent queue executors. There is no staff roster / named employee assignment system in the inspected repository.
4. **Database pools could diverge.** The application query pool and the settings/diagnostic pool were managed separately. The integration branch now routes database sync/status through the application pool, uses that pool for neural graph reads, and makes custom-URL connection tests isolated and read-only.
5. **Health and readiness were conflated.** `/api/health` was only an HTTP liveness response. The integration branch adds `/api/ready`, which checks the application pool and core cross-module tables.
6. **Duplicate financial endpoint existed.** Two GET handlers were registered for `/api/financials/overview`; the later handler contained hard-coded figures and was unreachable behind the earlier route. The duplicate handler has been removed.
7. **Logout did not revoke JWTs.** The middleware validated JWTs and account existence but did not consult the JSON session list that logout deleted. The integration branch adds hashed, tenant-scoped PostgreSQL token revocations and checks them in authentication middleware.
8. **Schema tests omitted newer operating tables.** Work queue, work ledger and Hermes tables were not in the schema invariant list. Coverage has been extended, including token revocations.
9. **System Health showed simulated success states.** AI availability, encryption, Maps and scheduler indicators were hard-coded or inferred from configuration. The integration branch now probes database readiness, provider configuration, Hermes configuration, Maps connector configuration, encryption round-trip and persisted scheduler records; configured providers are explicitly labelled unverified.
10. **Revenue recording did not close the CRM lead.** The endpoint inserted revenue and a revenue event, but left the persisted lead stage unchanged while the UI marked the selected lead converted locally. The integration branch now commits revenue, the closed-won stage, lead events, work-ledger event and audit entry in one transaction, and the UI exposes the qualification -> proposal -> close progression.

## Changes made on this branch

- Hardened dashboard, Work Queue and Client Delivery API response parsing.
- Added Maps ingestion -> Work Queue qualification handoff for both additive and replacement imports.
- Made ingestion return and display created task counts.
- Added application database readiness checks.
- Aligned database sync/status and neural reads with the application's pool.
- Made custom database URL tests isolated and read-only.
- Removed duplicate financial overview handler with hard-coded values.
- Added durable JWT revocation on logout.
- Extended schema invariant tests for Work Queue, Hermes and revocation tables.

## Remaining work — do not mark complete yet

### Persistence and data contracts
- Inventory every route's read/write store and migrate remaining business-critical JSON domains to PostgreSQL in bounded, testable slices.
- Eliminate write-to-one-store/read-from-another-store patterns.
- Add transactional domain events for lead stage changes, revenue recognition, campaign outcomes, client delivery changes and learning updates.
- Ensure all list/detail/analytics endpoints use consistent tenant-scoped source data.
- Add idempotency and deduplication to all ingestion and webhook entry points.

### Workflow execution
- Add an actual staff roster and assignment model if named staff assignment is required.
- Keep Hermes task types within its verified execution boundary; do not advertise provider-only models as queue executors.
- Verify each executor's claim, start, result, failure and retry receipts.
- Link completed work back to the source entity and update the relevant business state only after a verified result.

### Operational truthfulness
- Expand live provider probes beyond configuration checks where provider APIs support safe health calls; configured credentials must not be shown as verified provider connectivity.
- Distinguish liveness, database readiness, provider configuration, provider reachability and successful business execution.
- Audit every frontend API call against an existing backend route and response contract.
- Add end-to-end tests across Maps -> Leads -> Work Queue, Lead -> Campaign -> Revenue, Client Project -> Portal -> Financials, and Hermes -> Artifact -> Work Ledger.

### Release verification
- Run type-check, full automated tests and production build on the final PR head.
- Verify the deployed app's `/api/ready` result, database schema and real tenant workflows after publication.
- Do not merge or claim live completion solely because CI passes.

## Verification boundary

CI type-check, automated tests and production build have passed on earlier commits in this PR; the newest head is still running its CI workflow. No live production database or browser workflow has been exercised by this audit.