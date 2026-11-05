# HALBiz database persistence audit

**Workstream branch:** `workstream/database-persistence-neon`  
**Main baseline:** `080726d677823eeef69bc1cd882367fc8d12ebc1`  
**Status:** Partial migration. Structured-ledger PostgreSQL storage, guarded legacy reconciliation, and several domain migrations are implemented on this branch. The remaining root-server JSON paths, transaction coupling, migration journal, and production recovery evidence remain incomplete. This is not a completion claim.

## Executive finding

HALBiz's server entrypoint uses PostgreSQL/Drizzle: `server.ts` imports the application pool and calls `bootstrapPostgresTables(pool)`; its lead-PII migration is transactional. Core services such as work-ledger, work-task, Hermes and forecasting code use the PostgreSQL schema.

A separate legacy singleton remains in `src/db/db.ts`. It loads and saves a complete `data/db.json` aggregate synchronously. At the current branch head, `server.ts` still imports this singleton and has 22 direct `db.*()` call expressions, including compatibility fallbacks plus remaining reads/writes for contractor lookup, lead CRUD, win/loss, lessons, scheduler jobs, outreach sequences, client projects, connector credentials, audit history, and sync tooling. This count is a source scan, not a claim that every call is a live production request path. This branch migrates the `src/skills/geo-map.ts` consumer, but does not retire the root server's legacy runtime paths. The PII migration helper was decoupled from the singleton by extracting encryption into `src/db/encryption.ts`. The static regression test currently scans `src/` only; it does not cover the root `server.ts` import.

The geo-map and connector credential paths use PostgreSQL. Audit-log writes and authenticated learning writes also persist to PostgreSQL. The root server still has active JSON-backed request paths. This is a partial reduction only; it does not prove that the broader runtime persistence boundary is durable, tenant-safe, or failure-closed.

## Implemented on this branch

1. **Malformed JSON fails closed.** `parseLegacyDatabase` rejects malformed and non-object JSON. The legacy store now aborts startup instead of catching a parse error and overwriting the file with empty defaults. In test mode, its file is isolated under a per-process temporary directory rather than sharing the repository's `data/db.json` path. Regression tests cover malformed and non-object values.
2. **Geo-map uses Neon.** `src/skills/geo-map.ts` now reads leads through `src/db/index.ts` and the Drizzle `leads` table, always filtering by `contractorId`. It omits phone/email because the canonical table stores encrypted contact fields and the visualization does not need to expose them.
3. **Encryption no longer imports the JSON singleton.** AES-256-GCM helpers live in `src/db/encryption.ts`. `db.ts` re-exports them for legacy tests, while `leadPiiMigration.ts`, the encryption unit tests and tenant-isolation tests import the standalone module. The legacy JSON parser is also isolated in `src/db/legacyJsonStore.ts`, so parser tests do not initialize the singleton.
4. **Runtime import guard.** `tests/security/legacy-json-store-runtime-boundary.test.ts` scans application source for direct imports of the legacy JSON aggregate store.
5. **Branch synchronization.** The workstream is based on current `main` and is no longer behind it.
6. **Learning writes fail closed.** Outcome calibration and offline-mode changes await PostgreSQL persistence and restore prior in-memory state when writes fail. The learning API does not report a successful update after a swallowed database error. Learning audit rows use PostgreSQL `audit_logs`.
7. **Bootstrap is atomic.** The bootstrap DDL runs inside a transaction and rolls back as a unit on failure. Transitional API-key hash/prefix columns remain nullable until a versioned backfill can safely inspect legacy rows.
8. **Connector credentials use the repository.** Credential reads and writes use the transactional PostgreSQL repository. Legacy JSON credentials are imported once per tenant/process using advisory-lock-protected insert-if-absent semantics, so stale JSON values do not overwrite an existing PostgreSQL secret.

## Local file persistence inventory

| Location | Operation | Current assessment |
|---|---|---|
| `src/db/db.ts` + root `server.ts` | Synchronous load/save of `data/db.json`; remaining server call sites are listed in the executive finding | Still active request-time persistence. Geo-map is migrated, but CRM leads, audit logs, structured ledger, scheduler jobs, win/loss records, lessons and other legacy paths still depend on the JSON aggregate. This is a major merge blocker. |
| `tests/security/connector-credential-vault.test.ts` | Uses an isolated PostgreSQL test database | Verifies encryption-at-rest, tenant isolation, update/delete behavior, corrupt ciphertext handling and duplicate-row rejection. |
| `sync-*.ts` | Reads operator-provided JSON exports | One-off utilities, not request-time persistence. Review each before any production use. |
| `src/db/postgres.ts` | Filesystem checks for Unix socket paths | Connection resolution only, not application data persistence. |
| `scripts/patches/*.ts` | Reads/writes source files | Repository maintenance scripts, not runtime application storage. |

## PostgreSQL schema and remaining gaps

