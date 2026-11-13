# Security and Multi-Tenant Isolation Audit

**Scope:** repository review of the current `main` snapshot and a focused remediation on `security/sse-session-revocation`. No destructive production tests were performed and no production deployment was attempted.

## Confirmed finding fixed in this branch

### HIGH — SSE accepted revoked/deleted-account JWTs
**Area:** `GET /api/events` in `server.ts` (previous implementation).

The SSE route independently called `verifyToken` and trusted the JWT's `contractorId`. Unlike the shared `authenticate` middleware, it did not consult the durable `revoked_tokens` table or verify that the contractor still existed in PostgreSQL. A bearer token remained usable for the lifetime of the JWT on the realtime channel after logout/revocation or account deletion. This bypassed the application's normal session invalidation and current-account checks. The stream is tenant-bound to the JWT claim, so the demonstrated issue is stale-session access rather than a proven cross-tenant IDOR.

**Fix:** SSE now delegates both Authorization-header and EventSource query-string tokens to the shared `authenticate` middleware. It therefore applies signature/expiry verification, durable token revocation, and current account lookup before registering a stream. SSE responses also set no-store and no-referrer headers. A regression guard test ensures the route cannot silently revert to direct JWT-only validation.

## Additional confirmed finding fixed in this branch

### HIGH — Authenticated non-admins could invoke administrative Git operations
**Area:** `GET /api/admin/git/status` and `POST /api/admin/git/push` in `server.ts`.

Both routes previously required authentication but did not require the administrator role. The push handler ran shell commands against a server-side Git checkout, accepted request-controlled repository, branch, commit-message and token values, and force-pushed to a remote. In addition to being an authorization failure, interpolating untrusted values into shell command strings created command-injection exposure.

**Fix:** The status endpoint now requires `requireRole('admin')`. The legacy push endpoint now requires the same role and returns HTTP 410 without executing Git commands. This removes the unsafe server-side force-push capability; reviewed CI/CD is the supported deployment path. A regression test checks both protections and ensures the endpoint contains no shell execution.

## Additional confirmed finding fixed in this branch

### HIGH — Unauthenticated public routes exposed unpublished contractor artifacts
**Area:** `GET /api/public/landing/:id` and `GET /landing/:id` in `server.ts`.

Both public routes previously loaded artifacts by ID without checking publication status or artifact type. The JSON route returned the entire database row, including `contractorId`, metadata and the full content payload. The HTML route rendered `renderedOutput` for draft, ready and archived artifacts as well as deployed pages. This allowed anyone possessing or discovering an artifact ID to access unpublished contractor work.

**Fix:** Both routes now require a published status (`ready` or `deployed`) and `toolId = 'landing_page'`. The JSON route returns an explicit public-field projection rather than the full row. Public responses set no-store, no-referrer and nosniff headers, and database failures return generic errors.

### MEDIUM — Public audit reports included internal sales intelligence
**Area:** `GET /api/public/audit/:id` in `server.ts`.

The unauthenticated report response included internal lead notes, urgency score and predicted deal LTV. These fields are not used by the public audit page and should not be disclosed to prospects or anyone holding the report ID.

**Fix:** Removed those internal fields from the public response while preserving the report's public technical assessment data. A regression test guards the response projection.

## Additional confirmed finding fixed in this branch

### CRITICAL — Legacy MCP event and task tools returned cross-tenant records
**Area:** `src/services/mcp/halMcpServer.ts`, `hal_list_events`, `hal_list_tasks`, and `hal_status`.

The legacy shared-secret MCP server correctly resolved an explicit configured contractor for most tools, but three query paths omitted tenant filters:
- `hal_list_events` selected all rows from `lead_events` without joining to the owning lead and filtering by `leads.contractor_id`.
- `hal_list_tasks` selected all `scheduler_jobs` rows.
- `hal_status` reported global lead-event and scheduler-job counts.

An MCP client connected for one configured contractor could therefore read another contractor's event history and scheduled jobs, and infer global activity through status counts.

**Fix:** Event history now joins through the owning lead and filters on the authenticated/configured contractor. Scheduler-job listing and counts now filter by `scheduler_jobs.contractor_id`. The status event count uses the same tenant join. A regression test guards all three query paths.

## Additional confirmed finding fixed in this branch

### HIGH — Contractor-controlled landing-page content could execute as stored XSS
**Area:** `src/components/landing/htmlGenerator.ts` and public landing-page rendering.

The landing-page HTML generator interpolated contractor/AI-provided business details and section content directly into HTML text and attribute contexts. It also embedded page identifiers and business details directly into JavaScript string literals. A crafted value containing HTML/script delimiters could break out of its intended context and execute script when a published page was viewed on the HAL origin.

**Fix:** The generator now recursively HTML-escapes dynamic string values before HTML interpolation, serializes the small set of inline form data with `JSON.stringify` and escapes script-closing delimiters, and no longer embeds the contractor ID in the public form request. The save API now requires a page configuration and always renders it server-side; client-supplied HTML is ignored. Public serving additionally requires a matching server-owned `pageConfig.id` and `pageConfig.contractorId`, so raw AI/provider HTML artifacts without that trusted config are not published. A regression test exercises malicious business name, city, section text and page ID values.

