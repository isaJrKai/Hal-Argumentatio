# HALBiz database persistence audit

**Workstream branch:** `workstream/database-persistence-neon`  
**Audit baseline:** `main` at the repository revision inspected on 2026-11-05  
**Status:** Audit findings documented; one legacy-store data-loss defect has been fixed on this branch. The Neon runtime migration and restart/failure tests are not yet complete. This document is not a completion claim.

## Implementation progress (2026-11-05)

- `src/db/db.ts` now fails startup when `data/db.json` cannot be parsed or is not a JSON object. It no longer replaces an unreadable file with empty defaults.
- `tests/security/legacy-database-corruption.test.ts` covers malformed JSON and non-object JSON inputs.
- The workstream branch was synchronized with current `main` before further migration work; latest-main changes are retained.
- CI for the latest synchronized commit is queued. Earlier commits passed CI, but that does not validate the latest merge commit.
- No production database was queried or modified.

## Executive finding

HALBiz currently has two persistence paths:

1. The legacy `src/db/db.ts` singleton loads and saves the complete application state as `data/db.json` using synchronous Node filesystem operations.
2. The PostgreSQL path uses `pg` and Drizzle through `src/db/index.ts`, `src/db/postgres.ts`, and `src/db/schema.ts`.

A configured Neon connection therefore does not prove that all application writes are durable. The legacy database still initializes during module load and its `save()` method writes the JSON file. On Render without a persistent disk, writes to that path are ephemeral.

## Local file persistence inventory

| Location | Operation | Meaning | Production assessment |
|---|---|---|---|
| `src/db/db.ts` | `existsSync`, `readFileSync`, `mkdirSync`, `writeFileSync` against `data/db.json` | Loads, mutates and serializes the legacy aggregate store | **Critical**: not durable on ephemeral Render filesystem. At the audit baseline, malformed JSON entered a reset-and-save path; the branch now fails startup instead of overwriting the unreadable file. |
| `tests/security/connector-credential-vault.test.ts` | Reads `data/db.json` | Test asserts credential persistence in the JSON store | Test encodes the legacy implementation, not Neon durability |
| `sync-*.ts` | Reads an operator-provided JSON export | One-off import/synchronization utilities | Not a request-time runtime store; must be reviewed before use against production because scripts may not be uniformly idempotent |
| `src/db/postgres.ts` | Filesystem checks for configured Unix socket paths | Resolves a database socket | Not application data persistence |
| `scripts/patches/*.ts` | Reads/writes source files | Repository maintenance scripts | Not runtime application data persistence |

The legacy `DBStructure` includes contractors, sessions, password resets, leads, lead events, campaigns, performance snapshots, revenues, forecasts, prediction outcomes, learning insights, recommendations, lessons, outcome records, API keys, notifications, system audit logs, structured ledger entries, scheduler jobs, missions, chat messages, win/loss records, outreach sequences, client projects and connector credentials.

## Canonical PostgreSQL mapping and gaps

| Domain | Existing PostgreSQL table/schema | Finding / next action |
|---|---|---|
| Audit logs | `audit_logs` / Drizzle `auditLogs` | Existing route/MCP reads use PostgreSQL. Reconcile legacy `systemAuditLogs` writes and column nullability: bootstrap SQL permits nullable `contractor_id`, while Drizzle requires it. |
| Structured ledger | No `structured_ledger` table found in Drizzle schema or bootstrap SQL | **Missing canonical table.** The hash-chained ledger remains in `db.ts` JSON state; needs a normalized append-only table, uniqueness on tenant/sequence, and atomic hash-chain writes. |
| Missions | `missions` with `steps JSONB` | Canonical table exists and MCP/Hermes consumers read it. Migrate remaining legacy route writes and verify tenant scoping and step updates. |
| Scheduler jobs | `scheduler_jobs` | Canonical table exists and MCP reads it. Verify all create/update/list routes use it; ensure tenant-scoped reads (legacy interface permits global listing). |
| Notifications | `notifications` | Canonical table exists and MCP reads it. Verify every notification producer and read/mark-read route uses PostgreSQL. |
| Outreach sequences | `outreach_sequences` with `steps JSONB` | Canonical table exists and MCP reads it. Verify CRUD paths and tenant ownership. |
| Client projects | `client_projects` with `milestones JSONB`, `assets JSONB` | Canonical table exists and MCP/portal code reads it. Verify all writes use tenant-scoped SQL; portal token lookup needs uniqueness and token-handling review. |
| Connector credentials | `connector_credentials` with `encrypted_value` | Canonical encrypted table exists, but legacy getter/setter and security tests still use the JSON aggregate. Move runtime reads/writes to PostgreSQL; do not copy plaintext or replace existing ciphertext. |
| API keys | `api_keys` with `key_hash`, `prefix` | Bootstrap attempts to make `key_hash` and `prefix` NOT NULL after adding nullable columns. Existing legacy rows without these values can make startup DDL fail. Verify production row state before any backfill/constraint change. |
| Password reset tokens | `password_reset_tokens` | PostgreSQL schema exists; product docs say reset remains disabled until durable token persistence and delivery are complete. Do not enable based on table existence alone. |
| Chat messages | `chat_messages` | PostgreSQL table exists and is used by chat/project flows; the legacy aggregate also contains a separate chat history shape. Confirm all active UI/API consumers use the same PostgreSQL records. |

