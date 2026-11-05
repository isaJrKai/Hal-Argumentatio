# Hermes execution audit

**Scope:** Existing Hermes task creation, authenticated MCP dispatch, task claim, tool execution, result persistence, failure and retry behavior. This audit extends the existing Hermes implementation; it does not introduce another agent or broaden its execution permissions.

## Current execution path inspected

1. Work is created through the Work Queue API or `hal_create_work_task`. The MCP dispatcher validates the tenant-owned linked entity, records the task and a `task.created` work event in a PostgreSQL transaction, and explicitly returns that queuing is not execution.
2. Hermes execution is limited to `hermes_lab_asset` and `hermes_agent_task`. The executor checks worker ownership, task type, approval state, attempt limit and task-specific input before claiming.
3. Claim is an atomic conditional PostgreSQL update from `queued` to `running`, scoped by task ID, contractor ID, worker and approval state. The attempt count and `task.execution_started` event are written in the same transaction.
4. The existing Hermes Lab runtime either generates a provider-backed artifact or a clearly marked deterministic draft. It persists artifact metadata including work-task and correlation IDs. It checks for an artifact already saved for the same work task before generating another.
5. The existing Hermes Studio runtime receives bounded tenant-scoped operational context and a read/analysis-only MCP tool list. It persists assistant messages and any explicitly requested artifact revision. It detects provider unavailability and returns a failed execution status.
6. The dispatcher persists a task output receipt and terminal task status. Failed executions record an error and can be retried only while the attempt limit remains. A task's artifact/message recovery path is intended to prevent duplicate artifact creation after a partial completion.
7. The Work Queue reads persisted task state and output; it does not treat an unsupported worker/task pairing as running.

## Confirmed issue fixed in this workstream

The Hermes tool wrapper previously treated every non-throwing MCP return as `agent.tool_succeeded`. That was incorrect for valid tool responses such as the what-if simulation result `{ status: 'unavailable', executionEnabled: false, simulationStored: false }`. The tool itself had returned normally, but the requested capability had not executed. The task receipt also used `call.result?.success !== false`, which incorrectly marked that response as successful because it had no explicit `success: false`.

The executor now classifies structured MCP results as:
- `succeeded`: a structured result without an explicit failure or unavailable marker;
- `unavailable`: the tool explicitly reports `status: unavailable`, `executionEnabled: false`, `available: false`, or an approval block;
- `failed`: an explicit failure/error or an invalid/missing structured result.

Work History now records `agent.tool_unavailable` separately, and the persisted Hermes task receipt includes the outcome, boolean success and returned status for each tool call. A normal HTTP/function return is no longer sufficient evidence of successful business execution.

## Remaining verification and risks

- The MCP gateway test file contains a local protocol helper that returns a hard-coded `Success` result; it does not invoke the production dispatcher. It must not be treated as proof that a real tool executed. The new tests exercise the actual outcome-classification helper, not a live database execution.
- The queue executor is manually invoked from Work Queue or by the authenticated MCP tool. No continuously running Hermes worker/poller was verified in this audit.
- Provider tool-call fallback can move to another provider after an earlier provider errors. The currently exposed Hermes queue tools are read/analysis operations, but a future expansion to mutating tools must add per-tool idempotency keys before provider fallback is allowed.
- A provider failure before an assistant response is persisted leaves the stable user message in history; retry reuses it and can continue without adding another copy.
- Hermes agent task chat now uses deterministic, task-scoped user/assistant message IDs. A retry reuses the same user message, and if an assistant response was persisted before the task receipt failed, the executor returns that stored response instead of calling providers again. Artifact recovery remains task-scoped as before.
- The executor's task receipt and Work History event are separate writes. The task receipt is authoritative; Work History append failure is logged and does not undo a persisted completed task.
- Deterministic Hermes Lab fallback creates a durable `draft`, not a provider-verified `ready` asset. The artifact status and execution summary must remain visible to the operator.
- CI now runs the extracted production claim function against an ephemeral PostgreSQL 16 service. Integration tests verify exactly-one-winner concurrent claims, tenant scoping, approval gating, retry-limit enforcement, and attempt increments. This is real PostgreSQL behavior, but not a test against the production database.
- Live production database, external provider outage/recovery, and browser end-to-end behavior still require verification in the deployed environment.

## Acceptance evidence required before calling Hermes production-verified