## Newly confirmed findings from the follow-up review

### HIGH — Administrator workspace APIs mix a hard-coded seed tenant into the signed-in administrator's workspace
**Area:** `getTargetContractorIds()` in `server.ts`, consumed by the leads, revenue, campaigns, forecasts and recommendations list routes.

The helper returns both `con_admin_seed` and the authenticated administrator's contractor ID whenever the persisted role is `admin`. This means those ordinary workspace endpoints intentionally combine records from a second tenant into the administrator's workspace. It is not a general all-tenant query, but it is still an implicit cross-tenant exception and makes tenant boundaries depend on a magic account ID.

**Implementation in PR #90:** ordinary workspace APIs now resolve only the authenticated contractor ID for every role; the `con_admin_seed` exception is removed. Platform account administration is separated into admin-only metadata and aggregate endpoints. No tenant business records are exposed by the new admin APIs. Any future exceptional support access must use an explicit, time-limited, reason-recorded support session. CI and production verification remain pending.

### HIGH — No dedicated platform administrator console or account suspension state exists in the current schema
**Area:** `src/App.tsx`, `src/db/schema.ts`, and `contractors` bootstrap DDL.

The UI has no dedicated admin console. The contractor schema has a persisted `role` but no persisted account status, so there is no durable account suspension control that shared authentication can enforce. Existing admin-only system controls do not constitute a platform account-management console.

**Implementation in PR #90:** added a persisted account status with an additive PostgreSQL migration, server-side suspension enforcement, an admin-only contractor directory, role/status actions, and audit logging. Self-demotion/suspension and removal of the final active administrator are blocked. No administrator is auto-provisioned; an existing persisted admin role is required. CI and production verification remain pending.

## Prioritized review observations

| Priority | Area | Observation / remaining evidence |
|---|---|---|
| CRITICAL | Tenant isolation | The legacy MCP event/task leaks described above are fixed in this branch. Many inspected REST routes derive tenant identity from `req.contractorId` and include contractor predicates, but a complete route-by-route and end-to-end two-account audit is still required before asserting all tenant boundaries hold. |
| RESOLVED IN PR #120 | MCP | The shared secret is accepted only through the dedicated `X-HAL-MCP-Secret` header on `POST /mcp`; the URL-secret route is removed. Deploying this change requires updating MCP clients to send the header and rotating `MCP_SECRET` if it was previously used in URLs. Confirm proxy logging excludes the dedicated header. |
| MEDIUM | SSE token transport | EventSource query-string token support remains for compatibility. Query tokens may be recorded by infrastructure logs and browser history. The patch adds no-store/no-referrer response headers but cannot prevent upstream request logging. Prefer a same-site, HttpOnly, Secure cookie or a short-lived, single-use stream ticket. |
| MEDIUM | Rate limiting | Several observed limits use process-local Maps. They reset on restart and are not shared across multiple Render instances; they are not a reliable distributed abuse control. Use a shared store or edge/WAF limits for production. |
| MEDIUM | API-key schema migration | Startup bootstrap upgrades the legacy `api_keys` table and sets `key_hash` / `prefix` NOT NULL. Confirm this migration against a disposable copy containing legacy rows before relying on automatic bootstrap; the repository comment states the known database had zero API-key rows. No active API-key authentication route was found in the inspected server, so validation/revocation behavior remains unverified. |
| MEDIUM | Secret history | The sale-readiness document records historical sample auth/encryption values and a runtime data file containing account/session material. Current-file cleanup does not remove Git history. Complete history scanning and rotate any value that was ever live. |
| MEDIUM | Password hash migration | New passwords use bcrypt cost 12. Legacy PBKDF2 hashes remain accepted for compatibility and are upgraded after successful login, but the legacy derivation uses a fixed salt and only 1,000 iterations. Inventory remaining legacy hashes and require a secure password reset for dormant accounts rather than leaving weak hashes indefinitely. |
| LOW | Error/log hygiene | Authentication and service errors are generally returned generically, but several catch blocks log raw error objects. Review provider/database errors for embedded request data or connection strings before broad production log access. |

## Explicitly not claimed

- No production tenant-to-tenant exploit was executed.
- No live production account, database, secret, or customer data was accessed or modified.
- No complete dependency advisory scan, full Git-history secret scan, all-route authorization audit, or end-to-end two-tenant API/MCP test was completed in this focused pass.
- PostgreSQL TLS verification, lead PII encryption, password-reset persistence, and existing proxy-aware controls were not changed.

## Verification

- Added `tests/security/sse-session-auth.test.ts` as a regression guard for the SSE route's use of shared authentication and response cache/referrer protections.
- Run `npm run test:security`, `npm run lint`, and `npm run build` in CI before merge.
- Follow-up release gate: execute two-account negative tests for every data-bearing REST route and MCP tool against an isolated test database; verify read, update, delete, nested-resource, export, and websocket/SSE paths.
