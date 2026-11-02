# HAL System Plumbing Audit

**Status:** Active integration pass  
**Branch:** `fix/system-sync-json-contracts`  
**Pull request:** #31

## Integration standard

A workflow is considered connected only when its data is persisted in the authoritative store, tenant ownership is enforced, downstream modules read the same record, state transitions are recorded, and failures are visible. A UI action or queued task alone is not proof of execution.

## Confirmed findings

1. **Split persistence remains in the architecture.** PostgreSQL is authoritative for several core domains, while the legacy JSON store in `src/db/db.ts` still handles cryptographic ledger history and other legacy domains. Connector credentials now migrate to encrypted tenant-scoped PostgreSQL on read; scheduler jobs and outreach sequences are also PostgreSQL-authoritative. The stores are not yet consolidated. Do not describe the whole application as using one durable store.
2. **Maps ingestion previously stopped at lead creation.** The additive and replacement Maps/territory import routes did not create work-queue assignments. The integration branch now creates tenant-scoped human qualification tasks and correlated work-ledger events for imported leads.
3. **Worker capabilities are intentionally unequal.** Human work is manually executed; Hermes has a limited verified executor scope; Gemini and Nemotron are configured reasoning providers, not independent queue executors. There is no staff roster / named employee assignment system in the inspected repository.
4. **Database pools could diverge.** The application query pool and the settings/diagnostic pool were managed separately. The integration branch now routes database sync/status through the application pool, uses that pool for neural graph reads, and makes custom-URL connection tests isolated and read-only.
5. **Health and readiness were conflated.** `/api/health` was only an HTTP liveness response. The integration branch adds `/api/ready`, which checks the application pool and core cross-module tables.
6. **Duplicate financial endpoint existed.** Two GET handlers were registered for `/api/financials/overview`; the later handler contained hard-coded figures and was unreachable behind the earlier route. The duplicate handler has been removed.
7. **Logout did not revoke JWTs.** The middleware validated JWTs and account existence but did not consult the JSON session list that logout deleted. The integration branch adds hashed, tenant-scoped PostgreSQL token revocations and checks them in authentication middleware.
8. **Schema tests omitted newer operating tables.** Work queue, work ledger and Hermes tables were not in the schema invariant list. Coverage has been extended, including token revocations.
9. **System Health showed simulated success states.** AI availability, encryption, Maps and scheduler indicators were hard-coded or inferred from configuration. The integration branch now probes database readiness, provider configuration, Hermes configuration, Maps connector configuration, encryption round-trip and persisted scheduler records; configured providers are explicitly labelled unverified.
10. **Revenue recording did not close the CRM lead.** The endpoint inserted revenue and a revenue event, but left the persisted lead stage unchanged while the UI marked the selected lead converted locally. The integration branch now commits revenue, the closed-won stage, lead events, work-ledger event and audit entry in one transaction, and the UI exposes the qualification -> proposal -> close progression.
11. **Territory reset wrote only to the legacy JSON store.** The dashboard and business modules read PostgreSQL, so the reset could report success without clearing the live pipeline. The integration branch now performs a tenant-scoped PostgreSQL transaction, protects client delivery projects, cancels open tasks tied to removed leads, records the reset and disables synthetic seed mode.
12. **Outreach sequence reads and writes used different stores.** GET read PostgreSQL while POST saved to the JSON store. The integration branch now saves/updates sequences, audit records and work-ledger events in one PostgreSQL transaction.
13. **Audit history had a role and persistence mismatch.** The route checked the wrong role property and only read JSON audit records even though core modules wrote PostgreSQL audit rows. The integration branch now uses the authenticated contractor role, reads tenant-scoped PostgreSQL audit rows and merges legacy records during migration; new UI audit entries are persisted to PostgreSQL.
14. **Forecast evaluation was disconnected from the live business tables.** The scheduler used legacy JSON forecasts, leads, campaign snapshots and revenue while the UI read PostgreSQL. It also wrote learning insights to the legacy store. The integration branch now evaluates tenant PostgreSQL forecasts against tenant PostgreSQL observations, commits outcomes and learning insights together, creates new forecasts from real campaign observations only, and scopes insights to the owning tenant.
15. **Win/loss close-out was a multi-write partial-failure risk.** Deal outcome, revenue, CRM stage, work history, learning insight and audit rows were written separately; a later failure could leave inconsistent records. The integration branch now commits these related records atomically and rejects repeated terminal outcomes.
16. **Outreach simulation history was process-memory only.** Simulated campaign sends appeared in the in-memory dispatch log and vanished on a cold start. The integration branch now writes encrypted simulation records and delivery events to the PostgreSQL communications outbox, and the history endpoint reads both live and simulated records from that durable store.

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

