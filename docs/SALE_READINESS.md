# HAL Sale Readiness & Technical Handover

This document separates observed repository facts from work that still needs evidence. It is intended to make technical diligence efficient and to avoid implying that unverified features are complete.

## Snapshot at preparation

- Repository: isaJrKai/Hal-Argumentatio
- Default branch at inspection: main
- Stack visible in the repository: React, TypeScript, Vite, Node.js/Express, PostgreSQL, Drizzle ORM, Vitest
- Source includes AI provider integrations, MCP-related code, skill modules, database schemas, documentation, and tests.
- Package scripts exist for build, TypeScript checking, and multiple test groups.
- A root README and sale-readiness handover document have now been added on the preparation branch.
- GitHub Actions CI is active on the preparation pull request; the build and test results are tracked in the pull request checks.

**Important:** The latest GitHub Actions run passed `npm ci`, `npm run test:ci`, the production build, and the production dependency audit. The production dependency audit reported **0 vulnerable packages**. The full audit still reports four high-severity Firebase-related packages from orphaned legacy lockfile entries; the app now imports only `@firebase/app` and `@firebase/auth`, and `firebase`/`firebase-admin` are no longer root dependencies, but a clean regenerated lockfile is still needed to eliminate those stale entries. Live end-to-end verification, database restore, full tenant-isolation review, and production deployment have not been demonstrated.

The unified outreach UI previously displayed fabricated provider connection states and sample performance figures. The current branch removes fabricated pipeline, conversion, outreach, lead-assessment, and activity figures and labels the unified dispatch route as simulation-only; no provider delivery is claimed. Provider adapters, callback/event tracking, webhook SSRF protection, durable encrypted per-account credential storage, and end-to-end tests remain release work.

CORS and webhook safeguards were tightened on this branch: browser origins are allowlisted, outbound webhook targets require a dedicated signing secret and explicit HTTPS host allowlist, redirects are not followed, and inbound WhatsApp callbacks require HMAC verification. These changes still require end-to-end testing with a real provider account.

## Verification gate

Record evidence for each item before calling HAL production-ready.

| Gate | Required evidence | Status |
|---|---|---|
| Clean install | Fresh environment; npm ci completes from lockfile | Passed in GitHub Actions on latest tested revision |
| Static checks | npm run lint completes successfully | Passed as part of `npm run test:ci` on latest tested revision |
| Build | npm run build completes successfully | Passed in GitHub Actions on the latest tested revision |
| Automated tests | Unit, integration, API, security, and full CI scripts run; failures triaged | `npm run test:ci` passed in GitHub Actions on latest tested revision |
| Database | Fresh test database, schema bootstrap/migrations, persistence, backup and restore tested | Not yet verified |
| Authentication | Login/session paths tested; weak/default secrets rejected; no auth fail-open behaviour | Requires review and testing |
| Account isolation | Cross-account reads and writes are denied in API and MCP paths | Requires review and testing |
| Secrets | Current files and Git history reviewed; any real exposed keys revoked/rotated | Requires review |
| CORS / rate limiting | Allowed origins and abuse limits match the deployment threat model | Requires review and testing |
| AI providers | Missing keys, quota errors, timeouts, and provider failures handled predictably | Requires testing |
| Deployment | Fresh deployment from documented steps; health check and critical journeys verified | Not yet verified; current host could not be controlled or verified from this session |
| Dependencies/licences | Advisory report and third-party licence inventory reviewed | Production audit: 0 vulnerabilities. Full audit: 4 high-severity findings from orphaned legacy Firebase lock entries; clean lock regeneration remains open. Third-party licence inventory still needs review |
| Data handling | Tracked data files checked; customer/PII transfer scope documented | Requires review |
| Domain/hosting | Current host, account ownership, URL transfer limits, and migration plan confirmed | Requires confirmation |

## Security priorities

1. **Secrets:** The earlier environment example and source contained fixed sample values for authentication/encryption. The current branch removes these defaults from the active configuration path and uses empty placeholders. Search current files and the complete Git history for secrets. If a committed value was ever used outside a disposable local environment, revoke/rotate it. For encryption, migrate existing ciphertext using a controlled, temporary legacy-key configuration before retiring the old key.
2. **Authentication:** Login now checks the stored password hash, does not grant admin privileges based on an email substring, and fails closed on database errors. Password reset is disabled until token persistence and delivery are implemented. Existing fixed-salt PBKDF2 hashes are verified for compatibility and upgraded to bcrypt after a successful login; exposed/default account passwords must still be reset.
3. **Database startup:** Review database pool initialisation and automatic table bootstrap paths. Ensure missing configuration cannot silently point a deployment at an unintended database and schema changes are safe and repeatable.
4. **Tenant boundaries:** Test every data-bearing route and MCP tool using two separate accounts. An environment variable that selects an account is not a substitute for request-level authorisation.
5. **CORS:** The preparation branch replaces wildcard browser CORS with an explicit origin allowlist via `CORS_ALLOWED_ORIGINS` or `APP_URL`. Configure these values for the actual deployment and test browser preflights before release.
6. **Tracked data and history:** The runtime data file contained account/session material and operational records; it has been removed from the current branch and replaced by an empty example. This does not erase prior Git history. Inspect other fixtures and prior commits for private information, rotate/revoke exposed sessions and credentials, and plan history remediation; simply deleting the latest copy is not sufficient.

These are review priorities, not a claim that a specific live exploit has been demonstrated.

## Data and privacy

Before handing the project to a buyer:

- Identify whether the repository contains real leads, customer details, credentials, or other personal/business data.
- Separate code fixtures from real operational data.
- Do not include live production database dumps or private API keys in the delivery.
- Define in the sale agreement whether any data is included. If not needed for the demo, deliver a sanitised database or documented seed process instead.
- Confirm lawful authority and consent requirements before transferring any personal data.

## Domain and service dependencies

The current preview uses an ai.studio subdomain. Treat it as platform-managed until the platform confirms the exact transfer path. Do not unpublish the current app or release the URL while negotiating. If the buyer requires durable control, agree on a buyer-controlled hosting target and custom domain, then test a migration.

Third-party dependencies and provider accounts may require the buyer to create their own accounts and API keys. Do not promise transfer of an account or subscription that is not explicitly owned and transferable.

The legacy JSON-to-PostgreSQL sync scripts now require an explicit private export path through HAL_SOURCE_JSON (or the legacy default path if a local file exists). Review their idempotency and transaction behaviour before running them; a database backup is mandatory.

## Buyer handover pack

Provide these only after checking they contain no secrets or private data:

- Source repository and a pinned commit/tag for the delivered version.
- Setup and deployment instructions.
- Environment-variable reference (names and purpose only, never actual values).
- Architecture and data-flow overview.
- Test report with exact commands, versions, results, and known failures.
- Dependency and licence inventory.
- Backup/restore notes and data-export scope.
- List of known defects, incomplete integrations, and external dependencies.
- Written list of included/excluded assets and the agreed support period.

## Transaction boundary

The commercial price, intellectual-property assignment, account transfer, hosting migration, delivery timing, and post-sale support must be defined in a signed agreement. Transfer credentials, repository ownership, domains, or control of production services only through a deliberate handover after the agreed payment conditions are satisfied.
