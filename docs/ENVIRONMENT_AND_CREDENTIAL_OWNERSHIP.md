# HALBiz environment and credential ownership

This guide separates deployment-owned infrastructure from buyer-configurable integrations. It is an implementation inventory, not proof that every saved credential is used by a live provider adapter. The repository `.gitignore` excludes `.env*` files while explicitly allowing the blank `.env.example` template; never place live values in that template.

## Deployment-owned secrets — never put these in ordinary workspace settings

- Database credentials and pool configuration (`DATABASE_URL` / `NEON_DATABASE_URL`).
- JWT signing secrets and encryption keys (`JWT_SECRET`, `LEAD_ENCRYPTION_KEY_B64`, `HAL_LEGACY_ENCRYPTION_KEY_B64`).
- MCP server authentication and tenant bootstrap values (`MCP_SECRET`, `HAL_MCP_CONTRACTOR_ID`).
- Webhook signing secrets and allow-lists (`HAL_WEBHOOK_SIGNING_SECRET`, `HAL_CRM_WEBHOOK_SECRET`, `HAL_WEBHOOK_ALLOWED_HOSTS`).
- SMTP credentials and private OAuth client secrets.
- Any deployment-only credentials used to bootstrap the application or access its infrastructure.

These belong in the hosting provider's protected environment/secrets manager. They must never be committed to Git, included in browser bundles, logged, or displayed back to a user. A buyer taking ownership should replace them with credentials from their own infrastructure during a documented handover.

## Buyer-configurable provider credentials — current limitations

The authenticated connector vault stores supported values encrypted in PostgreSQL, scoped to the signed-in contractor. The API returns configured flags only and never returns raw values. The save endpoint allow-list is authoritative; the UI must not offer services the server rejects.

Important runtime distinction as of this branch:
- Gemini credentials can be saved in the tenant vault, but the current inference modules still read `GEMINI_API_KEY` from the deployment environment. The AI status endpoint now reports deployment-level runtime readiness separately from whether a tenant Gemini credential is saved. Do not promise tenant-supplied Gemini inference until request-scoped key injection is implemented and tested.
- NVIDIA Nemotron currently reads `NVIDIA_API_KEY` from the deployment environment. A tenant-level NVIDIA key is not currently supported by the connector save allow-list or inference runtime.
- Resend password-reset delivery currently reads the deployment-level `RESEND_API_KEY` or a legacy bootstrap credential path; saving a tenant Resend key is not proof it will be used for password-reset delivery.
- Meta credentials are stored in the tenant vault. The access token and ad-account identifier are configuration only; Meta API connectivity and ad operations are not verified by saving them.
- Google Workspace uses its separate OAuth flow; it is not the same as saving a Google API key.

Before marking any provider operational, implement and test:
1. A documented purpose and required credential set.
2. Tenant-scoped encrypted storage where credentials are truly tenant-owned.
3. Server-side retrieval scoped to the authenticated tenant at the actual inference/connector call site.
4. A real provider-specific health/test operation with safe error handling.
5. Clear states: Not configured, Saved, Verified, Operational, or Needs attention.
6. A test proving raw secret values never reach browser responses or logs.

Do not mark an integration operational merely because a key is present or saved.

## Database ownership and portability

HAL's authoritative application database is PostgreSQL, selected from deployment configuration (`DATABASE_URL` / `NEON_DATABASE_URL`). The current production database connection is deployment-managed. The Settings connection test is an isolated diagnostic; it does not switch the live application pool or persist a replacement database connection.

There is no supported SQLite production adapter in the current application path. The codebase does contain a legacy JSON-file store (`data/db.json`) used as a compatibility mirror/cache, and several older API handlers still fall back to tenant-local JSON data when PostgreSQL reads fail. That fallback is a known data-consistency and operational-hygiene limitation: PostgreSQL remains the intended source of truth, but the fallback behavior must be removed or made explicit before claiming strict PostgreSQL-only operation. Do not mistake this JSON compatibility layer for SQLite or for a buyer-selectable database.

Supporting a buyer-owned database requires a supported PostgreSQL compatibility contract, connection validation, schema migrations, backup/restore procedure, data migration, rollback, and explicit operator confirmation. Never expose the production `DATABASE_URL` in client-side settings or browser storage. Do not offer arbitrary database switching until these safeguards are implemented and tested.

## Secret inventory review checklist

- [ ] Compare deployment variable names against `.env.example` and actual runtime call sites.
- [ ] Identify unused, legacy, duplicate, and public build-time configuration.
- [ ] Confirm every required deployment secret has an owner and rotation procedure.
- [ ] Confirm browser-facing Firebase configuration and restricted Maps browser keys are treated as public configuration, not private server secrets.
- [ ] Remove stale or unused credentials only after proving no live route, scheduled job, webhook, or background worker depends on them.
- [ ] Remove legacy JSON fallback paths or add explicit degraded-mode handling and reconciliation before claiming PostgreSQL-only data integrity.
- [ ] Rotate demo credentials after buyer evaluation and transfer ownership.