- Connected published landing-page form submissions to tenant-scoped lead creation and human review queue assignments; the public form only resolves a published Hermes artifact and never trusts a browser-supplied contractor ID.
- Corrected the Intelligence chat deletion route and removed unsupported neural mutation claims.
- Removed the neural layout API no-op; device-local layout persistence is labelled as local behavior.
- Reconciled Hermes diagnostics to actual Google Ads evidence and corrected connector webhook URLs.

## Frontend/backend contract reconciliation

The route inventory was expanded to include the full 11k-line server file and `app.all` handlers. Several routes initially suspected missing were present in later sections: Hermes Lab, the authenticated MCP gateway, Revenue Outcomes, Phase 3 outbox, and Phase 4 arbitrage evaluation. They are not counted as missing-route defects.

Additional confirmed fixes on this branch:

1. **Intelligence chat deletion:** the UI called singular `/api/intelligence/chat/message/:id`; the tenant-authenticated backend route is plural `/api/intelligence/chat/messages/:id`. The caller now uses the registered route and URL-encodes the ID.
2. **Neural pruning:** the backend explicitly disables manual pruning until learned weights are tenant-scoped and validated, while the UI previously removed nodes optimistically and called an unregistered endpoint. The UI control is now disabled; it no longer claims a graph mutation occurred.
3. **Neural layout persistence:** the backend returned HTTP 200 without storing layout data. That no-op endpoint and its call were removed. Node layout remains browser-local via localStorage and is not represented as cross-device persistence.
4. **Hermes diagnostics:** the prior scan checked aggregate Google Ads rows but reported four surfaces scanned and asserted an unverified GCLID root cause. It now reports the actual evidence-row count, records only a qualified screening signal, deduplicates open incidents, and explicitly states that tags, webhooks and delivery providers were not probed. The diagnostics status no longer claims active background supervision.
5. **Connector webhook setup:** the displayed WhatsApp webhook URL now matches the registered signed route `/api/outreach/whatsapp/webhook`. The UI no longer advertises a nonexistent Twilio inbound route; SMS inbound remains unimplemented/simulation-only.
6. **Form Builder embed:** the previous iframe pointed to an unregistered route. The embed now requires a published Hermes landing-page ID and uses a published-page form route. Form submissions are parsed as URL-encoded data, ownership is resolved from the published artifact, and lead creation, lead event, human review task and work-ledger events are committed together in PostgreSQL.
7. **WhatsApp inbound tenant isolation:** the signed webhook previously broadcast every inbound message to every connected contractor session because it had no phone-number-to-tenant resolver. That cross-tenant fan-out is removed. Until a verified workspace mapping is configured, signed inbound messages fail closed with HTTP 503 and are not shown to any workspace. The connector UI now states this limitation.
8. **Human task completion evidence:** human lead-review tasks previously allowed completion with only a status change. The Work Queue now requires a completion note for `lead_follow_up` tasks and persists that note in both the task output and the correlated work-history event. This records what the operator did without pretending the lead was contacted or qualified automatically.
9. **Scheduler durability:** scheduler history and execution status previously lived in the legacy JSON store. The scheduler table now carries tenant ownership, bootstrap adds the tenant column/index, legacy tenant-local records are imported idempotently on read, and scheduler execution plus Phase 3 verification read/write PostgreSQL.
10. **Outreach sequence source of truth:** the Phase 3 roadmap previously read legacy JSON sequences while the Outreach module wrote PostgreSQL. Phase 3 status, verification and preview now use the same PostgreSQL sequence records; tenant-local legacy sequences are imported idempotently on read.
11. **Workspace purge isolation:** the old mock-data purge called a global JSON-store purge and deleted seed rows across all PostgreSQL tenants, including test contractor accounts. It now deletes only the authenticated workspace's seed records and dependent tasks/events, never deletes contractor accounts, and writes a tenant-scoped audit/work event.
12. **Inbound simulator persistence:** the test inbound SMS/WhatsApp simulator previously updated only the legacy JSON lead mirror. It now matches the authenticated tenant's PostgreSQL leads (decrypting PII only in memory), updates the canonical lead record and writes lead/work events.
13. **CRM webhook reconciliation:** the webhook previously fell back to the first contractor when no tenant ID was supplied, matched encrypted contacts against placeholder columns, hashed those placeholders for enhanced conversions, and stored the raw webhook payload in event metadata. It now requires explicit tenant resolution, scopes idempotency to that tenant, decrypts contact data only for in-memory matching/hashing, avoids persisting raw contact payloads, and writes a correlated work event.
14. **Connector credential durability:** connector credentials were encrypted but stored only in the legacy JSON file. A tenant-scoped PostgreSQL table now stores AES-GCM encrypted values; existing tenant-local credentials are imported idempotently on read, updates write PostgreSQL, and the browser receives configuration flags only—not secret values.

