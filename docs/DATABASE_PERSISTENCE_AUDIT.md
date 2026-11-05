# HALBiz database persistence audit

**Workstream branch:** `workstream/database-persistence-neon`  
**Main baseline:** `080726d677823eeef69bc1cd882367fc8d12ebc1`  
**Status:** Runtime JSON-store references identified and reduced; broader Neon durability verification and migration hardening remain incomplete. This is not a completion claim.

## Executive finding

HALBiz's server entrypoint uses PostgreSQL/Drizzle: `server.ts` imports the application pool and calls `bootstrapPostgresTables(pool)`; its lead-PII migration is transactional. Core services such as work-ledger, work-task, Hermes and forecasting code use the PostgreSQL schema.

A separate legacy singleton remains in `src/db/db.ts`. It loads and saves a complete `data/db.json` aggregate synchronously. It is not the canonical server database path. A source-import trace found `src/skills/geo-map.ts` as the only direct application-source consumer of that singleton; this branch moves that skill to a tenant-scoped Drizzle query. The PII migration helper was also decoupled from the legacy singleton by extracting encryption into `src/db/encryption.ts`. A static regression test now rejects future direct imports of the JSON store from `src/`.

This substantially reduces the risk that normal server requests are writing to ephemeral local JSON, but it does not yet prove every runtime persistence path is durable, tenant-safe, and failure-closed.

## Implemented on this branch

1. **Malformed JSON fails closed.** `parseLegacyDatabase` rejects malformed and non-object JSON. The legacy store now aborts startup instead of catching a parse error and overwriting the file with empty defaults. In test mode, its file is isolated under a per-process temporary directory rather than sharing the repository's `data/db.json` path. Regression tests cover malformed and non-object values.
2. **Geo-map uses Neon.** `src/skills/geo-map.ts` now reads leads through `src/db/index.ts` and the Drizzle `leads` table, always filtering by `contractorId`. It omits phone/email because the canonical table stores encrypted contact fields and the visualization does not need to expose them.
3. **Encryption no longer imports the JSON singleton.** AES-256-GCM helpers live in `src/db/encryption.ts`. `db.ts` re-exports them for legacy tests, while `leadPiiMigration.ts`, the encryption unit tests and tenant-isolation tests import the standalone module. The legacy JSON parser is also isolated in `src/db/legacyJsonStore.ts`, so parser tests do not initialize the singleton.
4. **Runtime import guard.** `tests/security/legacy-json-store-runtime-boundary.test.ts` scans application source for direct imports of the legacy JSON aggregate store.
5. **Branch synchronization.** The workstream is based on current `main` and is no longer behind it.

## Local file persistence inventory

| Location | Operation | Current assessment |
|---|---|---|
| `src/db/db.ts` | Synchronous load/save of `data/db.json` | Legacy compatibility/test store. Direct app-source consumer identified in geo-map has been migrated. Retain only until all legacy test/migration dependencies are deliberately removed. |
| `tests/security/connector-credential-vault.test.ts` | Uses an isolated PostgreSQL test database | Verifies encryption-at-rest, tenant isolation, update/delete behavior, corrupt ciphertext handling and duplicate-row rejection. |
| `sync-*.ts` | Reads operator-provided JSON exports | One-off utilities, not request-time persistence. Review each before any production use. |
| `src/db/postgres.ts` | Filesystem checks for Unix socket paths | Connection resolution only, not application data persistence. |
| `scripts/patches/*.ts` | Reads/writes source files | Repository maintenance scripts, not runtime application storage. |

## PostgreSQL schema and remaining gaps