| Domain | Existing PostgreSQL table/schema | Remaining verification |
|---|---|---|
| Leads | `leads` | Current Drizzle services use tenant-scoped queries, but root `server.ts` still uses legacy JSON methods for lead creation/update and some reads. Migrate and verify every active route before claiming PostgreSQL is canonical. |
| Structured ledger | `structured_ledger_entries`; global advisory-lock sequence, row/truncate immutability triggers, insert-only reconciliation | Implemented behind `HAL_STRUCTURED_LEDGER_POSTGRES_ENABLED=true`. Repository integration tests cover concurrent writers, tenant-filtered reads, integrity verification, legacy prefix reconciliation, tamper detection and transaction rollback coupling. Still requires final CI on current head, broader route-level atomicity review, backup/recovery rehearsal and explicit production cutover approval. |
| Missions | `missions`, with `steps JSONB` | Confirm every active writer and reader uses tenant-scoped SQL. |
| Scheduler jobs | `scheduler_jobs` | Confirm all create/update/list paths use PostgreSQL and tenant-scoped predicates. |
| Notifications | `notifications` | Confirm all producers and read/mark-read paths use PostgreSQL. |
| Outreach sequences | `outreach_sequences`, with `steps JSONB` | Verify all CRUD paths and ownership checks. |
| Client projects | `client_projects`, with `milestones JSONB` and `assets JSONB` | Verify tenant-scoped CRUD and uniqueness/handling of portal access tokens. |
| Learning state | `neural_state`, keyed by `singleton` for system defaults and `tenant:<contractorId>` for authenticated tenants | Authenticated learning routes now use cached tenant-specific engines and rows; initialization is lazy and persisted state is loaded before reads/writes. The legacy system singleton remains for startup/default compatibility and must not receive tenant outcome writes. Add route-level multi-tenant tests and decide whether legacy singleton data can be retired. |
| Connector credentials | `connector_credentials`, with `encrypted_value` | Credential read/save APIs now use the transactional repository and legacy imports are insert-if-absent. Add end-to-end route/concurrency tests and reconcile historical duplicate rows before adding a unique constraint. |
| API keys | `api_keys`, with transitional `key_hash` and `prefix` columns | Startup no longer forces NOT NULL on potentially unbackfilled legacy rows. New-key creation must enforce both values in application validation until a versioned, data-aware backfill is shipped. |
| Password reset tokens | `password_reset_tokens` | Table existence alone does not establish a complete reset flow; token persistence, single-use semantics and delivery must be verified together. |
| Chat messages | `chat_messages` | Confirm every active UI/API path uses the same tenant-scoped PostgreSQL records. |
| Audit logs | `audit_logs` | Root-server audit writes now use awaited PostgreSQL inserts (including pre-login lockout events); the activity endpoint still merges legacy JSON history for backward compatibility. Finish a one-time, insert-only historical import and remove the legacy read path after reconciliation. |

## Risks still open

1. **Legacy JSON runtime remains active:** `server.ts` still imports the aggregate. Remaining direct calls are mostly compatibility imports/reads for contractor lookup, leads/win-loss during the explicit admin sync flow, legacy outreach/client-project/scheduler imports, connector credential import, audit-history display, and a development-only pipeline simulator. The two production lead-ingestion compatibility mirrors have not yet been fully removed. The static `src/` import guard does not yet cover the root server entrypoint.
2. **No versioned migration journal:** schema creation and upgrades remain embedded in `bootstrapPostgresTables()`. Bootstrap DDL is now transactional, so a failed run rolls back as a unit, but there is still no complete, versioned migration ledger for deployed schema revisions.
3. **API-key constraint transition:** hash/prefix columns intentionally remain nullable during the legacy transition, so startup no longer forces a NOT NULL upgrade against unknown row state. A versioned migration must inspect existing rows, safely backfill hashes/prefixes where possible, and enforce constraints only after verification.
4. **Learning-state tenant isolation:** Authenticated learning routes now use a tenant-keyed engine and `neural_state` row (`tenant:<contractorId>`), while the legacy `singleton` row is reserved for system defaults. Persistence failures remain fail-closed. Route-level tenant isolation tests, legacy singleton retirement semantics, and a bounded lifecycle for cached engines remain to be verified.
5. **Structured ledger cutover:** PostgreSQL append/read/verify and insert-only historical reconciliation are implemented behind a feature flag. Most server call sites use an async adapter. However, some business writes commit before the subsequent ledger append (including recommendation approval) were initially separate, but public landing-page lead creation, development inbound webhook updates, and recommendation approval now use transaction-aware appends. Continue auditing the remaining roadmap/simulator and workflow call sites for paired business writes, add route-level rollback/failure tests, and keep the feature flag disabled in production until that review and recovery rehearsal are complete.
6. **Connector integration wiring:** the credential read and save APIs now use the transactional PostgreSQL repository. Legacy JSON credentials are imported once per tenant/process with an advisory-lock-protected insert-if-absent operation, so an existing newer PostgreSQL secret is never overwritten. Connector health reads only tenant-scoped PostgreSQL records; provider connectivity remains unverified until a real provider probe succeeds.
7. **Production data state unknown:** no production row counts, JSON exports, or database contents were inspected. No production SQL was executed and no production data was changed.

## Next implementation sequence

1. Finish a route/service-level persistence trace for every active domain and confirm database failures are returned as failures, not swallowed.
2. Finish transaction-aware ledger writes or a durable outbox for business mutations, then test failure and retry semantics. The global append/verify repository, locking, immutability and legacy reconciliation are now implemented.
3. Add end-to-end connector route tests for concurrent legacy imports, tenant isolation, secret rotation and database failure behavior; complete CRM, finance, lesson and scheduler route persistence traces.
4. Extend fresh-pool, restart and unavailable-database tests to the other active persistence domains; verify no write is reported successful without a committed transaction.
5. Introduce a versioned migration journal and forward-only migrations for the remaining schema transitions, including the API-key hash/prefix backfill.
6. Determine whether any operator-held JSON export actually needs importing. If so, provide a dry-run-first, insert-only importer with duplicate/conflict reports, per-domain counts/checksums and no startup auto-import.
7. Remove the legacy JSON singleton and its JSON-specific tests only after all references and recovery requirements are accounted for.

## Scope and safety

- No production database was queried or modified.
- No production SQL or data migration was run.
- No deployment was performed.
- Changes remain on `workstream/database-persistence-neon`; `main` has not been modified by this workstream.
- Passing CI proves repository checks only; it does not substitute for a real Neon restart/failure test.
