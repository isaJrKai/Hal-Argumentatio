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
- [ ] Add authenticated timeline APIs and connect high-value operations to the ledger.

### Workflow integration
- [ ] Inventory every module's read/write APIs and canonical entity ownership.
- [ ] Connect map/prospect discovery to deduplicated CRM intake and bulk actions.
- [ ] Connect lead audit, landing-page artifacts, outreach, contracts, client projects and revenue through canonical IDs.
- [ ] Add recent work, saved collections, resume-work and export flows.

### Intelligence and agents
- [ ] Build shared, permission-filtered business context retrieval for Gemini, Nemotron and specialist agents.
- [ ] Verify AMIS identity and capabilities against actual source and runtime configuration; do not assume AMIS is Hermes.
- [ ] Add task assignment, agent execution receipts, retries, cancellation and approval queues.
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
