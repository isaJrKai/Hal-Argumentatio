# HAL — AI Business Operating Intelligence Platform

HAL (Human Argumentation Layer) is a full-stack AI Business Operating Intelligence System. It consolidates lead harvesting, technical SEO auditing, high-conversion landing page generation, multi-channel outreach (WhatsApp, Email, SMS, Calendar), client intelligence graphs, and an immutable cryptographic audit ledger into a unified software platform.

HAL is built for operators, agencies, and consultancies seeking a decision-support system with human-in-the-loop governance.

---

## Executive Asset Overview

| Attribute | Specification |
|---|---|
| **Asset Type** | Full-Stack Software Platform / Intellectual Property |
| **Frontend Architecture** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Responsive Mobile/Desktop |
| **Backend Architecture** | Node.js, Express, TypeScript, RESTful API, Server-Sent Events |
| **Database & Persistence** | Neon/PostgreSQL via Drizzle for supported domains; legacy `data/db.json` persistence remains in use for other domains. These stores are not yet consolidated. A PostgreSQL failure is reported explicitly rather than treated as an empty dataset or silently replaced with stale local data. |
| **Cryptographic Security** | AES-256-GCM field-level PII encryption, SHA-256 immutable audit ledger, PBKDF2/bcrypt salted password hashing |
| **AI Integration Engine** | Google Gemini (`gemini-2.5-flash`, `gemini-1.5-pro`), Hugging Face, OpenRouter, and Model Context Protocol (MCP) |
| **Test Coverage** | Latest verified main-branch CI after PR #15 and PR #14 merges: **178 tests across 34 test files passed**, with TypeScript and production build checks green. This is CI evidence, not live deployment verification. |
| **Security Audit** | Latest PR #14 CI production dependency audit passed; two moderate development/transitive dependency advisories remain documented. |
| **Codebase Volume** | 60,000+ lines of TypeScript |

---

## Core Feature Modules

### 1. Territory Harvester & Prospect Finder
- **Real-World Intelligence:** Gathers live prospect data across geographies and niches.
- **Automated Technical Audits:** Evaluates prospect websites for mobile load latency, SSL certificates, technical SEO hygiene, and public sentiment.
- **Encrypted PII at Rest:** All prospect contact details and PII are encrypted at rest using AES-256-GCM before storage.

### 2. B2B Landing Page & Website Studio
- **Instant Client Production:** Generates responsive, high-converting agency and client websites directly from lead intelligence.
- **Modern Bento Grid Layouts:** Built-in section blocks (Hero, Social Proof, Metrics, Feature Matrix, FAQ, CTA).
- **Dual Export Engine:** One-click download of standalone static HTML/CSS or production-ready Next.js TSX components.

### 3. Unified Communications Hub
- **Email:** Live email submission is available through the Resend API when `RESEND_API_KEY` and a verified `HAL_SENDER_EMAIL` are configured server-side. HAL records provider acceptance as `submitted`; it does not claim recipient delivery without a verified delivery event.
- **SMS and WhatsApp:** Composer and simulation workflows are available. Live provider dispatch is not implemented and is not represented as operational.
- **Dispatch history:** Live email submissions are recorded in the PostgreSQL communications outbox before provider submission, with idempotency keys and encrypted recipient/content fields. Provider acceptance is recorded as `submitted`; verified Resend webhook events reconcile delivery, bounce, and related states. Durable automated retry/dead-letter processing is not yet implemented. SMS and WhatsApp remain simulation-only.
- **Calendar:** Provider connectivity and booking operations require separate live verification; do not assume calendar bookings are operational.

### 4. Neural Intelligence & Decision Graph
- **Interactive Visual Topology:** Visualizes lead nodes, operational clusters, and autonomous recommendation confidence scores.
- **Continuous Learning Loop:** System weights and business heuristics calibrate automatically as campaign outcomes are confirmed.

### 5. Document & Contract Studio
- **Turnkey Legal & Sales Collateral:** Automatically compiles custom Master Services Agreements (MSAs), Statements of Work (SOWs), and strategic proposals customized to prospect audit findings.

---

## Architecture & Codebase Map

```
├── src/
│   ├── components/            # Production UI modules (Prospect Harvester, Landing Page Studio,
│   │                          # Comms Hub, Neural Graph, Contracts, Campaigns)
│   ├── db/                    # Drizzle ORM schemas, migration tools, and AES-256-GCM encryption
│   ├── lib/                   # Auth handlers, JWT token verification, and utility libraries
│   ├── services/              # AI providers (Gemini, OpenRouter, HF), MCP dispatchers, webhooks
│   └── skills/                # Agent skill registry and business heuristic executors
├── server.ts                  # Express server, REST endpoints, CORS policies, webhooks
├── tests/                     # 34 test suites (Unit, Integration, Security, API, Schema Drift)
├── public/                    # Production static assets, PWA manifest, and icons
├── docs/                      # Technical specifications, handover manifests, and architecture guides
└── vitest.config.ts           # Automated test harness configuration
```

---

## Security & Operational Standards

1. **Zero-Trust Data Protection:** PII fields (emails, phones, personal notes) are encrypted with AES-256-GCM prior to database insertion.
2. **Fail-Closed Authentication:** Authentication guards fail closed on all database errors and enforce bcrypt password hashing.
3. **SSRF & Webhook Protection:** Outbound webhooks strictly validate HTTPS endpoints, prohibit redirects, and enforce dedicated HMAC signing secrets.
4. **CORS Governance:** Explicit domain origin allowlists prevent cross-origin data exposure.

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- A configured Neon/PostgreSQL database for database-backed features. Other legacy domains still use the local JSON store; configure and verify each persistence domain separately.

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/isaJrKai/Hal-Argumentatio.git
cd Hal-Argumentatio

# 2. Install verified dependencies
npm ci

# 3. Configure environment
cp .env.example .env
# Edit .env with your provider credentials (GEMINI_API_KEY, JWT_SECRET, etc.)

# 4. Start local development server
npm run dev

# App runs at: http://localhost:3000
```

### Verification & Testing

```bash
# Run the complete test suite
npm test

# Run production build compilation
npm run build

# Run TypeScript type-checking
npm run lint
```

---

## Publishing and Deployment

The current HAL publishing workflow is the existing Google AI Studio sync/publish setup. Do not assume a successful GitHub CI run means the live application has been published or verified. After an approved change is synchronized and published through that workflow, verify the live application separately.

No alternative hosting target is designated by this repository documentation.

---

## Commercial Licensing & Transfer

This codebase, associated documentation, algorithms, and design assets are delivered as a proprietary software asset. Ownership, source code, and commercial exploitation rights transfer to the acquiring party upon transaction execution.