## Migration and failure-mode risks

1. **No safe runtime source selection:** the legacy singleton initializes unconditionally and continues to save to local JSON. Production can therefore appear to accept writes that disappear on restart.
2. **Malformed-file data loss — fixed on this branch:** the legacy store now rejects malformed/non-object JSON and aborts startup without calling `save()`. A regression test covers malformed and non-object content. This protects the file but does not make the JSON store durable on Render.
3. **No complete migration ledger:** schema creation and upgrades are embedded in a large `bootstrapPostgresTables()` SQL batch. There is no evidence in the inspected files of a versioned migration journal tracking every deployed schema revision.
4. **Potentially unsafe API-key constraint migration:** bootstrap adds nullable hash/prefix columns and then immediately sets them NOT NULL. This is safe only if the target table has no legacy rows (a code comment asserts zero rows, but this audit has not queried production).
5. **Silent in-memory fallback:** `AutonomousLearningEngine.initializeFromDb()` catches database errors and keeps defaults; `saveState()` catches write failures and logs a warning. Callers can continue with state that was not durably saved.
6. **Legacy import scripts need a dry-run and reconciliation contract:** scripts read `HAL_SOURCE_JSON`/ `data/db.json`; they must not be run against production until each domain has deterministic mapping, conflict reporting, idempotent insert semantics, and pre/post row-count checks.
7. **No production data was queried or modified for this audit.** No production SQL was executed.

## Implementation plan (ordered)

1. Introduce a versioned, forward-only migration for the structured ledger, with immutable rows and a tenant/sequence uniqueness constraint. Preserve the existing hash fields and validate the chain after import.
2. Move connector credential CRUD to `connector_credentials`, retaining the existing encryption envelope and tenant/service uniqueness. Keep secrets out of logs and migration reports.
3. Complete PostgreSQL repositories and route wiring for scheduler jobs, notifications, missions, outreach sequences, client projects and system audit logs. Remove the corresponding legacy store methods only after consumer coverage is proven.
4. Build an operator-run JSON-to-Neon importer that defaults to dry-run, inserts without overwriting existing IDs, reports duplicates/conflicts, and verifies per-domain counts/checksums. Do not automatically import at application startup.
5. Fail closed on unreadable legacy JSON — implemented on this branch. The broader requirement remains: production writes must never report success unless the PostgreSQL transaction commits.
6. Add integration tests using a real PostgreSQL-compatible test database (PGlite or an isolated PostgreSQL service): write, dispose/recreate the application/repository, read back; simulate connection loss and assert writes fail without memory-only success; test migration idempotency and conflict preservation.

## Evidence and scope limits

Inspected on the repository default branch: `src/db/db.ts`, `src/db/index.ts`, `src/db/postgres.ts`, `src/db/schema.ts`, `server.ts`, `src/lib/autonomousLearning.ts`, `tests/schema/schema-drift.test.ts`, `tests/security/connector-credential-vault.test.ts`, `data/db.example.json`, `package.json`, and `AUDIT.md`.

Code search also located PostgreSQL reads in `src/services/mcp/halMcpServer.ts`, `src/services/mcp/dispatcher.ts`, `src/services/hermesLab.ts`, and client portal route patch history. A complete route-by-route write trace and full repository filesystem scan remain outstanding. This audit intentionally does not infer production row counts or claim that current Render records can be recovered from an ephemeral disk.