| Domain | Existing PostgreSQL table/schema | Remaining verification |
|---|---|---|
| Leads | `leads` | Tenant-scoped Drizzle queries are used by current services; verify all create/update/delete paths and ensure encrypted contact fields remain the only persisted PII. |
| Structured ledger | No `structured_ledger` table found in current Drizzle schema/bootstrap | The legacy hash chain has no canonical PostgreSQL table. Add an append-only, transactionally sequenced store and verify hash continuity before migrating any historical entries. |
| Missions | `missions`, with `steps JSONB` | Confirm every active writer and reader uses tenant-scoped SQL. |
| Scheduler jobs | `scheduler_jobs` | Confirm all create/update/list paths use PostgreSQL and tenant-scoped predicates. |
| Notifications | `notifications` | Confirm all producers and read/mark-read paths use PostgreSQL. |
| Outreach sequences | `outreach_sequences`, with `steps JSONB` | Verify all CRUD paths and ownership checks. |
| Client projects | `client_projects`, with `milestones JSONB` and `assets JSONB` | Verify tenant-scoped CRUD and uniqueness/handling of portal access tokens. |
| Connector credentials | `connector_credentials`, with `encrypted_value` | Transactional repository and PostgreSQL tests now exist. Wire it to any future/current connector integration consumers; preserve the AES envelope and reconcile historical duplicate rows before adding a unique constraint. |
| API keys | `api_keys`, with transitional `key_hash` and `prefix` columns | Startup no longer forces NOT NULL on potentially unbackfilled legacy rows. New-key creation must enforce both values in application validation until a versioned, data-aware backfill is shipped. |
| Password reset tokens | `password_reset_tokens` | Table existence alone does not establish a complete reset flow; token persistence, single-use semantics and delivery must be verified together. |
| Chat messages | `chat_messages` | Confirm every active UI/API path uses the same tenant-scoped PostgreSQL records. |
| Audit logs | `audit_logs` | Reconcile bootstrap nullability with Drizzle schema and verify all writes/read paths use consistent tenant semantics. |

## Risks still open

1. **No versioned migration journal:** schema creation and upgrades remain embedded in `bootstrapPostgresTables()`. Bootstrap DDL is now transactional, so a failed run rolls back as a unit, but there is still no complete, versioned migration ledger for deployed schema revisions.
2. **API-key constraint transition:** bootstrap adds nullable hash/prefix columns and then sets them NOT NULL. Existing rows without values can make startup DDL fail. Do not run production changes without inspecting row state and preparing a safe backfill.
3. **Silent learning-state fallback:** `AutonomousLearningEngine` catches initialization/save errors and can continue with defaults or memory-only state. Critical writes must surface persistence failure to callers.
4. **Structured ledger gap:** hash-chain entries remain in the legacy JSON store; PostgreSQL needs a transactionally serialized append path before the legacy implementation can be retired.
5. **Learning-state writes now fail closed:** learning outcome updates and offline-mode changes await PostgreSQL persistence and roll back in-memory state when the write fails. The API no longer reports a successful update after a swallowed database error. Learning-state audit rows now use PostgreSQL `audit_logs` rather than the legacy JSON aggregate.6. **Connector integration wiring:** the credential read and save APIs now use the transactional PostgreSQL repository. Legacy JSON credentials are imported once per tenant/process with an advisory-lock-protected insert-if-absent operation, so an existing newer PostgreSQL secret is never overwritten. Connector health reads only tenant-scoped PostgreSQL records; provider connectivity remains unverified until a real provider probe succeeds.
7. **Production data state unknown:** no production row counts, JSON exports, or database contents were inspected. No production SQL was executed and no production data was changed.

## Next implementation sequence

1. Finish a route/service-level persistence trace for every active domain and confirm database failures are returned as failures, not swallowed.
2. Add the structured-ledger table and an atomic append/verify repository using a transaction-level lock, immutable rows, global sequence ordering matching the current chain, and unique sequence/hash constraints.
3. Complete connector-credential end-to-end route tests, including concurrent legacy imports, tenant isolation, secret rotation and database failure behavior.
4. Extend the fresh-pool and unavailable-database tests to the other active persistence domains; verify no write is reported successful without a committed transaction.
5. Review and version the bootstrap DDL. Resolve API-key constraints and audit-log nullability with forward-only migrations.
6. Determine whether any operator-held JSON export actually needs importing. If so, provide a dry-run-first, insert-only importer with duplicate/conflict reports, per-domain counts/checksums and no startup auto-import.
7. Remove the legacy JSON singleton and its JSON-specific tests only after all references and recovery requirements are accounted for.

## Scope and safety

- No production database was queried or modified.
- No production SQL or data migration was run.
- No deployment was performed.
- Changes remain on `workstream/database-persistence-neon`; `main` has not been modified by this workstream.
- Passing CI proves repository checks only; it does not substitute for a real Neon restart/failure test.
