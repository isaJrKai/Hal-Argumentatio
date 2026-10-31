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

## Verification evidence

GitHub Actions run:
https://github.com/isaJrKai/Hal-Argumentatio/actions/runs/41251080923

Verified in that run:
- `npm ci`: passed.
- Type-check and automated tests: passed.
- 27 test files passed.
- 152 tests passed.
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
- The browser bundle remains a performance investigation item; the build currently reports a main JS bundle around 3 MB before gzip.

## Release rule

Keep this branch as a draft for independent review. Do not merge or deploy until the latest CI is green and the owner has reviewed the diff and accepted the remaining limitations.
