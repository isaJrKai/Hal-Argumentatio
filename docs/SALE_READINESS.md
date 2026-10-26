# HAL Sale Readiness & Technical Handover

This document separates observed repository facts from work that still needs evidence. It is intended to make technical diligence efficient and to avoid implying that unverified features are complete.

## Snapshot at preparation

- Repository: isaJrKai/Hal-Argumentatio
- Default branch at inspection: main
- Stack visible in the repository: React, TypeScript, Vite, Node.js/Express, PostgreSQL, Drizzle ORM, Vitest
- Source includes AI provider integrations, MCP-related code, skill modules, database schemas, documentation, and tests.
- Package scripts exist for build, TypeScript checking, and multiple test groups.
- No root README or root licence was present at the time of inspection.
- No GitHub Actions workflow runs were returned by the repository API at the time checked.

**Important:** The source tree and scripts have been inspected remotely. A fresh dependency installation, local build, test suite, security audit, database restore, and live end-to-end run have not yet been demonstrated in this document. Do not describe them as passing until evidence is attached.

## Verification gate

Record evidence for each item before calling HAL production-ready.

| Gate | Required evidence | Status |
|---|---|---|
| Clean install | Fresh environment; npm ci completes from lockfile | Not yet verified |
| Static checks | npm run lint completes successfully | Not yet verified |
| Build | npm run build completes successfully | Not yet verified |
| Automated tests | Unit, integration, API, security, and full CI scripts run; failures triaged | Not yet verified |
| Database | Fresh test database, schema bootstrap/migrations, persistence, backup and restore tested | Not yet verified |
| Authentication | Login/session paths tested; weak/default secrets rejected; no auth fail-open behaviour | Requires review and testing |
| Account isolation | Cross-account reads and writes are denied in API and MCP paths | Requires review and testing |
| Secrets | Current files and Git history reviewed; any real exposed keys revoked/rotated | Requires review |
| CORS / rate limiting | Allowed origins and abuse limits match the deployment threat model | Requires review and testing |
| AI providers | Missing keys, quota errors, timeouts, and provider failures handled predictably | Requires testing |
| Deployment | Fresh deployment from documented steps; health check and critical journeys verified | Not yet verified |
| Dependencies/licences | Advisory report and third-party licence inventory reviewed | Not yet verified |
| Data handling | Tracked data files checked; customer/PII transfer scope documented | Requires review |
| Domain/hosting | Current host, account ownership, URL transfer limits, and migration plan confirmed | Requires confirmation |

## Security priorities

1. **Secrets:** The earlier environment example contained fixed sample values for authentication/encryption. Use empty placeholders in examples and generate unique values in every real environment. Search current files and the complete Git history for secrets. If a committed value was ever used outside a disposable local environment, revoke/rotate it. For an encryption key, plan any data re-encryption before changing it.
2. **Fallback authentication secrets:** Search server and helper code for fallback signing keys and ensure production fails closed when a required secret is absent. Add tests for missing/weak secret configuration.
3. **Database startup:** Review database pool initialisation and automatic table bootstrap paths. Ensure missing configuration cannot silently point a deployment at an unintended database and schema changes are safe and repeatable.
4. **Tenant boundaries:** Test every data-bearing route and MCP tool using two separate accounts. An environment variable that selects an account is not a substitute for request-level authorisation.
5. **CORS:** The server currently sets wildcard CORS headers. Verify which endpoints are intended to be public and constrain browser origins where credentials or sensitive responses are involved.
6. **Tracked data and history:** Inspect data/db.json, other fixtures, generated files, and prior commits for private business or personal information. If sensitive material exists, stop distribution and plan history remediation; simply deleting the latest copy is not sufficient.

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
