# HAL — Intellectual Property & Technical Acquisition Handover

This document records the current technical handover position for HAL (Human Argumentation Layer). It should be read alongside the repository README and the implementation itself.

---

## 1. Executive Summary & Asset Inventory

HAL is **delivered as-is, CI green at handover**. This statement describes the repository state and verification evidence; it is not a claim that every feature is complete, every integration is live, or the current GitHub revision has been published to the production application.

### Inventory of Delivered Intellectual Property

1. **Core Application Engine:** Full TypeScript codebase (60,000+ lines of TypeScript).
2. **Frontend Client:** React 19 single-page application with responsive Tailwind CSS v4 styling and interactive visualizations.
3. **Backend Service Layer:** Node.js / Express RESTful API server with authentication, webhook handlers, and Server-Sent Events.
4. **Data & Persistence Layer:** Neon/PostgreSQL via Drizzle for supported domains; legacy `data/db.json` persistence remains in use for other domains. These stores are not yet consolidated. PostgreSQL failures are reported explicitly rather than treated as empty datasets or silently replaced with stale local data. There is no in-memory persistence fallback.
5. **Cryptographic Suite:** AES-256-GCM field-level PII encryption, PBKDF2/bcrypt salted password hashing, and SHA-256 tamper-evident audit ledger.
6. **AI Orchestration Framework:** Multi-provider LLM integrations (Google Gemini, Hugging Face, OpenRouter) and Model Context Protocol (MCP) server.
7. **Product Modules:**
   - *Territory Harvester & Lead Finder:* Website performance audits, SSL checks, and prospect intelligence.
   - *B2B Landing Page Studio:* Landing page generation with static HTML and Next.js TSX export.
   - *Unified Communications Hub:* Resend email submission, with SMS and WhatsApp simulation workflows; calendar connectivity and booking remain unverified.
   - *Neural Decision Graph:* Visual knowledge graph and business recommendation functionality. Model hosting and inference must be verified separately before claiming a production TimesFM-backed intelligence capability.
   - *Document & Proposal Studio:* Generation of client proposals and statements of work.
   - *Contract Studio:* Master Services Agreement (MSA) and contract workflows.
8. **Automated Test Suite:** Latest verified main-branch CI evidence reports **178 tests across 34 test files passed**, with TypeScript and production build checks green. This is repository CI evidence, not live deployment verification.
9. **Security Audit:** The latest documented production dependency audit passed; **two moderate development/transitive dependency advisories remain documented**. This is not a zero-vulnerability claim.

---

## 2. Runtime, Persistence & Publishing

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/isaJrKai/Hal-Argumentatio.git
cd Hal-Argumentatio

# 2. Install dependencies with locked versions
npm ci

# 3. Create local environment configuration
cp .env.example .env

# 4. Launch the application
npm run dev
```

The local application runs at `http://localhost:3000`.

### Database Configuration

Configure a Neon/PostgreSQL database for database-backed features. PostgreSQL via Drizzle is used for supported domains; other legacy domains still use the local JSON store. These persistence domains are not yet consolidated and should be configured and verified separately.

A PostgreSQL failure is surfaced explicitly. Do not describe the application as silently falling back to in-memory persistence or stale local data.

### Publishing and Deployment

The current HAL publishing workflow is the existing Google AI Studio sync/publish setup. A successful GitHub merge or CI run does not mean the live application has been published. After an approved change is synchronized and published through Google AI Studio, verify the live application separately.

No alternative hosting target is designated by the repository documentation.

---

## 3. Environment Configuration Reference

Configure provider credentials and application settings in the deployment environment. Never commit `.env` files or production credentials to version control.

### Core System Configuration

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | HTTP server port; defaults to `3000`. |
| `NODE_ENV` | Optional | `development` or `production`. |
| `APP_URL` | Recommended | Canonical deployment URL used for CORS validation. |
| `JWT_SECRET` | Required | High-entropy secret used to sign session JWTs. |
| `LEAD_ENCRYPTION_KEY_B64` | Required for encrypted lead data | Base64-encoded 32-byte key for AES-256-GCM lead encryption. |

### Database Configuration

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Required for database-backed features | PostgreSQL connection string. PostgreSQL-backed and legacy JSON persistence domains are not yet consolidated. Omitting this variable does not provide an in-memory persistence fallback. |

### AI Providers

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for AI features. |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key for auxiliary model routing. |
| `HUGGINGFACE_API_KEY` | Optional | Hugging Face inference key. |

### Communications

| Channel | Current status | Configuration / qualification |
|---|---|---|
| Email | Live submission via Resend | Configure `RESEND_API_KEY` and a verified `HAL_SENDER_EMAIL` server-side. Provider acceptance is recorded as `submitted`; recipient delivery is not claimed without a verified delivery event. |
| SMS | Simulation-only | Composer and simulation workflows exist; live provider dispatch is not implemented. |
| WhatsApp | Simulation-only | Composer and simulation workflows exist; live provider dispatch is not implemented. |
| Calendar | Unverified | Provider connectivity and booking operations require separate live verification. |

Live email submissions are recorded in the PostgreSQL communications outbox before provider submission, with idempotency keys and encrypted recipient/content fields. Verified Resend webhook events reconcile delivery, bounce, and related states. Durable automated retry/dead-letter processing is not yet implemented.

---

## 4. Verification & Health Check

The latest documented main-branch CI run passed the following checks:

- **178 automated tests across 34 test files**
- TypeScript checks
- Production build
- Production dependency security audit
- Full development dependency audit report

The production dependency audit passed, while two moderate development/transitive dependency advisories remain documented. Review the current dependency audit output before making any later security-status representation.

Useful local verification commands:

```bash
npm test
npm run lint
npm run build
```

A green CI run verifies the checked repository revision. It does not by itself verify production database migrations, live provider credentials, Google AI Studio publication, or live application behavior.

---

## 5. Security & Administrative Controls

1. **Authentication:** Authentication guards are designed to fail closed on database errors and enforce bcrypt password hashing.
2. **Key Management:** Preserve the encryption key when migrating existing encrypted lead data. Rotate secrets through the appropriate deployment controls; never commit credentials.
3. **CORS & Webhook Protection:** Configure approved browser origins. Outbound webhooks validate HTTPS endpoints, prohibit redirects, and use dedicated HMAC signing secrets.
4. **Data Handling:** PII fields are encrypted with AES-256-GCM before database insertion where the relevant persistence implementation applies.

---

## 6. Commercial Asset Assignment & Closing

The commercial transaction and transfer of ownership are separate from the technical verification described above. Upon receipt of the agreed purchase price ($3,000 USD), the proposed closing steps are:

1. **GitHub Repository Transfer:** Transfer administrative ownership of `https://github.com/isaJrKai/Hal-Argumentatio` to the buyer's GitHub username or organization.
2. **Proprietary Rights Transfer:** Execute the agreed transfer of source code, intellectual property, brand, and associated commercial rights.
3. **Delivery Condition:** The software is delivered as-is, with CI green at handover. Post-handover hosting, operational maintenance, third-party API costs, and any remaining integration or deployment work are the responsibility of the acquiring party unless separately agreed in writing.
