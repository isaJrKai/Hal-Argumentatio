# HAL Business Operating Intelligence Platform

HAL (Human Argumentation Layer) is a full-stack AI Business Operating Intelligence System. It consolidates lead harvesting, technical SEO auditing, high-conversion landing page generation, multi-channel outreach (WhatsApp, Email, SMS, Calendar), client intelligence graphs, and an immutable cryptographic audit ledger into a unified software platform.

HAL is built for operators, agencies, and consultancies seeking a decision-support system with human-in-the-loop governance.

---

## Executive Asset Overview

| Attribute | Specification |
|---|---|
| **Asset Type** | Full-Stack Software Platform / Intellectual Property |
| **Frontend Architecture** | React 19, TypeScript, Vite, Tailwind CSS v4, responsive mobile/desktop |
| **Backend Architecture** | Node.js, Express, TypeScript, REST API, Server-Sent Events |
| **Database & Persistence** | Neon/PostgreSQL via Drizzle for supported domains. Some legacy domains still use the process-local `data/db.json` store; these stores are not yet consolidated. Render currently runs without a persistent disk, so JSON-backed state must not be treated as durable across restarts. |
| **Cryptographic Security** | AES-256-GCM encryption for supported lead contact fields, SHA-256 audit hashing, and salted password hashing |
| **AI Integration Engine** | Google Gemini, NVIDIA Nemotron, Hugging Face, OpenRouter and Model Context Protocol (MCP); actual provider availability depends on deployment credentials and live verification |
| **Test Coverage** | See the latest successful GitHub Actions run on `main`; CI evidence is not a substitute for live production acceptance testing |
| **Security Audit** | Dependency and application security checks run through GitHub Actions; consult current workflow results for unresolved advisories |
| **Codebase Volume** | TypeScript application |

---

## Core Feature Modules

### 1. Territory Harvester & Prospect Finder
- Gathers prospect data across geographies and niches using configured sources.
- Supports website and business audits.
- Lead email and phone fields are encrypted at rest in the PostgreSQL-backed lead domain.
- Source and verification metadata distinguish sourced, unverified and synthetic records.

### 2. B2B Landing Page & Website Studio
- Generates responsive agency and client websites from lead intelligence.
- Includes reusable page sections and layout templates.
- Supports standalone HTML/CSS and Next.js component export where available.
- Generated content must be reviewed before publication; proof points and testimonials must not be invented.

### 3. Unified Communications Hub
- **Email:** Resend submission is implemented when the appropriate server-side or tenant credential and verified sender configuration are available. Provider acceptance is not the same as recipient delivery.
- **SMS and WhatsApp:** Some composer and simulation workflows exist. Live SMS dispatch is not currently established. WhatsApp inbound tenant routing remains blocked until a verified phone-number-to-workspace mapping is configured.
- **Dispatch history:** Supported communication records are persisted in PostgreSQL. Delivery, retries and provider events must be verified separately.
- **Calendar:** Google Calendar operations require OAuth configuration, scope approval and live verification.

### 4. Neural Intelligence & Decision Graph
- Visualizes supported lead and operational relationships.
- Recommendations and model outputs depend on available data and configured providers.
- A visualization or configured provider is not evidence of autonomous execution.

### 5. Document & Contract Studio
- Produces proposal, statement-of-work and contract drafts.
- Generated legal and commercial documents require human review and approval before use.

---

## Architecture & Codebase Map

```
├── src/
│   ├── components/            # Application UI modules
│   ├── db/                    # Drizzle schemas, database adapters and encryption
│   ├── lib/                   # Authentication and shared utilities
│   ├── services/              # AI providers, MCP dispatchers and webhooks
│   └── skills/                # Agent skill registry and business workflows
├── server.ts                  # Express server and REST API
├── tests/                     # Unit, integration, security and API tests
├── public/                    # Static assets, PWA manifest and icons
├── docs/                      # Technical specifications and operational audits
└── vitest.config.ts           # Automated test harness
```

---

## Security & Operational Standards

1. **Data protection:** Supported lead email and phone fields use AES-256-GCM encryption. Do not assume every personal or business field in every legacy domain is encrypted.
2. **Authentication:** Protected routes require authentication and tenant ownership checks; security tests cover selected authorization boundaries.
3. **SSRF & webhook protection:** Outbound webhook destinations are validated and signed webhook paths enforce configured secrets.
4. **CORS governance:** Production cross-origin access must be restricted to explicitly configured trusted origins.
5. **Operational truth:** Liveness, database readiness, provider configuration, provider reachability and successful business execution are distinct states.

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- A configured PostgreSQL database for supported persistent domains
- Required deployment secrets configured through a protected environment manager

### Installation & Launch

```bash
git clone https://github.com/isaJrKai/Hal-Argumentatio.git
cd Hal-Argumentatio
npm ci
cp .env.example .env
# Configure required local environment variables.
npm run dev
```

### Verification & Testing

```bash
npm test
npm run build
npm run lint
```

---

## Production Hosting & Deployment

- **Production host:** Render
- **Production service:** `halbiz-full-application`
- **Production URL:** https://halbiz-full-application.onrender.com
- **Source repository:** https://github.com/isaJrKai/Hal-Argumentatio
- **Deployment branch:** `main`
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Database:** Neon PostgreSQL, selected through protected deployment configuration

The Render service is configured for automatic deployment from `main`. A successful GitHub Actions run does not prove a Render deployment succeeded; check the Render deployment status and application logs after each production change. Likewise, a live deployment does not prove every external provider or business workflow works.

The current Render service is on the Free plan and has no persistent disk configured. The application still has legacy JSON-backed domains; those must be migrated or explicitly retired before claiming that all application state is durable in PostgreSQL.

---

## Commercial Licensing & Transfer

The codebase, associated documentation, algorithms and design assets are intended to be delivered as a proprietary software asset. Ownership, source code and commercial exploitation rights transfer to the acquiring party upon execution of the agreed transaction and transfer documentation.

A buyer handover must include the source repository, domain and hosting ownership transfer, database access transfer, deployment configuration, provider credential replacement, encryption-key rotation planning, backup/restore instructions and a verified operational acceptance report. No live customer base or revenue should be represented unless independently established.
