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
- These follow-on commits have not yet been verified by a fresh CI run. Do not treat them as release-ready until CI/type-check/build pass.

## Verification evidence

GitHub Actions run:
https://github.com/isaJrKai/Hal-Argumentatio/actions/runs/41251478698

Verified in that run:
- `npm ci`: passed.
- Type-check and automated tests: passed.
- 28 test files passed.
- 157 tests passed.
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
