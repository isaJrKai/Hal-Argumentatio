# HAL Operating Layer — Architecture and Delivery Contract

## Product definition

HAL (Human Augmentation Layer) is a business operating system that coordinates human work, specialized agents, business tools and measurable outcomes. It is not a collection of independent dashboards and it is not an autonomous system that silently takes consequential actions.

## The end-to-end lifecycle

`Intent → Mission → Plan → Work items → Assigned worker → Tool execution → Evidence → Review/approval → Business state transition → Outcome → Revenue → Learning`

Every stage must preserve the tenant, entity identity and correlation ID. A lead discovered in a map must remain the same lead when audited, added to a campaign, used in a landing-page brief, converted into a client project and attributed to revenue.

## Shared operating contract

1. **Canonical business entities:** leads, campaigns, missions, client projects, contracts, messages and revenue records remain authoritative in their existing domain tables until an explicit migration proves safe. Do not create shadow copies.
2. **Work ledger:** append-only, tenant-scoped events record what happened, where, who/what did it, the affected entity, correlation ID and safe metadata. Events are evidence, not a replacement for domain records.
3. **Shared agent context:** agents retrieve bounded, tenant-authorized domain records and work events at execution time. Conversation history alone is not business memory.
4. **Task ownership:** every executable task has a status, assigned worker, inputs, outputs, timestamps, retry policy and failure reason. Agents report execution receipts.
5. **Capability registry:** agents can only call registered tools with validated schemas and tenant-scoped authorization.
6. **Approval gates:** outbound messages, spend, contract execution, destructive actions and external publication require explicit policy-based authorization.
7. **Truthful status:** planned, queued, running, completed, failed, blocked and awaiting approval are distinct states. A generated artifact is not a sent message; a proposal is not revenue.
8. **Guidance:** contextual help explains the next valid action and destination. Guidance can be dismissed; security and approval prompts cannot be disabled.
9. **Observability:** every execution records inputs (redacted), tool, worker, duration, result, error and correlation ID. Neural graphs and agent activity displays must be derived from these records, never fixtures.

## Verified worker capability contract

The authenticated `GET /api/workers` endpoint reports execution capability separately from provider configuration:

| Worker | Current verified role | Task execution |
| --- | --- | --- |
| Human operator | Manual work | Can perform and record human-owned tasks |
| HAL Assistant | Conversational orchestrator | Tenant-authenticated MCP tool calling and approval-aware task creation; does not claim queue tasks itself |
| Hermes | Partial executor | Ten registered `hermes_lab_asset` tools plus `hermes_agent_task` through the existing Hermes Studio runtime |
| Gemini | Model provider | No standalone task executor registered |
| Nemotron | Model provider | No standalone task executor registered |

A configured Gemini or NVIDIA API key does not mean that provider can claim queue tasks. The Work Queue must show this distinction and must not offer human completion controls for agent-owned running tasks. It accepts validated JSON inputs for Hermes Lab asset generation and Hermes Studio agent tasks, and exposes “Run with Hermes” for both registered task types. The legacy Hermes execute endpoint also enters the same durable queue rather than bypassing it. Unsupported worker/task combinations remain visibly queued; they must never be represented as executing.

## Work ledger event envelope

- `contractorId`: tenant boundary, mandatory.
- `eventType`: stable verb such as `lead.created`, `audit.completed`, `outreach.draft_created`, `approval.requested`, `message.sent`, `revenue.recorded`.
- `entityType/entityId`: canonical business record affected.
- `actorType/actorId`: human, agent, system or integration.
- `sourceModule`: originating module/tool.
- `correlationId`: links a mission and all child work.
- `summary`: human-readable factual statement.
- `payload`: safe, structured metadata; never plaintext secrets or contact details.

## Delivery sequence

### Foundation
- [x] Define shared operating contract.
- [x] Add tenant-scoped append-only work-event schema and idempotent PostgreSQL bootstrap.
- [x] Add event recording and tenant-scoped retrieval service.
- [x] Add authenticated timeline APIs and connect high-value operations to the ledger.

### Workflow integration
- [ ] Inventory every module's read/write APIs and canonical entity ownership.
- [x] Connect map prospect selection to tenant-validated lead-linked work queue tasks.
- [x] Connect lead grounding/audits, landing-page artifacts, outreach, project lifecycle and recorded revenue to canonical IDs (coverage remains incomplete and needs an end-to-end audit).
- [x] Add an authenticated Work History view for persisted operational events.
- [ ] Add saved collections, resume-work across modules and export flows.