These are code-level changes. They do not substitute for live browser, provider, or production database verification.

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

## Additional backlog reconciliation

The older `AUDIT.md`, `docs/HAL_OPERATING_LAYER.md`, and sale-readiness notes contain overlapping work. Treat this section as a reconciliation guide, not proof that an item is complete.

### Still outstanding or requiring live evidence
- **Staff operations:** no named staff roster, employee invitation/onboarding, role-based assignment, or staff workload view is implemented. Human task completion now records evidence, but assignment remains a generic `human` worker rather than a named employee.
- **Communications:** SMS remains simulation-only and no Twilio inbound webhook is registered. WhatsApp signature validation exists, but inbound phone-number-to-tenant routing is not configured; signed messages currently fail closed with HTTP 503. Resend email submission is implemented, but live sender verification, delivery webhook reconciliation, durable retries/dead-letter handling and production delivery tests still need evidence.
- **Google Workspace:** Drive, read-only Calendar and Gmail-send flows require real Firebase/Google Cloud project configuration and browser verification. A successful build does not prove OAuth consent, scopes or provider access.
- **Database consolidation:** cryptographic ledger history and other legacy domains still use JSON persistence. Connector credential migration is idempotent, but legacy encrypted copies remain in the old store pending controlled cleanup. Migrate domain-by-domain with backups, reconciliation and rollback.
- **Forecasting:** the TimesFM adapter and scheduled inference path need a real configured inference run and evidence that the returned forecast is persisted and evaluated. Provider configuration alone is not proof.
- **Public API hardening:** review rate limits, payload size limits, CORS allowlists and tenant authorization on every public endpoint; add idempotency to ingestion and webhook routes.
- **Frontend/backend contract:** inventory every frontend API call and verify its server route, authentication requirement, request schema and response shape. Remove or clearly disable controls with no implemented action.
- **End-to-end acceptance:** test discovery -> lead -> audit -> page -> approved outreach -> close -> client project -> verified revenue, plus Hermes -> artifact -> work ledger, using a real isolated tenant and database.
- **Release readiness:** run migrations and verify readiness on the deployed instance; complete browser sign-in, database persistence, tenant isolation, communications and recovery checks.

### Previously recorded UI/performance backlog — reconcile before changing
- Settings basic/advanced grouping, remaining theme-token cleanup, Operating Manual layout, lazy-loading heavy panels, and additional contractor landing templates were listed in the older audit. Re-check each against the current UI before implementing; do not assume the old notes are still accurate.
- The old audit also mentioned browser-local Postgres URL storage and session-token display. Re-audit the current Settings implementation and remove any exposure of connection strings or bearer tokens before public release.

## Verification boundary

- Latest PR head: `5040c7f7571f48d4c90c069d8e0abde12b248f99`.
- GitHub Actions CI run `41544141119` completed successfully: frozen Bun install, TimesFM Python syntax check, TypeScript + automated tests, production build, production dependency audit and full dependency audit report.
- No live production database, deployed `/api/ready`, browser OAuth flow, real email delivery, or full cross-module end-to-end workflow has been exercised in this audit.
- CI success is repository-level verification only. Do not merge, publish, or describe the application as production-verified until the live acceptance checks above are completed.