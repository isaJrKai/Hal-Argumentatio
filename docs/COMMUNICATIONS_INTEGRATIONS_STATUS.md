# HAL Communications and Integrations — Operational Status

**Audit date:** 2026-11-05  
**Branch:** `fix/communications-integrations-reliability`  
**Production:** Render — `https://halbiz-full-application.onrender.com`  
**Scope:** Communications, Google Workspace, delivery reconciliation, credential boundaries

This report separates code implementation from provider configuration and live verification. Repository inspection is not evidence that a provider account, webhook, OAuth consent screen, or production secret is configured.

## Executive status

| Integration | Implemented in repository | Configuration status | Live verification | Honest capability |
|---|---|---|---|---|
| Resend outbound email | Yes — shared adapter, tenant-aware dispatch, PostgreSQL outbox, provider message ID | Unknown; production secrets/sender not inspected | Not verified against production recipient | Provider submission only; delivery requires signed webhook event |
| Resend delivery webhook | Yes — Svix signature validation, event persistence, outbox status reconciliation | Unknown; `RESEND_WEBHOOK_SECRET` not verified | Not verified against real Resend event | Can reconcile a matched message when a valid event arrives |
| Password reset email | Yes — hashed single-use PostgreSQL token and shared Resend adapter | Requires `RESEND_API_KEY`, `HAL_SENDER_EMAIL`, trusted `APP_URL` | Not verified against production mailbox | Submission is not delivery; undeliverable reset tokens are invalidated |
| WhatsApp inbound | Signature validation and Meta verification challenge implemented | App secret and verify token unknown | Not verified | Inbound message events fail closed until a verified phone-number-ID → tenant mapping exists; no cross-tenant broadcast |
| WhatsApp outbound | No live dispatch | Not configured | Not available | Simulation only; live requests return not implemented |
| SMS/Twilio | Tenant sender registration, explicit consent gate, live Twilio adapter, inbound STOP handling, signed status callbacks | Credentials and sender ownership unknown until configured | Not verified against a live number | Can submit consented SMS and reconcile signed delivery callbacks; provider submission is not delivery |
| Google Workspace authentication | Firebase Google OAuth flow with Drive, Calendar-read and Gmail-send scopes | Firebase web config / Google OAuth consent unknown | Browser OAuth not verified | User-authorized browser session; short-lived access token cached in sessionStorage |
| Google Drive | List/search, folder creation, upload and delete API calls implemented | Requires Firebase + Google OAuth and Drive scope approval | Not verified | Code path exists; account access and operations unverified |
| Google Calendar | Read-only event listing implemented | Requires Calendar read scope approval | Not verified | Read-only; event creation/update is not implemented |
| Gmail sending | Gmail API send helper and connector test action implemented | Requires Gmail send scope approval | Not verified | Explicit user-authorized send; not a verified delivery guarantee |

## Findings and changes in this workstream

### 1. Resend and delivery reconciliation

- The shared Resend adapter validates sender and recipient configuration, rejects provider errors, requires a provider message ID, escapes generated HTML, and returns `submitted` rather than `delivered`.
- Live email dispatch writes a tenant-scoped encrypted communications outbox record before provider submission. The response and audit events correctly distinguish provider acceptance from recipient delivery.
- `POST /api/webhooks/resend` verifies Svix signatures against the exact raw request body, applies a timestamp tolerance, deduplicates event IDs, persists delivery events, and reconciles matching outbox records.
- The webhook can only reconcile records for which a provider message ID matches an outbox row. Unmatched events are retained without assigning them to a tenant.
- **Remaining:** production sender-domain verification, webhook endpoint registration/secret validation, and real delivery/bounce/complaint acceptance tests.

### 2. Password reset

- Reset tokens are random, stored as SHA-256 hashes, expire after one hour, and are single-use. Issuing a new token invalidates previous active tokens under a PostgreSQL transaction.
- **Fixed in this branch:** password-reset messages now use the shared Resend adapter instead of a separate inline HTTP implementation. The route no longer accepts a legacy bootstrap credential or a default sender address.
- **Fixed in this branch:** reset URLs are built only from the configured canonical `APP_URL`; request `Host`, `X-Forwarded-Host`, and `Origin` headers are not trusted for credential links.
- If Resend configuration or submission is unavailable, the just-created reset token is invalidated. The endpoint retains the same non-enumerating response for known and unknown accounts.
- **Remaining:** production mailbox test and delivery webhook confirmation. The reset endpoint does not claim a reset email was delivered.