### Intelligence and agents
- [x] Inject bounded tenant-scoped live business context into HAL Assistant, Hermes and the MCP operational-context tool.
- [x] Connect HAL Assistant Gemini and Nemotron function calling to the authenticated MCP dispatcher; tool execution is tenant-scoped by the verified session, recorded in Work History and returned to the model for a final answer.
- [x] Extend HAL Assistant, Hermes and MCP operational context with lead lifecycle events, recorded won/lost outcomes and measured revenue outcomes so agents can distinguish pipeline movement from booked revenue and forecasts.
- [x] Replace hard-coded campaign anomaly baselines with measured adjacent 30-day conversion-rate and cost-per-conversion comparisons; return zero-conversion spend as a screening signal when no prior baseline exists.
- [x] Restrict scheduler lead-volume estimates to recorded trailing 90-day snapshots, persist the actual forecast source, preserve zero confidence, and evaluate forecasts only against their own target observation windows.
- [x] Expose a truthful worker capability registry and authenticated readiness endpoint; Hermes is the existing specialist agent and must be extended through its actual runtime rather than duplicated.
- [x] Extend the existing Hermes executor to support Hermes Lab asset generation and Hermes Studio analysis or explicitly requested artifact revisions, with atomic claims and persisted receipts.
- [x] Add Gemini and Nemotron function-calling loops with bounded rounds, authenticated tool execution, tool-result hand-back, and retry protection against repeating already executed actions.
- [x] Record Hermes tool calls, success/failure and artifact provenance in Work History; keep provider failures visibly failed instead of reporting a successful execution.
- [x] Complete atomic claim, attempt-scoped heartbeat/lease expiry, fenced terminal receipts and explicit failure recovery for the two registered Hermes task types. Other specialist workflows remain unsupported; Gemini and Nemotron are model providers, not standalone queue executors.
- [x] Extend the territory intelligence graph with tenant-scoped work-history event nodes, real lead/outcome/campaign records, actual graph subsystem IDs, and a chronological historical-state scrubber. Model confidence and learning epoch remain explicitly unmeasured until there is validated evidence.

### Verification and release
- [ ] End-to-end test: discovery → lead → audit → page → outreach approval/send → deal → client project → verified revenue.
- [ ] Test tenant isolation, duplicate prevention, retry safety, event ordering and failure recovery.
- [ ] Run CI, merge only green changes, then deploy through the configured publishing path and verify production.

## Neural graph and forecast provenance

The Territory Intelligence Graph is a live relationship graph built from tenant-scoped leads, recorded win/loss outcomes, Google Ads daily records and persisted work-history events. Its territory and niche filters scope the underlying records; the historical scrubber reveals timestamped records chronologically. It is not a visualization of learned neural-network weights. Learning epoch and global model confidence remain explicitly unmeasured until a validated training/calibration pipeline exists.

The TimesFM adapter is shown as configured-but-unverified until an inference request succeeds. A scheduled forecast node is added only when a real forecast response is returned. The separate scheduler lead-volume estimate is limited to recorded trailing 90-day snapshots, stores its actual source, and labels the simple historical-mean fallback with zero confidence. Forecast evaluation compares observations within the forecast's own target window and skips missing measurements rather than recording them as zero.

## Non-goals

- Do not rewrite every module at once.
- Do not migrate all existing domain data into a new generic entity table.
- Do not claim autonomous execution where only a draft or simulation exists.
- Do not send external communications or spend money without required approval.

## Hermes Lab task execution and provenance

Hermes Lab generation must enter the durable work queue as a `hermes_lab_asset` task before the existing Hermes executor is called through the authenticated MCP gateway. The task completion receipt records the generated artifact ID; the artifact metadata also records the originating work-task ID and correlation ID so the operator can trace the task to its output.

The queue executor supports two task types: (1) `hermes_lab_asset`, limited to the ten registered Hermes Lab tools; and (2) `hermes_agent_task`, which invokes the existing Hermes Studio conversational agent with its bounded tenant-scoped operational context and may revise a specifically selected artifact when requested. It does not imply general-purpose execution of lead, audit, outreach delivery, contract, finance, publishing, or external communication workflows.

If no configured model provider returns a valid structured result, the deterministic fallback must:
- Never fabricate public business facts, contact details, credentials, prices, guarantees, customer proof, performance metrics, or completed work.
- Mark the artifact as a draft requiring operator review.
- Record `deterministic_fallback` as the engine in artifact metadata.
- Keep the task receipt truthful about the artifact's draft status.

A generated artifact is not the same as a published asset, a sent communication, a connected CRM, or a completed external action. The legacy `POST /api/hermes/execute` endpoint now creates and executes a durable Hermes task through the same queue path. Listing artifacts is read-only and no longer auto-generates starter assets for an empty workspace.



## Hermes execution lifecycle boundary (2026-11-05)

The existing Hermes executor now maintains a 120-second execution lease by refreshing the task `updated_at` heartbeat every 15 seconds. The monotonically incremented `attempt_count` fences heartbeat and terminal receipt writes to the exact attempt that claimed the task. An expired running task is persisted as failed with a `lease_expired` receipt and requires an explicit operator retry; it is never silently requeued. Success and failure receipts contain task/worker identity, attempt, timestamps, duration and structured result/error evidence. See `docs/HERMES_EXECUTION_AUDIT.md` for the inspected tool registry and limitations.

This completes the lifecycle protocol only for `hermes_lab_asset` and `hermes_agent_task`. It does not make Hermes a general-purpose executor for live outreach, ad changes, publishing, contracts, CRM connections or finance operations. No always-on Hermes polling worker is configured; execution is request-triggered. CI PostgreSQL integration tests are not production or browser end-to-end verification.
