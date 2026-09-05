# HAL Backend Security & Hardening Guide

This document describes the backend authentication, encryption, and security
model after the hardening pass. Follow it when configuring or deploying HAL.

## Required Environment Variables

| Variable | Purpose | Required for |
|---|---|---|
| `JWT_SECRET` | HMAC-SHA256 signing key for session JWTs (>= 16 random chars; production throws if missing/short) | Production (mandatory), dev gets an ephemeral random key with a warning |
| `LEAD_ENCRYPTION_KEY_B64` | Base64 32-byte AES-256-GCM key for PII field encryption | Encrypting new PII; falls back to the built-in development key with a warning |
| `HAL_CRM_WEBHOOK_SECRET` | Shared secret external CRMs must send (`X-Webhook-Secret` header) to `/api/webhooks/crm` | The webhook is **disabled (503)** until this is set |
| `DATABASE_URL` / `NEON_DATABASE_URL` | PostgreSQL connection string | Production; without it the app runs on the local in-memory sandbox store |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"            # JWT_SECRET / webhook secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"         # LEAD_ENCRYPTION_KEY_B64
```

## Authentication Model

- **JWTs** (`src/lib/security.ts`) are HMAC-SHA256 signed, carry a 24h `exp`,
  and are verified with a **constant-time** signature comparison. Verification
  **fails closed** — any malformed/forged/expired token returns `401`. There is
  no default or fallback identity.
- **Passwords** are stored as `pbkdf2$<iterations>$<salt>$<hash>` (PBKDF2-SHA512,
  120k iterations, per-password random salt). Legacy unsalted hashes still verify
  and are transparently re-hashed on successful login.
- **Login/register** verify credentials against PostgreSQL; if the database is
  unreachable they fall back to the local in-memory store. Unknown accounts and
  wrong passwords return `401` — accounts are never auto-created on login, and
  database errors never produce a forged session.
- **Role-based access**: `requireRole('admin')` guards system endpoints
  (`/api/system/postgres-connect`, `/api/system/postgres-sync`). Only users with
  the `admin` role pass; the middleware fails closed.
- **Rate limiting**: auth endpoints are limited to 5 failures per IP+email per
  15 minutes. The public booking endpoint is limited to 5 submissions per
  IP+audit per 10 minutes.
- **SSE** (`/api/events`) requires authentication via `?token=<jwt>`
  (EventSource cannot set headers). Notifications are delivered **only** to the
  owning contractor's connections.
- **Password change** (`/api/auth/reset-password`) requires an authenticated
  session and the current password. (The previous implementation reset the
  admin password for any unauthenticated caller.)

## Request Hardening

- JSON bodies are capped at **2 MB**; oversized requests return `413`, malformed
  JSON returns `400` (handled by the global error handler — never a crash).
- Security headers on all responses: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `trust proxy` is enabled so `req.ip` reflects the real client behind the
  platform proxy (rate limiting / audit logs are accurate).
- `PUT /api/leads/:id` accepts only a whitelist of updatable fields (no
  mass-assignment of `id`, `contractorId`, timestamps, etc.).
- `/api/system/postgres-connect` only accepts `postgres://` / `postgresql://`
  connection strings.
- Outbound AI / geo / maps calls use timeouts (`src/lib/net.ts`,
  `fetchWithTimeout`) so a hung upstream cannot pin a request.

## Encryption (PII)

`encrypt()`/`decrypt()` in `src/db/db.ts` use AES-256-GCM with a random IV and
auth tag. Encryption **throws on failure** rather than persisting plaintext PII.
Decryption retries the active key and known legacy key derivations; on total
failure it returns the ciphertext (never silently logs its contents).

Per the AGENTS.md constitution, encryption must never be disabled or bypassed.

## Data Integrity

- API routes never return HTML; unknown `/api/*` routes return JSON `404`.
- The public audit page exposes only verified harvested metrics — missing values
  are `null` (rendered as "—") rather than fabricated numbers.
- Unhandled promise rejections and exceptions are logged without crashing the
  process; an Express error handler catches propagated errors and hides
  internals behind a generic `500`.
