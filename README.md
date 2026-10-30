# HAL — Enterprise AI Business Operating Intelligence Platform

HAL (Human Argumentation Layer) is an enterprise-grade, full-stack AI Business Operating Intelligence System. It consolidates lead harvesting, technical SEO auditing, high-conversion landing page generation, multi-channel outreach (WhatsApp, Email, SMS, Calendar), client intelligence graphs, and an immutable cryptographic audit ledger into a unified, turnkey software platform.

HAL is built for operators, agencies, and enterprise consultancies seeking an autonomous decision engine with human-in-the-loop governance.

---

## Executive Asset Overview

| Attribute | Specification |
|---|---|
| **Asset Type** | Turnkey Full-Stack Software Platform / Complete Intellectual Property |
| **Frontend Architecture** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Responsive Mobile/Desktop |
| **Backend Architecture** | Node.js, Express, TypeScript, RESTful API, Server-Sent Events |
| **Database & Persistence** | PostgreSQL, Neon DB, Drizzle ORM, with zero-config in-memory ledger fallback |
| **Cryptographic Security** | AES-256-GCM field-level PII encryption, SHA-256 immutable audit ledger, PBKDF2/bcrypt salted password hashing |
| **AI Integration Engine** | Google Gemini (`gemini-2.5-flash`, `gemini-1.5-pro`), Hugging Face, OpenRouter, and Model Context Protocol (MCP) |
| **Test Coverage** | **132/132 Automated Tests Passing (100% Green)** across 24 test suites |
| **Security Audit** | **0 Known Vulnerabilities** in production and full dependency trees |
| **Codebase Volume** | 60,000+ Lines of Production-Grade TypeScript |

---

## Core Feature Modules

### 1. Territory Harvester & Prospect Finder
- **Real-World Intelligence:** Gathers live prospect data across geographies and niches.
- **Automated Technical Audits:** Evaluates prospect websites for mobile load latency, SSL certificates, technical SEO hygiene, and public sentiment.
- **Military-Grade Data Protection:** All prospect contact details and PII are encrypted at rest using AES-256-GCM before storage.

### 2. B2B Landing Page & Website Studio
- **Instant Client Production:** Generates responsive, high-converting agency and client websites directly from lead intelligence.
- **Modern Bento Grid Layouts:** Built-in section blocks (Hero, Social Proof, Metrics, Feature Matrix, FAQ, CTA).
- **Dual Export Engine:** One-click download of standalone static HTML/CSS or production-ready Next.js TSX components.

### 3. Unified Communications Hub
- **Multi-Channel Orchestration:** Centralized dispatch console for WhatsApp Business Cloud API, Resend/SMTP Email, and Twilio SMS.
- **Meeting Automation:** Integrated Cal.com booking sync for automated calendar reservations.
- **Cryptographic Audit Blocks:** Every outbound dispatch event generates an immutable SHA-256 verification hash recorded to the system ledger.

### 4. Neural Intelligence & Decision Graph
- **Interactive Visual Topology:** Visualizes lead nodes, operational clusters, and autonomous recommendation confidence scores.
- **Continuous Learning Loop:** System weights and business heuristics calibrate automatically as campaign outcomes are confirmed.

### 5. Document & Contract Studio
- **Turnkey Legal & Sales Collateral:** Automatically compiles custom Master Services Agreements (MSAs), Statements of Work (SOWs), and strategic proposals customized to prospect audit findings.

### 6. GitHub Deploy & Version Synchronization Engine
- **One-Click Code Push:** In-app GitHub deployment interface with sanitized token handling, allowing seamless continuous delivery to remote repositories.

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
├── server.ts                  # Enterprise Express server, REST endpoints, CORS policies, webhooks
├── tests/                     # 24 test suites (Unit, Integration, Security, API, Schema Drift)
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
- (Optional) PostgreSQL database (system automatically uses resilient local persistence if no database URL is provided)

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
# Run the complete test suite (132 tests across 24 suites)
npm test

# Run production build compilation
npm run build

# Run TypeScript type-checking
npm run lint
```

---

## Deployment Options

HAL is container-ready and can be deployed in minutes to any standard cloud infrastructure:
- **Docker / Cloud Run:** Use standard Node 20 alpine container.
- **Render / Railway / Fly.io:** Direct deployment using `npm run build` and `npm start`.
- **Vercel / Netlify:** SPA client deployment pointing API routes to the Node.js backend.

For complete turnkey deployment instructions, environment variables, and intellectual property transfer details, refer to `ACQUISITION_HANDOVER.md`.

---

## Commercial Licensing & Transfer

This codebase, associated documentation, algorithms, and design assets are delivered as a complete, proprietary software asset. Ownership, source code, and commercial exploitation rights transfer in full to the acquiring party upon transaction execution.
