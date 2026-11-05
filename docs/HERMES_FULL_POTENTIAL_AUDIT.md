# Hermes Full-Potential and AI Coordination Audit

**Audit date:** 2026-11-05  
**Repository:** `isaJrKai/Hal-Argumentatio`  
**Production:** `https://halbiz-full-application.onrender.com`  
**Audit base:** `main` at `bbd928480a6bd18c0de9535925e95035213739db`  
**Work branch:** `feat/hermes-full-potential-ai-orchestration`

## Executive finding

HAL currently presents Hermes as Nous Research Hermes Agent, but the inspected HAL execution path is a custom TypeScript agent implementation. It builds a system prompt, loads selected HAL records, calls HAL-owned provider adapters, and persists messages/artifacts in HAL's database. The inspected path does not launch or connect to the official Nous Hermes Agent runtime.

This is not a reason to discard HAL's existing work. The tenant-aware database, MCP dispatcher, Work Queue, task receipts, artifact history, and approval controls are valuable integration assets. The objective should be to connect the official Nous runtime to those assets and expand the real capability surface, not replace HAL's business records or weaken its safety boundaries.

## Verified gaps and defects

### 1. Hermes is materially underpowered inside HAL

- `src/lib/workerCapabilities.ts` registers Hermes as a `partial_executor` for only `hermes_lab_asset` and `hermes_agent_task`.
- `src/services/hermesLab.ts::chatWithHermesAgent` constructs the agent prompt and invokes provider adapters directly.
- The Work Queue executor exposes five read/analysis tools to Hermes tasks: operational context, financial health, campaign anomaly inspection, deterministic what-if simulation, and loop context. The simulation currently returns unavailable rather than executing.
- `src/services/mcp/dispatcher.ts` declares ten HAL MCP tools in total. This is not a complete interface to HAL's business modules.
- The current Hermes workflow does not provide general execution for lead lifecycle, website audit, outreach delivery, client projects, proposals/contracts, finance operations, or publishing. Some of these capabilities exist elsewhere in HAL but are not exposed to Hermes through its current runtime.

### 2. Provider and model identity is inconsistent

The code contains several contradictory model claims:

- `src/components/IntelligencePanel.tsx` displays `GEMINI-3.5-FLASH`.
- `/api/ai/engine-status` reports Gemini candidates as `gemini-3.8-flash` with `gemini-flash-latest` fallback.
- `/api/hermes/status` reports `gemini-2.5-flash` when Gemini is the selected Hermes fallback.
- The actual `chatWithHermesAgent` Gemini path attempts `gemini-3.8-flash`, then `gemini-flash-latest`; it does not call the model reported by the Hermes status route in that path.
- OpenRouter/Hugging Face status reports a presumed first model based on credential presence, not the model that successfully completed a particular request.

Therefore no current status label is reliable evidence of the exact production model used for a response. A saved key or configured provider is not a successful inference. HAL needs request-level provider/model attribution from the actual response, and the UI must distinguish configured, tested, selected, and actually used.

### 3. Anthropic is stored, but not operational

- `src/components/SettingsPanel.tsx` lets a tenant save an Anthropic credential.
- The provider verification matrix explicitly records that Anthropic and OpenAI credentials are stored but no inference adapter consumes them.
- `getActiveAI` currently supports only Gemini, Nemotron, and dual mode.
- Adding an Anthropic key or changing a visual setting does not currently route inference to Claude.

The settings UI must not imply that Anthropic is active until a real adapter, routing path, health probe, and actual-request attribution are implemented.

### 4. Production Hermes failures are visible

Render logs on 2026-11-05 show repeated `[Hermes Chat] Gemini error` responses with upstream HTTP 503 / `UNAVAILABLE` ("currently experiencing high demand"). There is also a log showing `GEMINI_API_KEY is not defined` in an earlier instance. These prove that provider availability/configuration has affected Hermes, but the existing logs do not identify the exact successful model for a request.

### 5. Production hosting cannot safely host persistent Nous state on its current plan

The current Render HAL service is a Free Node web service with 512 MB RAM and an ephemeral filesystem. Render documents that Free services cannot attach persistent disks and lose local filesystem changes on restarts, deploys, and spin-down.

The official Nous Hermes Docker deployment stores mutable state in a persistent data directory, including configuration, sessions, memories, skills, cron jobs, hooks, and logs. Its image is designed to be replaced during upgrades while the mounted data directory survives. Therefore a genuine production Hermes runtime should be isolated as a separate service with durable storage (or another persistent hosting arrangement), not silently installed into the current free Node service.

No paid service or disk should be provisioned without explicit cost approval.

## Target architecture

### A. Official Nous runtime, integrated rather than duplicated

- Run the official `NousResearch/hermes-agent` runtime as a separately managed, version-pinned service.
- Keep HAL as the system of record for tenants, business data, permissions, approvals, task receipts, and artifacts.
- Connect Hermes to HAL through an authenticated remote MCP/API bridge.
- Use a tenant-scoped runtime profile/session boundary. Never share one tenant's memories, sessions, skills, files, or credentials with another tenant.
- Preserve existing Hermes Studio conversations and artifacts. Import or link existing records through a reversible migration; do not overwrite or delete them.

### B. Full capability through a governed HAL tool surface

Expose the useful HAL capabilities through domain-oriented MCP tools and resources, with consistent schemas and audit receipts:

