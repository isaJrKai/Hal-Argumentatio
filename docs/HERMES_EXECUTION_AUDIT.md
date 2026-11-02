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
- A failed Hermes chat attempt can leave a persisted user message before the provider reports unavailable; retry may create another user message. This does not mark the task complete, but conversational retry deduplication remains desirable.
- The executor's task receipt and Work History event are separate writes. The task receipt is authoritative; Work History append failure is logged and does not undo a persisted completed task.
- Deterministic Hermes Lab fallback creates a durable `draft`, not a provider-verified `ready` asset. The artifact status and execution summary must remain visible to the operator.
- Live production database, concurrent-claim behavior under load, provider outage/recovery, and browser end-to-end behavior require verification in the deployed environment.

## Acceptance evidence required before calling Hermes production-verified

1. Create a tenant-owned Hermes Lab task and inspect its persisted task ID and input.
2. Execute it twice concurrently; exactly one claim must succeed.
3. Confirm one artifact exists with matching `metadata.executionContext.workTaskId` and correlation ID.
4. Confirm the task output references that persisted artifact and its actual status.
5. Force provider unavailability; confirm a failed task or explicitly labelled draft, never a false provider-success claim.
6. Retry after a partial artifact write; confirm the existing artifact is recovered rather than duplicated.
7. Run a Hermes agent task that invokes a real read tool and one intentionally unavailable tool; confirm Work History and the receipt distinguish their outcomes.
8. Verify a second tenant cannot read or execute the first tenant's task or artifact.
9. Verify attempt limits, approval blocks, cancellation and terminal states against PostgreSQL.
10. Run CI and then perform a live deployed workflow check. CI alone is not production evidence.
