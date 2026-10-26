# HAL — Human Argumentation Layer

HAL is an AI-assisted business operating intelligence application intended to help operators organise business information, manage leads and campaigns, analyse performance, produce forecasts and recommendations, and connect decisions to measured outcomes.

**Project status:** active development; not yet production-certified. On `main`, GitHub Actions has passed `npm ci`, TypeScript checks, the Vitest suite, the production build, and the production dependency audit. A clean lockfile regeneration and install have now passed CI; both production and full dependency audits report zero vulnerabilities. Live deployment, database restore, and end-to-end provider checks remain unverified. Feature descriptions below describe intended scope and visible modules, not a warranty that every workflow is complete.

- **Repository:** https://github.com/isaJrKai/Hal-Argumentatio
- **Current preview URL:** https://halbiz.ai.studio (availability and transfer arrangements must be confirmed separately)
- **Primary stack:** React, TypeScript, Vite, Node.js/Express, PostgreSQL, Drizzle ORM
- **AI / integration code:** Google Gemini, Hugging Face, OpenRouter, and a Model Context Protocol (MCP) interface

## What HAL is designed to do

The product direction is to support a business decision loop:

1. Capture business events and operational data.
2. Organise leads, campaigns, revenue records, forecasts, and related activity.
3. Generate analyses, simulations, and recommendations.
4. Keep sensitive or consequential actions subject to operator review and approval.
5. Compare expected outcomes with observed results and record learning signals.

The repository contains code and schemas associated with CRM/pipeline workflows, lead and campaign management, forecasting, recommendations, revenue experiments and outcome tracking, scheduled work, AI-assisted content, and MCP tools. Availability, completeness, and integration behaviour for each area must be verified in a running environment before relying on it.

Product principles and architecture notes are in the HAL directory, including HAL/HAL_Core.md, HAL/HAL_Architecture.md, and HAL/HAL_Constitution.md. The outcome-tracking specification is in docs/PHASE_6D_OUTCOME_TRACKING.md.

## Architecture at a glance

| Area | Location | Responsibility |
|---|---|---|
| Web client | src/, index.html, vite.config.ts | React/TypeScript application and Vite build |
| HTTP application | server.ts | Express server, API routes, application orchestration, and development integration |
| Database access | src/db/ | PostgreSQL connectivity, Drizzle ORM, schema, and persistence code |
| AI integrations | src/lib/, src/services/ | Model-provider integrations, learning and generation helpers |
| MCP | src/services/mcp/ | MCP server, dispatcher, and tool definitions |
| Skills | src/skills/ | Skill registry and execution helpers |
| Tests | tests/ | Unit, integration, API, schema, and security test suites |
| Product/architecture notes | HAL/, docs/ | Product principles, architecture, and selected implementation specifications |
| Static assets | public/ | Browser assets and web-app resources |

The HTTP server and database setup currently have legacy and overlapping paths. Treat this table as an orientation map, not a claim that every module is fully decoupled.

## Requirements

- Node.js compatible with the versions required by the lockfile and dependencies (Node.js 20 or newer is a reasonable starting point; verify in the target deployment environment).
- npm.
- A PostgreSQL database for persistent application workflows.
- Provider credentials for the AI or third-party integrations you intend to use.

Do not connect a local or test run to a production database. Use a separate development/test database and non-production API credentials.

## Local setup

1. Clone the repository and enter the project directory.
2. Install dependencies from the lockfile:

   ~~~bash
   npm ci
   ~~~

3. Create a local environment file:

   ~~~bash
   cp .env.example .env
   ~~~

4. Fill in values in .env using secrets created for your own development environment. Never commit .env, production credentials, customer data, or database exports.
5. Configure a dedicated PostgreSQL database. Review database bootstrap and migration behaviour before pointing the app at any database containing valuable data.
6. Start the development server:

   ~~~bash
   npm run dev
   ~~~

GitHub Actions has verified the lockfile install, type-check/test suite, and production build on `main`. That does not verify a live database, provider credentials, migrations, or the deployed preview. The server includes environment-specific behaviour; startup alone is not proof that persistence works.

## Environment configuration

The tracked .env.example lists the current configuration surface, including:

- GEMINI_API_KEY and APP_URL
- JWT_SECRET, LEAD_ENCRYPTION_KEY_B64, and migration-only HAL_LEGACY_ENCRYPTION_KEY_B64
- DATABASE_URL, NEON_DATABASE_URL, and/or SQL_HOST / SQL_USER / SQL_PASSWORD / SQL_DB_NAME
- Optional provider keys for Hugging Face, OpenRouter, NVIDIA, and Google Maps
- HAL_ACTIVE_AI
- MCP_SECRET and HAL_MCP_CONTRACTOR_ID (required when MCP is enabled)

