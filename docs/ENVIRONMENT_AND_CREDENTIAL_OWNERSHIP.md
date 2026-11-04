# HALBiz environment and credential ownership

This guide separates buyer-configurable integrations from deployment-owned infrastructure. It is an inventory policy, not proof that every integration is implemented.

## Deployment-owned secrets — never put these in ordinary workspace settings

- Database credentials and pool configuration (for example DATABASE_URL / NEON_DATABASE_URL).
- JWT signing secrets and encryption keys (JWT_SECRET, LEAD_ENCRYPTION_KEY_B64, HAL_LEGACY_ENCRYPTION_KEY_B64).
- MCP server authentication and tenant bootstrap values (MCP_SECRET, HAL_MCP_CONTRACTOR_ID).
- Webhook signing secrets and allow-lists (HAL_WEBHOOK_SIGNING_SECRET, HAL_CRM_WEBHOOK_SECRET, HAL_WEBHOOK_ALLOWED_HOSTS).
- SMTP credentials and private OAuth client secrets.
- Any deployment-only credentials used to bootstrap the application or access its infrastructure.

These belong in the hosting provider's protected environment/secrets manager. They must never be committed to Git, included in browser bundles, logged, or displayed back to a user. A buyer taking ownership should replace them with credentials from their own infrastructure during a documented handover.

## Buyer-configurable provider credentials — only expose after runtime wiring

Potential provider credentials include Gemini, NVIDIA, OpenAI, Anthropic, Resend, Twilio, WhatsApp, Google Maps, and other connectors. A settings field is not evidence of a working integration. Each provider needs:
1. A documented purpose and required credential set.
2. Tenant-scoped encrypted storage where credentials are truly tenant-owned.
3. Server-side retrieval scoped to the authenticated tenant.
4. A real provider-specific health/test operation with safe error handling.
5. Clear states: Not configured, Saved, Verified, Operational, or Needs attention.
6. A test proving raw secret values never reach browser responses or logs.

Do not mark an integration operational merely because a key is present.

## Database ownership and portability

HAL currently depends on its server-managed PostgreSQL connection and application schema. The existing PostgreSQL connection test is a diagnostic; it is not a safe live database-switch mechanism. Supporting a buyer-owned database requires a supported PostgreSQL compatibility contract, connection validation, schema migrations, backup/restore procedure, data migration, rollback, and explicit operator confirmation. Never expose the production DATABASE_URL in client-side settings or browser storage.

SQLite is not a supported production database target unless a deliberate adapter and migration path are implemented and tested. Do not silently fall back to SQLite or JSON-file persistence when PostgreSQL is unavailable.

## Secret inventory review checklist

- [ ] Compare deployment variable names against .env.example and the actual runtime call sites.
- [ ] Identify unused, legacy, duplicate, and public build-time configuration.
- [ ] Confirm every required deployment secret has an owner and rotation procedure.
- [ ] Confirm browser-facing Firebase configuration and restricted Maps browser keys are treated as public configuration, not private server secrets.
- [ ] Remove stale or unused credentials only after proving no live route, scheduled job, webhook, or background worker depends on them.
- [ ] Rotate demo credentials after buyer evaluation and transfer ownership.
