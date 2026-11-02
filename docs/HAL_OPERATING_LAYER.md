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
| HAL Assistant | Shared-context reader | Conversational tool execution is not yet connected |
| Hermes | Partial executor | Only registered `hermes_lab_asset` tasks |
| Gemini | Model provider | No standalone task executor registered |
| Nemotron | Model provider | No standalone task executor registered |

A configured Gemini or NVIDIA API key does not mean that provider can claim queue tasks. The Work Queue must show this distinction and must not offer human completion controls for agent-owned running tasks. It accepts a validated JSON input for Hermes Lab asset tasks and exposes a direct authenticated “Run with Hermes” action for that registered task type. Unsupported worker/task combinations remain visibly queued; they must never be represented as executing.

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
- [x] Inject bounded tenant-scoped live business context into HAL Assistant, Hermes and the MCP operational-context tool; Gemini/Nemotron standalone agent flows remain to be integrated.
- [x] Expose a truthful worker capability registry and authenticated readiness endpoint; Hermes is the existing specialist agent and must be extended through its actual runtime rather than duplicated.
- [ ] Complete the executor claim/heartbeat/receipt protocol for all supported workers. The first Hermes-only registered asset executor and bounded retry/cancellation/approval transitions exist; Gemini and Nemotron remain model providers until registered as task executors.
- [ ] Make agent telemetry and neural graph views derive from persisted execution events.

### Verification and release
- [ ] End-to-end test: discovery → lead → audit → page → outreach approval/send → deal → client project → verified revenue.
- [ ] Test tenant isolation, duplicate prevention, retry safety, event ordering and failure recovery.
- [ ] Run CI, merge only green changes, then deploy through the configured publishing path and verify production.

## Non-goals

- Do not rewrite every module at once.
- Do not migrate all existing domain data into a new generic entity table.
- Do not claim autonomous execution where only a draft or simulation exists.
- Do not send external communications or spend money without required approval.

## Hermes Lab task execution and provenance

Hermes Lab generation must enter the durable work queue as a `hermes_lab_asset` task before the existing Hermes executor is called through the authenticated MCP gateway. The task completion receipt records the generated artifact ID; the artifact metadata also records the originating work-task ID and correlation ID so the operator can trace the task to its output.

The executor currently supports the ten registered Hermes Lab tool IDs only. It does not imply general-purpose execution of lead, audit, outreach, contract, finance, publishing, or external communication workflows.

If no configured model provider returns a valid structured result, the deterministic fallback must:
- Never fabricate public business facts, contact details, credentials, prices, guarantees, customer proof, performance metrics, or completed work.
- Mark the artifact as a draft requiring operator review.
- Record `deterministic_fallback` as the engine in artifact metadata.
- Keep the task receipt truthful about the artifact's draft status.

A generated artifact is not the same as a published asset, a sent communication, a connected CRM, or a completed external action.

