# Implementation Plan: Priority 3 — Unified Multi-Channel Communication & Outreach Bridge + GitHub Deployment

This plan defines the architecture, data contracts, security boundaries, and UI components for executing **Priority 3** of HAL's platform completion: **Unified Multi-Channel Communication & Outreach Bridge** (WhatsApp Business, Email Sequences, Twilio/SMS, Calendar Scheduling) and the automated **GitHub Repository Push Engine**.

---

## 1. User Request & Clarified Scope

### User Goals
1. **Priority 3 Execution**: Deploy a production-ready **Unified Communication & Outreach Bridge** that breaks the "integration wall" for local home service operators, supporting:
   - **WhatsApp Business Bridge**: Meta Cloud API direct webhook and outbound template/freeform dispatch with inbound reply capture.
   - **Transactional & Sequence Email**: Multi-step cold outreach and follow-up cadences with variable injection (`{{businessName}}`, `{{city}}`, `{{ownerName}}`).
   - **Twilio / SMS & Voice Bridge**: Urgent 30-minute dispatch alerts and ETA updates to homeowners and field technicians.
   - **Calendar & Appointment Booking Bridge**: Integrated booking link generation and schedule synchronization.
   - **Conversion Outbox**: Structured ledger tracking, AES-256-GCM contact encryption, and CRM stage advancement.
2. **GitHub Deployment**: Enable pushing the entire codebase directly to the user's GitHub account via secure repository URL and personal access token (PAT), with automated repo initialization, `.gitignore` sanity checks, and clean release commits.

---

## 2. Visual & Architectural Constitution (SaaS Dashboard & Communications)

Grounded in `/skills/system_skills/frontend_design/references/3_saas_dashboard.md`:

- **Single-Elevation Depth**: Clean $1\text{px}$ borders (`border-slate-800`), dark neutral palette (`#09090b` / `#0f172a`), flat panels without nested card-in-card visual debt.
- **Tabular Figures & High-Density Grids**: All dispatch metrics, delivery latencies, phone numbers, and timestamps strictly enforce `font-mono tabular-nums`.
- **Zero-Pill Metadata Discipline**: Status indicators use unboxed inline text with semantic dots (`·`) and subtle micro-dots (green for connected, amber for queued, crimson for failed), eliminating generic colorful pill capsules.
- **Interactive Segmented Filter Bars**: Functional channel filters (`All Channels`, `WhatsApp`, `Email`, `SMS`, `Calls`) rendered as clean segmented controls with keyboard and click navigation.
- **State Completeness**: Every view handles populated threads, empty states with clear action prompts ("Launch First Sequence"), loading skeletons, and error retry triggers.

---

## 3. System Architecture & Technical Specifications

```
                       ┌──────────────────────────────────────────────┐
                       │        Unified Communications Hub UI         │
                       │   (WhatsApp · Email Cadences · SMS · Push)    │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │  Outreach & Dispatch    │                     │   GitHub Push Engine    │
         │   API (/api/outreach)   │                     │   (/api/admin/git/push) │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
       ┌──────────────┼──────────────┐                                │
       ▼              ▼              ▼                                ▼
┌─────────────┐┌─────────────┐┌─────────────┐                  ┌─────────────┐
│  WhatsApp   ││ SMTP/Resend ││ Twilio SMS  │                  │ Remote Git  │
│ Meta Cloud  ││ Email Engine││ Dispatcher  │                  │ Repository  │
└─────────────┘└─────────────┘└─────────────┘                  └─────────────┘
```

### A. Backend Endpoints (`server.ts`)
1. **`GET /api/outreach/bridges/status`**: Returns real-time health and configured state for all 4 bridges (WhatsApp, Email, SMS, Calendar).
2. **`POST /api/outreach/bridges/configure`**: Encrypts and securely persists API keys, webhook secrets, and phone numbers in database storage.
3. **`POST /api/outreach/dispatch`**: Central message router. Accepts recipient lead, channel, subject/body, and template variables; validates encryption, logs to cryptographic ledger, updates CRM stage, and broadcasts live SSE alert.
4. **`POST /api/outreach/whatsapp/webhook`**: Inbound webhook handler for WhatsApp Meta Cloud API, supporting handshake challenge verification and inbound homeowner replies.
5. **`POST /api/admin/git/status` & `POST /api/admin/git/push`**:
   - Verifies git initialization, branch status, and clean file staging.
   - Accepts repository URL (e.g. `https://github.com/username/repo.git`) and Personal Access Token.
   - Executes safe git push via standard credentials with scrubbed logging (token is never leaked in server logs or errors).

### B. Frontend Components
1. **`src/components/UnifiedCommunicationsHub.tsx`**:
   - Channel switcher: WhatsApp, Email Sequences, Twilio SMS, Calendar Appointments.
   - Live message composer with **AI Draft with Gemini** (`gemini-3.8-flash`) tailoring messages to specific lead audits and local weather context.
   - Dispatch ledger showing real-time delivery status, latency, and recipient responses.
   - Bridge connection drawer to test and configure credentials.
2. **`src/components/GitHubDeployModal.tsx`**:
   - Clean, modal interface to input GitHub Repository URL and Access Token.
   - Real-time pre-flight verification: checks unstaged files, `.env` exclusion, and remote connectivity.
   - 1-click **Push to GitHub** with live terminal status feedback and commit hash reporting.
3. **Navigation Integration**:
   - Mount **Communications Hub** into the main sidebar and command palette.
   - Add a prominent **GitHub Deploy** button in the header bar alongside workspace status.

---

## 4. Verification & Testing Plan

1. **Compilation & Type Safety**:
   - Run `compile_applet` to ensure pristine Vite/React build.
   - Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
2. **API Endpoint Verification**:
   - Test `GET /api/outreach/bridges/status` (verify JSON payload).
   - Test `POST /api/outreach/dispatch` with simulated WhatsApp, Email, and SMS payloads (verify encryption, ledger logging, and database record).
   - Test `POST /api/admin/git/status` (verify git status detection).
3. **Operator Experience**:
   - Confirm seamless transition between lead harvesting (Priority 1), landing pages (Priority 2), and multi-channel outreach (Priority 3).

---

## 5. Next Step

Please review this implementation plan. Once approved, I will implement the Unified Communications Hub, multi-channel dispatch routes, and the automated GitHub Push engine.