1. Create a tenant-owned Hermes Lab task and inspect its persisted task ID and input.
2. CI integration coverage executes the production claim function twice concurrently against PostgreSQL; exactly one claim must succeed. Repeat in production after deployment.
3. Confirm one artifact exists with matching `metadata.executionContext.workTaskId` and correlation ID.
4. Confirm the task output references that persisted artifact and its actual status.
5. Force provider unavailability; confirm a failed task or explicitly labelled draft, never a false provider-success claim.
6. Retry after a partial artifact write; confirm the existing artifact is recovered rather than duplicated.
7. Run a Hermes agent task that invokes a real read tool and one intentionally unavailable tool; confirm Work History and the receipt distinguish their outcomes.
8. CI integration coverage verifies a second tenant cannot claim the first tenant's task. Verify full task/artifact read isolation in the deployed application.
9. Verify attempt limits, approval blocks, cancellation and terminal states against PostgreSQL.
10. Run CI and then perform a live deployed workflow check. CI alone is not production evidence.

## Hermes lifecycle hardening (2026-11-05)

The existing queue executor now has a bounded execution lease without requiring a new production column or a data migration:

- The `updated_at` field on a running Hermes task is the heartbeat timestamp. The executor refreshes it every 15 seconds, scoped by tenant, task, worker, running state and the exact `attempt_count`.
- `attempt_count` is the attempt fencing token. A stale attempt cannot refresh a newer attempt's lease or write a terminal receipt over a newer attempt.
- Before a task is claimed, an expired running lease (120 seconds without a heartbeat) is converted to a persisted `failed` task with an explicit `lease_expired` failure receipt. It is not silently requeued; an operator must explicitly retry it and the existing maximum-attempt policy still applies. Lease expiry is reaped when an authorized executor request targets that task; there is no independent periodic sweeper, so merely opening the queue does not expire a stale running row.
- Success and failure receipts now include a schema version, task/worker identity, attempt, start/end timestamps and duration. Existing top-level artifact/reply fields are retained for Work Queue compatibility, with a structured `result` object alongside them.
- Success/failure updates are tenant-, worker-, status- and attempt-scoped. A process that has lost its lease cannot mark a later attempt complete.
- Hermes Lab and Studio artifacts created by queue tasks use deterministic tenant/task/kind IDs. Concurrent or retried attempts cannot create a second artifact for the same task; an insert conflict is surfaced as a failed attempt and the next explicit retry recovers the persisted artifact.
- A failure receipt is stored on the task itself. The Work History event remains a secondary append; if that append fails, the authoritative task receipt is not rolled back.

The lease deliberately reuses `updated_at` because the deployed database role is not assumed to have DDL privileges. No new columns, destructive migrations, or production-record rewrites are required. The 120-second lease is a conservative timeout; long-running provider calls are kept alive by the heartbeat timer while the process remains responsive.

## Tool and capability truthfulness

Hermes has two queue task types only:

1. `hermes_lab_asset`: invokes one of ten registered Lab draft/analysis generators. It may create a persisted draft artifact. It does not publish, send, spend, crawl a live website, or connect an external CRM.
2. `hermes_agent_task`: invokes the existing Hermes Studio agent with bounded tenant context and a read/analysis-only set of five MCP tools (operational context, financial health, campaign anomaly inspection, deterministic what-if simulation, and HAL loop context).

The ten registered Lab catalogue IDs are `landing_page`, `ad_copy_studio`, `seo_schema_generator`, `outreach_sequences`, `sms_review_booster`, `speed_vitals_optimizer`, `competitor_intel_scout`, `webhook_resilience_fixer`, `negative_keyword_miner`, and `deep_case_reasoner`. These are not ten live external integrations. In particular, outreach sequence and SMS review tools produce drafts only; speed audit analyzes supplied measurements and does not crawl; competitor intelligence analyzes supplied records and does not verify live offers; CRM connector work drafts mappings and does not connect a CRM; negative-keyword and ad-copy tools produce recommendations/drafts, not campaign changes. The approval policy still blocks consequential requests, but there are no Hermes execution adapters for those external actions today.

Gemini and Nemotron remain model providers used by conversational function-calling paths, not independently registered queue executors. Hermes task execution is request-triggered through the authenticated MCP dispatcher/Work Queue. No continuously polling Hermes worker or background queue consumer is present in the inspected application; a task only runs when an authorized execution request invokes it.

## Verification boundary

The PostgreSQL integration tests cover atomic one-winner claims, tenant isolation, approval and attempt limits, attempt-scoped heartbeats, and stale-lease failure receipts. These tests run against the CI PostgreSQL service. They do not constitute a live production database or browser E2E test. Production execution remains unverified until an operator performs the acceptance workflow against the deployed app and confirms the corresponding task, artifact and Work History records.