- Business context, workspace search, company settings, and records.
- Leads, territories, enrichment, website audits, and lead lifecycle.
- Campaigns, ad performance, analytics, forecasting, and simulations.
- Outreach drafting, approvals, delivery, consent, opt-outs, and delivery status.
- Client projects, proposals, contracts, invoices, payments, and revenue outcomes.
- Work Queue, Work History, business operating loops, and artifact/version history.
- Approved repository/code operations and deployment workflows only where explicitly enabled.

"Full access" means Hermes can discover and use the full set of capabilities it is authorized to use. It does not mean bypassing tenant isolation, consent, approval, or financial controls. Read, draft, reversible write, and consequential actions should have separate policy levels. Publishing, sending external messages, spending, signing, deleting, changing credentials, and production deployment must remain approval-gated unless a tenant administrator explicitly configures a narrower safe automation policy.

### C. Shared AI coordination contract

Introduce one durable handoff format for HAL Assistant, Hermes, Gemini, Claude, Nemotron, forecasting jobs, and future agents. Each handoff should carry:

- Tenant and initiating user identity from the authenticated server context (never model-supplied).
- Objective, acceptance criteria, priority, and approval policy.
- Referenced HAL records and artifacts by stable IDs.
- Evidence, provenance, assumptions, and unresolved questions.
- Assigned executor/provider/model and actual execution metadata.
- Task state, attempt, idempotency key, outputs, failures, and next handoff.

The shared Work Queue / Work History becomes the coordination ledger. Agents exchange durable artifacts and structured results, not private credentials or unbounded copies of tenant data.

### D. One provider gateway

Route every AI capability through one server-side provider registry. Support Gemini, Anthropic Claude, NVIDIA, OpenRouter, and other approved providers through adapters. Each capability (conversation, Hermes main agent, subagents, extraction, vision, forecasting narrative, summarization, code review) can select a provider/model independently while using common:

- Encrypted credential resolution and explicit credential ownership.
- Model ID validation and provider capability checks.
- Deadlines, bounded retries, circuit breakers, and deterministic fallback policy.
- Tool/function-calling compatibility and streaming where supported.
- Request IDs, latency, token usage, cost, selected route, actual provider/model, and fallback reason.
- Live health probes that make real inference requests and never equate a saved key with verified connectivity.

Claude must be a real selectable route, not a credential field. Changing the selected model must affect the next request and be visible in its execution receipt.

### E. Safe upgrade and learning lifecycle

- Track the official Hermes release/version and configured release channel.
- Periodically check upstream releases and show an in-app administrator notice when a newer version is available.
- The notice should show installed version, available version, release notes, compatibility/migration warning, and an explicit Upgrade action.
- Do not silently auto-upgrade production runtime.
- Before upgrade, back up the Hermes data directory and validate that the backup is readable.
- Upgrade the immutable runtime image/source while preserving Hermes data, memories, skills, sessions, and HAL PostgreSQL records.
- Run official config migrations against a backup, smoke-test tools/MCP/provider routing, and support rollback to the prior runtime version.
- Keep HAL's durable business history in PostgreSQL; Hermes memory and skills supplement it rather than becoming the only copy of business facts.
- Add feedback and evaluation loops so approved outcomes can improve skills and playbooks. Learning must be inspectable, versioned, attributable, and reversible; never silently learn secrets or cross-tenant information.

## Implementation sequence

1. **Truth and observability:** remove unsupported model labels; return actual provider/model on each successful inference; fix Hermes status semantics; add a unified provider execution record and traceable fallback chain.
2. **Provider gateway:** implement real Anthropic adapter and central routing; ensure every AI entry point uses the same registry and encrypted tenant/deployment credential policy.
3. **Nous runtime deployment:** build and test a pinned official Hermes runtime service with durable state and authenticated HAL bridge. Confirm Render plan/disk cost before provisioning.
4. **Capability expansion:** map existing HAL endpoints/services into typed MCP tools by domain; add tenant isolation, policy checks, approval workflow, and audit receipts; expose tool discovery and runtime reload.
5. **Learning and upgrades:** persist Hermes skills/memory safely, add release monitor and explicit upgrade workflow with backup, compatibility checks, smoke tests, and rollback.
6. **End-to-end acceptance:** verify one tenant cannot access another tenant's records; run real multi-step workflows across leads → audit → outreach draft → approval → delivery receipt → project/revenue record; verify agent handoffs, retries, failure recovery, and exact model attribution.

## Acceptance criteria

- HAL identifies the actual Nous runtime and installed upstream version; it does not describe a prompt wrapper as the official agent.
- Hermes can discover and operate all enabled HAL domains through authenticated, tenant-scoped tools.
- Hermes memory, skills, sessions, and HAL records survive a runtime upgrade and rollback.
- A new upstream release generates an actionable notice; upgrade requires explicit operator action.
- Gemini/Claude/Nemotron routing is centralized; a Claude selection results in an actual Anthropic request.
- Every AI response and task receipt records the actual provider/model used, including fallbacks.
- No UI displays a model/version unless that exact model was selected and confirmed for the request.
- Cross-tenant, unapproved external action, and credential exposure tests pass.
- Full CI and production smoke tests pass before merge/deploy.

## Reference documentation

- Official Nous Hermes Agent: https://github.com/NousResearch/hermes-agent
- Hermes Agent documentation: https://hermes-agent.nousresearch.com/docs/
- Nous MCP integration: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Nous security model: https://hermes-agent.nousresearch.com/docs/user-guide/security
- Nous Docker deployment and persistent state: https://hermes-agent.nousresearch.com/docs/user-guide/docker
- Nous update process: https://hermes-agent.nousresearch.com/docs/getting-started/updating
- Render free service limits: https://render.com/docs/free
- Render persistent disks: https://render.com/docs/disks
