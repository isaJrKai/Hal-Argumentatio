# HAL — Intellectual Property & Technical Acquisition Handover

This document serves as the formal technical handover and operational runbook for the complete acquisition of **HAL (Human Argumentation Layer)**. 

---

## 1. Executive Summary & Asset Inventory

HAL is delivered as a 100% complete, unencumbered, full-stack software asset. All proprietary source code, database architectures, machine learning orchestration layers, front-end design systems, and automated test harnesses are transferred in full to the buyer.

### Inventory of Delivered Intellectual Property:
1. **Core Application Engine:** Full TypeScript codebase (~60,000+ lines of production-grade code).
2. **Frontend Client:** React 19 single-page application with responsive Tailwind CSS v4 styling, interactive Canvas/D3 neural visualizations, and full mobile optimization.
3. **Backend Service Layer:** Node.js / Express RESTful API server with multi-tenant authentication, webhook handlers, and Server-Sent Events.
4. **Data & Persistence Layer:** Drizzle ORM schemas supporting PostgreSQL, Neon DB, and an automated zero-config in-memory persistence fallback.
5. **Cryptographic Suite:** Military-grade AES-256-GCM field-level PII encryption, PBKDF2/bcrypt salted password hashing, and SHA-256 tamper-evident audit ledger.
6. **AI Orchestration Framework:** Multi-provider LLM integrations (Google Gemini, Hugging Face, OpenRouter) and Model Context Protocol (MCP) server.
7. **Six Integrated Product Studios:**
   - *Territory Harvester & Lead Finder:* Real-time website performance audits, SSL checks, and sentiment scoring.
   - *B2B Landing Page Studio:* Instant Bento grid landing page generator with dual Static HTML + Next.js TSX export.
   - *Unified Communications Hub:* Multi-channel dispatch for WhatsApp Cloud API, Resend/SMTP Email, Twilio SMS, and Cal.com scheduling.
   - *Neural Decision Graph:* Visual knowledge graph with autonomous weight calibration.
   - *Document & Proposal Studio:* Automated generation of client proposals and statements of work.
   - *Contract Studio:* Dynamic Master Services Agreement (MSA) generation and signing workflows.
8. **Automated Test Suite:** 24 test suites with **132/132 passing automated tests** verifying unit logic, integration flows, security boundaries, and schema stability.
9. **Zero-Vulnerability Security Audit:** Clean dependency manifest with 0 reported CVEs.

---

## 2. Quickstart & Deployment Runbooks

HAL is designed to deploy cleanly on any modern cloud infrastructure.

### Option A: Local Development & Bare-Metal Server

```bash
# 1. Clone the repository
git clone https://github.com/isaJrKai/Hal-Argumentatio.git
cd Hal-Argumentatio

# 2. Install dependencies with locked versions
npm ci

# 3. Create your environment configuration
cp .env.example .env

# 4. Launch the application
npm run dev

# Application will be accessible at http://localhost:3000
```

### Option B: Cloud PaaS (Render / Railway / Fly.io / Heroku)

1. Connect your GitHub repository to the PaaS platform.
2. Configure the build and start commands:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start` (or `node server.ts` with tsx)
3. Set the environment variables in the platform dashboard (see Section 3 below).
4. Expose Port `3000` (or allow the platform's dynamic `PORT` env var).

### Option C: Docker Container Deployment

Create a `Dockerfile` in the root:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hal-intelligence .
docker run -p 3000:3000 --env-file .env hal-intelligence
```

---

## 3. Environment Configuration Reference

Configure the following parameters in your `.env` file:

### Core System Configuration
| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Port for HTTP server (defaults to `3000`). |
| `NODE_ENV` | Optional | `development` or `production`. |
| `APP_URL` | Recommended | Canonical URL of your deployment (e.g. `https://hal.yourdomain.com`). Used for CORS validation. |
| `JWT_SECRET` | **Required** | High-entropy string used to sign session JWTs. Generate with `openssl rand -hex 32`. |
| `LEAD_ENCRYPTION_KEY_B64` | **Required** | Base64-encoded 32-byte key for AES-256-GCM lead encryption. Generate with `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`. |

### Database Configuration
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Optional | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/haldriver`). If omitted, HAL runs with a zero-downtime local JSON ledger. |

### AI Providers
| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for autonomous audits, content generation, and proposal generation. |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key for auxiliary model routing. |
| `HUGGINGFACE_API_KEY`| Optional | Hugging Face inference key. |

### Multi-Channel Communications (Optional / Plug-and-Play)
| Variable | Channel | Description |
|---|---|---|
| `WHATSAPP_API_TOKEN` | WhatsApp | Meta Cloud API access token. |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp | Meta Phone Number ID. |
| `WHATSAPP_APP_SECRET` | WhatsApp | Meta App Secret for webhook HMAC validation. |
| `RESEND_API_KEY` | Email | Resend email dispatch key (or standard SMTP). |
| `TWILIO_ACCOUNT_SID` | SMS | Twilio Account SID. |
| `TWILIO_AUTH_TOKEN` | SMS | Twilio Auth Token. |
| `TWILIO_FROM_NUMBER` | SMS | Twilio virtual phone number. |
| `CAL_COM_API_KEY` | Scheduling | Cal.com API key for calendar booking sync. |

---

## 4. Verification & Health Check

The acquiring team can verify the technical integrity of the entire codebase at any time using standard test runners:

```bash
# Run all 132 automated unit, integration, and security tests
npm test

# Run strict TypeScript type compilation
npm run lint

# Compile production bundle
npm run build
```

**Expected Result:**
```
✓ tests/unit/...
✓ tests/integration/...
✓ tests/security/...
Test Files: 24 passed (24)
Tests:      132 passed (132)
Duration:   ~12s
```

---

## 5. Security & Administrative Controls

1. **Initial Admin Setup:**
   - Launch the application and register an administrator account via the `/` interface.
   - The first account automatically receives administrator credentials.
2. **Key Rotation Protocol:**
   - If migrating an existing database with encrypted leads, maintain `LEAD_ENCRYPTION_KEY_B64`.
   - Never commit `.env` or production credentials to public version control.
3. **CORS & Webhook Whitelisting:**
   - To restrict browser access, set `CORS_ALLOWED_ORIGINS` to a comma-separated list of approved domains.
   - Outbound webhooks are enforced over HTTPS with HMAC signature validation.

---

## 6. Commercial Asset Assignment & Closing

Upon receipt of the agreed purchase price ($5,000 USD):
1. **GitHub Repository Transfer:** Full administrative ownership of the GitHub repository `https://github.com/isaJrKai/Hal-Argumentatio` will be transferred to the buyer's GitHub username/organization.
2. **Proprietary Rights Transfer:** The seller relinquishes all copyright, commercial rights, trademarks, and claims to HAL, granting the buyer 100% exclusive, perpetual, worldwide ownership.
3. **Warranty & Maintenance:** The software is delivered as-is with all 132 passing tests verified green at time of delivery. Post-handover hosting, operational maintenance, and third-party API costs are the responsibility of the acquiring party.
