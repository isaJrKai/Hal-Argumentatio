# HAL Provider-Agnostic Capability Execution

## Architecture contract

HAL providers (Claude, Gemini and Nemotron) are interchangeable reasoning engines on the current shared tool surface. Nous Hermes remains a provider fallback only; it joins the shared capability surface after its authenticated MCP bridge is implemented. They do not own business permissions, tenant identity, or execution state. HAL owns those concerns through a shared capability registry, authenticated server-side execution callbacks, durable Work Queue tasks, Work History receipts, and approval gates.

The registry in `src/services/ai/capabilityRegistry.ts` is the single catalogue for capabilities exposed to provider tool calling. Each capability records its stable ID, purpose, category, risk, status, and backing HAL dispatcher tools. Provider adapters receive the same active tool definitions; the server callback supplies the authenticated contractor ID. A model cannot select or override tenant scope.

## Currently active capability groups

- Workspace context: bounded read of the authenticated tenant's business activity.
- Work Queue: create/list work and execute only the existing bounded Hermes task path.
- Financial intelligence: recorded financial health and deterministic what-if simulation.
- Marketing intelligence: recorded campaign anomaly analysis.
- Operating loop: inspect loop context and attach evidence.
- Website connectivity: run a public DNS lookup and pinned, non-redirecting HTTP/TLS HEAD probe; optionally update an owned lead's SSL status and append Work History evidence.

The registry does not create new powers by itself. Every active entry must map to a real dispatcher implementation. Existing dispatcher validation, task ownership, approval checks, and audit events remain authoritative.

## Planned website execution capabilities

The full website-review workflow remains planned. The active `websites.audit.connectivity` capability is intentionally narrow: it measures public DNS and pinned HTTP/TLS reachability only. It does not crawl page content or claim PageSpeed, Lighthouse, SEO, mobile, accessibility, or conversion findings.

The following entries are deliberately marked `planned` and expose no provider tools yet:

1. **Full website audit** — safely crawl and inspect a public website, report exactly which measurements ran, and distinguish measured facts from inferred recommendations.
2. **Website redesign** — use business context and verified site evidence to produce a versioned draft in Landing Page Studio. Claude, Gemini and Nemotron should be selectable as reasoning providers through the same execution contract. Hermes can join after its tenant-scoped MCP bridge is delivered. Iteration must preserve the source evidence and draft history.
3. **Website publishing** — require an explicit human approval tied to the exact artifact/version hash. Publishing must be a separate executor, not a side effect of generation or saving a draft.

## Execution lifecycle

A future long-running capability should follow this lifecycle:

`requested → queued → running → awaiting_approval (when required) → completed | failed | cancelled`

Each transition must be tenant-scoped and recorded with a correlation ID. Jobs should expose bounded progress and structured outputs. Retries must be idempotent or guarded by a durable claim. Approval must bind to the exact action and artifact version; changing the artifact invalidates prior approval.

## Security invariants

- Tenant IDs come only from the authenticated server session.
- Provider tool schemas are generated from the registry, but execution is always revalidated by the dispatcher.
- No arbitrary URL fetch, shell, filesystem, SQL, or unrestricted browser capability is exposed to a model.
- External communication, spend, contracts, deletion, and publishing remain approval-gated.
- Tool success is reported only after a confirmed execution receipt.
- Planned capabilities are not exposed until their executors and tenant-isolation tests exist.

## Delivery sequence

1. Central registry and provider-neutral tool exposure (this change).
2. Expand website audit beyond the active DNS/HTTP/TLS connectivity probe, with SSRF protections and measured coverage.
3. Provider-neutral landing-page draft generation and revision, with artifact ownership and version receipts.
4. Durable job progress and review UI for multi-step agent work.
5. Explicit version-bound publishing approval and publish receipt.
6. Connect the same capability interface to the private Nous runtime through a short-lived tenant-scoped bridge.

This change establishes the registry and does not claim that the planned website audit/redesign/publishing workflow is already operational.