### 3. WhatsApp

- Meta webhook verification challenge and HMAC-SHA256 signature checks are implemented.
- Signed inbound messages are deliberately rejected with HTTP 503 until a verified phone-number-ID to tenant mapping is available. This is a security control, not a provider outage to work around.
- **Implemented in this branch:** an authenticated workspace can register a phone-number ID only after its own saved Meta access token successfully reads that exact ID from the Graph API. A unique phone-number mapping prevents cross-workspace reassignment. Signed inbound messages resolve to exactly one mapped tenant and are encrypted at rest and deduplicated by Meta message ID.
- **Remaining:** real Meta account setup, token provisioning, webhook subscription, live two-workspace acceptance test, and a tenant-facing inbox/reply workflow. Live outbound dispatch is not implemented.

### 4. SMS

- Implemented in this branch: Twilio REST send adapter; workspace-owned number verification against the Twilio account inventory; explicit, encrypted consent evidence; fail-closed send gate requiring current opt-in; signed inbound webhook with STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT opt-out handling; signed status callbacks; and tenant-scoped outbox reconciliation.
- The consent endpoint stores an operator-recorded attestation and encrypted evidence note; it is not independent proof of the recipient's consent. Operators must record opt-in only after obtaining valid consent through the stated source.
- SMS dispatch returns `submitted`, never `delivered`; the status callback is required for delivery confirmation. Ambiguous provider/network errors are marked `unknown` and are not automatically retried because the Twilio create-message API path is not treated as idempotent.
- **Remaining:** configure Twilio credentials and verified number, set the exact canonical HTTPS inbound/status callback URLs, register both webhooks in Twilio, and run a real opt-in → send → delivered/undelivered → STOP acceptance test.

### 5. Google Workspace

- Firebase Google OAuth requests Drive, read-only Calendar, and Gmail-send scopes. It does not request Gmail read access.
- Drive list/search, folder creation, upload and delete helpers exist. Calendar listing is read-only. Gmail send is implemented through the Gmail API.
- Access tokens are cached in browser sessionStorage with a conservative expiry and cleared on logout/expiry.
- **Remaining:** production Firebase configuration, enabled Google APIs, OAuth consent-screen publication/test-user approval, scope verification, browser sign-in and live Drive/Calendar/Gmail tests.
- **Isolation qualification:** these Google API calls use the signed-in browser user's OAuth token; they are not server-side per-HAL-tenant OAuth connections. Do not claim centralized tenant connector isolation or server-side token custody for Google Workspace.

### 6. Outbox, retries and dead letters

- The PostgreSQL communications outbox stores encrypted recipient/subject/body values, tenant ID, idempotency key, attempts, provider message ID, submission/delivery timestamps and terminal/provider status fields.
- The initial dispatch path remains synchronous, with a separate durable worker now able to reclaim retryable and stale-processing records.
- **Implemented in this branch:** due-time scheduling, atomic concurrent claims, stale-processing recovery, bounded exponential backoff, maximum attempts, terminal failure/dead-letter statuses, and provider-side idempotency for Resend.
- **Remaining:** operator replay UI, operational alerting, and a trusted scheduler invocation. Configure `HAL_COMMUNICATIONS_WORKER_SECRET` (32+ characters) and call `POST /api/internal/communications/outbox/run` from a private scheduler. The endpoint itself is not a continuously running worker.

## Configuration required outside this PR

No production secrets are copied into Git or exposed in this report. An operator must verify the following in Render and Google/Meta provider consoles:

