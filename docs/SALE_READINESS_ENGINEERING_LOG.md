# HAL Sale-Readiness Engineering Log

**Working branch:** `fix/hal-sale-readiness`  
**Base branch:** `main`  
**Production deployment:** Not performed  
**Pull request:** https://github.com/isaJrKai/Hal-Argumentatio/pull/13

## Implemented in this working branch

### Security and tenant ownership
- Public landing-page inquiry ownership is resolved from the saved, published landing-page artifact. The anonymous request's `contractorId` is ignored.
- Landing-page requests validate publication status and bound user-supplied field lengths.
- Lead contact data is written to encrypted columns during the Postgres sync path; legacy plaintext contact columns are cleared during conflict updates.
- Connector credentials are encrypted with the existing AES-256-GCM vault before persistence.
- Legacy plaintext connector credentials are migrated to encrypted storage when read by the server.
- The credentials API returns configuration flags, never secret values.
- Resend credentials are accepted by the credential API; the Resend UI no longer persists its key in browser localStorage.
- Postgres connection and sync endpoints require the admin role.
- Browser-stored database URIs are no longer loaded or saved; legacy values are cleared.
- The active session JWT is no longer displayed or copyable in Settings.

### Financial correctness
- Financial overview MRR is calculated from active client-project retainers.
- Annualized contract run-rate is explicitly distinguished from recognized or collected revenue.
- Unsupported LTV, CAC, payback, churn, runway, historical MRR, and forecast values are represented as unavailable rather than filled with fabricated defaults.
- MCP financial health separates Google Ads platform-reported conversion value from recorded revenue.
- MCP no longer invents customer lifetime value, payback period, or attribution-health scores.
- Connector health distinguishes configured credentials from verified provider connectivity.

### CRM lifecycle
- CRM transitions use a canonical stage matrix.
- Supported legacy aliases are normalized.
- Unknown current or target stages fail closed.
- Tests cover canonical progression, aliases, illegal transitions, and idempotent updates.

### Dependency integrity
- The npm lockfile was regenerated from the current package manifest.
- Compatible dependency security fixes were applied.
- The temporary lockfile-repair workflow was removed after the lockfile was repaired.


### Follow-on implementation (2026-11-01)
- Added dedicated landing-page template types for sump pump, waterproofing, flood restoration, and emergency contractor dispatch.
- Added four specialist templates using the existing builder structure. New templates start with owner-configurable business details and disable unverified reviews, ratings, prices, licence claims, service areas, response promises, galleries, booking links, and sticky call CTAs.
- Added unit coverage for template availability and evidence-safety defaults.
- Added a route-specific anonymous write rate limit to public audit booking, landing-page lead intake, and delivery webhook routes.
- Added bounded field validation to public audit booking and require a name plus at least one contact method.
- Moved third-party integration credential controls into a collapsed Advanced section so routine workspace settings are less cluttered; credential values remain encrypted and are not exposed in the UI.
- Improved the HAL Bible specification/manual reading layout: larger body text and line-height, wrapping for long file/metadata values, and stacked metadata rows on narrow screens.
- Hardened CORS configuration diagnostics: production now warns clearly when no browser origins are configured; malformed entries and non-HTTPS non-local origins are rejected rather than silently accepted. Exact production origin values still must be supplied in deployment environment settings.
- Added a real Phase 5 system-check action: tenant-scoped database reachability and lead count, cryptographic ledger integrity, AI key-configuration flags, process uptime/memory/runtime version, and an audit-ledger record. The UI explicitly distinguishes configured keys from verified provider connectivity and does not claim the 11-layer brain is synchronized.
- Corrected the JWT default session lifetime from 30 days to the documented 24 hours and added regression coverage for the default and explicit shorter expirations.
- Follow-on implementation verified by GitHub Actions run 266: TypeScript and automated tests passed, production build passed, and production dependency audit passed its release gate. This run covered 30 test files and 162 tests. Two moderate production dependency advisories remain; there are zero high/critical advisories.

## Verification evidence