Password reset is intentionally disabled until persistent single-use tokens and a verified delivery provider are implemented. New accounts require passwords of at least 12 characters. When MCP is enabled, HAL_MCP_CONTRACTOR_ID must explicitly identify the intended account; automatic owner/first-account selection is disabled. Exact requirements depend on the route and feature being used. Generate unique secrets for each environment. The JWT secret must be high-entropy and private. The lead-encryption key must be managed carefully: changing it can make existing encrypted records unreadable unless the data is migrated correctly. HAL_LEGACY_ENCRYPTION_KEY_B64 exists only for a controlled migration; leave it empty in normal operation. Never copy example values into production.

Legacy JSON-to-PostgreSQL migration scripts read a private export path from HAL_SOURCE_JSON. Runtime data is intentionally excluded from source control; do not commit a live export. Review each migration script and take a database backup before running it.

## Available commands

| Command | Purpose |
|---|---|
| npm run dev | Start the development server via tsx server.ts |
| npm run build | Build the Vite client and bundle the server |
| npm start | Start the bundled server from dist/server.cjs |
| npm run lint | Run TypeScript checking (tsc --noEmit) |
| npm test | Run the Vitest suite |
| npm run test:unit | Run unit tests |
| npm run test:integration | Run integration tests |
| npm run test:api | Run API tests |
| npm run test:security | Run security tests |
| npm run test:ci | Run TypeScript checking followed by the full Vitest suite |

CI evidence on the sale-readiness branch: `npm ci`, `npm run test:ci`, and `npm run build` passed. Re-run them after any further changes and verify the target deployment separately.

## Communications integration status

The current unified outreach endpoint records simulations only; it does not send WhatsApp, SMS, or email messages. Provider cards indicate whether configuration values are present, not whether a real provider connection has been verified. Delivery, reply, open, SLA, and booking metrics remain unavailable until provider adapters and event tracking are implemented and tested. Bridge configuration is held in process memory by the current configuration endpoint and is not a durable multi-tenant credential store. The separate signed webhook endpoint requires a dedicated HAL_WEBHOOK_SIGNING_SECRET and an explicit HAL_WEBHOOK_ALLOWED_HOSTS allowlist; redirects are not followed. The `/api/outreach/whatsapp/webhook` route requires a configured app secret and validates the raw-body HMAC signature. The legacy `/api/webhooks/twilio` and `/api/webhooks/whatsapp` handlers are disabled in production until provider signature validation and tenant routing are implemented. Cross-origin browser access is controlled by CORS_ALLOWED_ORIGINS or APP_URL.

## Security and operational notes

- Use unique, randomly generated secrets; never rely on a fallback or example value for authentication or encryption.
- Review authentication and authorisation paths, tenant/account scoping, MCP access, CORS policy, rate limiting, and error handling before public or multi-user deployment.
- Keep provider credentials and database connection strings in the deployment secret manager, not source control.
- Use a least-privilege database role and separate development, test, and production databases.
- Review tracked data files and the full Git history for personal data, credentials, or other material that should not be distributed. Removing a file from the latest commit does not erase older Git history.
- Back up the database and verify a restore procedure before any migration or ownership transfer.
- Review dependency advisories and third-party licences before release.

See docs/SALE_READINESS.md for the current verification and handover checklist.

## Deployment

The repository contains Google AI Studio-oriented configuration and references. The current preview address is a platform-provided ai.studio subdomain; it should not be represented as a separately registered domain owned by the seller. Confirm the platform's current URL and deployment-transfer rules before promising that the existing address can be transferred. A buyer may need to publish the application under a new URL or deploy it to infrastructure they control.

A deployment must be validated independently from a local build. Confirm secrets, database connectivity, schema state, provider quotas, health checks, logs, and core user journeys in the actual target environment.

## Data, commercial, and transfer scope

This repository documents software and implementation assets. It does not by itself prove ownership of every third-party dependency, service account, provider account, domain, deployment, or piece of data connected to a running instance.

Before a transaction, the parties should agree in writing on:

- Which source code, documentation, design assets, and other intellectual property are included.
- Which hosting, AI-provider, database, domain, and third-party accounts are excluded or must be migrated.
- Whether any data is included. Do not transfer personal or customer data without a lawful basis and explicit scope.
- What level of support, fixes, migration, or training is included after payment.
- A delivery process that occurs only after cleared funds and the signed agreement.

No customer traction, recurring revenue, independent security certification, or production-readiness guarantee is asserted by this README.

## Licensing

No root-level open-source licence was present when this README was prepared. Until a licence is deliberately added after reviewing ownership and third-party terms, do not assume the repository grants unrestricted reuse rights. A sale agreement should explicitly state the intellectual-property rights being transferred and identify third-party components that remain governed by their own licences.

## Project conventions

- Preserve the product's architecture and data before making broad clean-up changes.
- Prefer small, reviewable changes over mass deletion or unverified rewrites.
- Add regression tests for behaviour and security fixes.
- Document known limitations and keep claims tied to repeatable evidence.