- Render: `RESEND_API_KEY`, `HAL_SENDER_EMAIL`, `RESEND_WEBHOOK_SECRET`, canonical HTTPS `APP_URL`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `HAL_COMMUNICATIONS_WORKER_SECRET` (32+ characters), `TWILIO_INBOUND_WEBHOOK_URL`, and `TWILIO_STATUS_CALLBACK_URL`.
- Resend: sender domain verified; webhook registered to `/api/webhooks/resend` for sent, delivered, delayed, bounced, complained, opened and clicked events; secret matches Render.
- Firebase/Google Cloud: Firebase web app values configured as build-time variables; Google sign-in enabled; Drive API, Calendar API and Gmail API enabled; OAuth consent and requested scopes approved.
- Meta: WhatsApp Business app, phone number, webhook subscription and app secret configured; tenant mapping must be explicitly provisioned and verified before enabling inbound routing.
- Twilio: configure tenant-owned Account SID/auth token and E.164 sender number, register it through `/api/outreach/sms/connect-number`, configure the exact HTTPS inbound/status callback URLs above in Twilio, and complete a real opt-in → send → delivery callback → STOP acceptance test before representing the integration as production-ready.

## Verification evidence

This PR adds unit/security coverage for trusted HTML email bodies, reset-link origin/delivery handling, outbox retries, Resend idempotency, Meta webhook signatures, Twilio SMS submission and Twilio callback signatures. Production provider and browser verification remain explicitly unverified because no provider-console access or production credentials are available in this repository audit.

## Production Render inspection (2026-11-05)

The user authorized inspection of the HALBiz Render workspace. The matching service was identified by exact service name, repository and production URL:

- Service: `halbiz-full-application` (`srv-dblj5ud9fdbs73dj4980`)
- Repository/branch: `isaJrKai/Hal-Argumentatio` / `main`
- Region/plan: Frankfurt / Free
- Auto-deploy: enabled on commits to `main`; PR branch is not the configured production branch.
- Latest deployment visible during inspection: succeeded at 2026-11-05 05:13 UTC, built from main commit `7c88a3abb281c4b111e2564466e2acc9fea2e608`.
- Startup logs report the HAL server listening on port 3000, PostgreSQL schema ready, and Render marking the service live.
- The inspected recent application log page contained no Resend, WhatsApp, Twilio/SMS, Google OAuth, Drive, Calendar, or Gmail activity. This is not proof those integrations are unconfigured; it only means no corresponding activity appeared in the retrieved log window/page.
- A production startup message reports initialization of an empty HAL data store and no default user accounts. This should be checked against the separately assigned database-persistence/authentication workstreams before any demo or account-state claims.

**Environment-variable limitation:** the available Render connection exposes service metadata and logs, and can write environment variables, but does not expose a read/list environment-variable operation. Therefore I could not verify whether the required keys are present without using an unsupported route. No secrets were read, changed, or disclosed. Render dashboard access or an operator-provided redacted key-name inventory is still needed to confirm presence (values must remain hidden).

No production environment, deploy, secret, service setting, or database was modified during this inspection.

## Release decision

**Do not treat this workstream as fully production-verified.** Password-reset submission is hardened; Resend has a durable retry/dead-letter worker but still needs a trusted scheduler and live provider acceptance; WhatsApp inbound has verified tenant routing and encrypted event persistence but still needs Meta account/webhook acceptance and a tenant inbox; WhatsApp outbound remains unavailable; Twilio SMS now has consent-gated send, opt-out and signed callback code but still needs account configuration and live acceptance; Google Workspace still needs OAuth/browser/provider acceptance.


## Follow-up implementation (2026-11-05)

- Added `communications_outbox.next_attempt_at` and an index for due work.
- Added a scheduler-invoked, bearer-secret-protected worker route. It processes only Resend email rows, claims work atomically, decrypts tenant-scoped content only in process memory, uses each tenant's saved Resend configuration, reuses the original idempotency key, and records submitted/retrying/failed/dead-letter outcomes.
- Initial synchronous email dispatch now records transient failures as retryable and permanent configuration errors as failed.
- Added a Meta phone-number registration endpoint that verifies the number using the registering workspace's saved WhatsApp token before storing a unique tenant mapping.
- Replaced WhatsApp inbound fail-closed placeholder with signature-verified, tenant-routed, encrypted and deduplicated inbound event persistence. Unknown phone-number IDs remain fail-closed.
- Added unit coverage for outbox claims, retry/dead-letter decisions, and Resend idempotency headers.

**Still not complete/live-verified:** Twilio credentials/number/webhook acceptance; Meta account configuration/webhook registration and real inbound acceptance; Google Workspace OAuth/browser/Drive/Calendar/Gmail acceptance. These require real provider setup and test accounts, which are not available through the repository connection. The worker also requires a trusted external scheduler; no Render service or cron job was created.