Latest GitHub Actions run:
https://github.com/isaJrKai/Hal-Argumentatio/actions/runs/41277553971

Verified in run 266:
- `npm ci`: passed.
- Type-check and automated tests: passed.
- 30 test files passed.
- 162 tests passed.
- Production build: passed.
- Production dependency audit: passed release gate with 0 high/critical advisories.

Two moderate production dependency advisories remain:
- Express 4.x.
- qs (transitive dependency).

They were not force-upgraded across a potentially breaking major-version boundary.

## Not verified / remaining work

- No live email, SMS, WhatsApp, Google Workspace, Google Ads, Meta Ads, Stripe, or other provider delivery was performed.
- A configured API key is not proof that the provider connection works; connector status now reports this honestly.
- No production database migration or live data repair was run.
- No production deployment was performed.
- Historical customer contract duration, churn cohorts, cash balance, operating burn, and campaign-to-won-customer attribution are not yet represented sufficiently to calculate LTV, churn, runway, payback, or a validated forecast.
- Workspace panels, public pages, and the command palette are lazy-loaded. In the first verified split build, the main entry chunk was 593.78 kB (173.23 kB gzip), with large tools such as Google Drive and the map module emitted as separate chunks. The entry chunk still exceeds Vite's 500 kB warning threshold, so further shared-dependency splitting remains an optimization item.

## Release rule

Keep this branch as a draft for independent review. Do not merge or deploy until the latest CI is green and the owner has reviewed the diff and accepted the remaining limitations.


### Communications implementation follow-on (2026-11-01)
- Added a server-only Resend adapter using the existing `RESEND_API_KEY` and `HAL_SENDER_EMAIL` environment variable names. The browser never receives the provider secret.
- Added recipient, sender, subject, and message validation; text plus HTML-safe message rendering; request timeout; and non-sensitive provider error handling.
- The authenticated dispatch endpoint now supports an explicit `mode: live` for email only. It reports `submitted` only after Resend returns a provider message ID; it does not call this delivered.
- Added a tenant-scoped in-process limit of five live email submissions per ten-minute window.
- The communications UI now requires an explicit switch from Simulation to Live email. SMS and WhatsApp live actions remain unavailable and cannot be sent through this endpoint.
- Bridge readiness reports Resend as configured-but-unverified only when both server environment variables are present.
- Updated README communications claims to distinguish live email submission from simulated SMS/WhatsApp and to disclose that dispatch history is not yet a durable outbox.
- Added five unit tests for missing credentials, recipient validation, HTML escaping, provider rejection, and missing provider message IDs.

### Communications limitations still open
- Resend submission has not been tested against the production account because production environment values and a verified sender domain have not been inspected.
- Resend delivery webhooks, signature verification, durable event storage, and delivered/bounced status reconciliation are not implemented.
- Dispatch history remains process-memory based; the structured audit ledger is not a substitute for a transactional outbox.
- SMS/Twilio and WhatsApp Cloud API live sending, retries, idempotency, and inbound delivery/reply reconciliation remain outstanding.
- The current in-process email rate limit is a safety guard, not a distributed or durable abuse-control system.


### Neon migration safety follow-on (2026-11-01)
- Changed the admin Neon sync endpoint to preview by default. The preview reports local record counts, existing Neon counts, and the number of missing lead and win/loss IDs; it does not write rows.
- Commit mode now requires an explicit `confirm: true` after preview.
- The Settings action now runs preview first and asks for confirmation before the commit request.
- Lead and win/loss syncs use `ON CONFLICT DO NOTHING`; existing Neon records are never updated from the legacy JSON store.
- Lead sync writes contact data only to encrypted columns, marks imported leads `UNVERIFIED_STAGING`, and leaves unmeasured SEO, review, SSL, performance, urgency, LTV, and lost-revenue metrics null.
- Learned weights are inserted only when the global record is absent; existing Neon weights are not overwritten.
- Inserts are idempotent, so a partial additive sync can be safely previewed and retried. A live Neon preview/commit has not been run in this environment.
