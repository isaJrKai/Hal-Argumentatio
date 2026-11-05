# HAL AI Control Plane and Nous Hermes Integration

## Current implementation in this branch

- HAL chat can use the encrypted tenant Anthropic credential through the native Messages API adapter in `src/services/anthropic.ts`.
- The Claude chat default is `claude-haiku-5-5` for low-latency conversational work. Set `HAL_ANTHROPIC_MODEL` only when an operator deliberately chooses a different supported model.
- Anthropic tool calls are routed only through the authenticated server-supplied HAL MCP runtime. The model cannot choose a tenant ID or create a new tool implementation.
- The Intelligence provider switcher now includes Claude. If its tenant key is absent or the request fails, HAL falls back to its configured Gemini/Nemotron route.
- HAL can hand off to the official Nous Hermes Agent API server as a final provider fallback when `HERMES_AGENT_URL` and `HERMES_AGENT_API_KEY` are configured. It sends a tenant-scoped `X-Hermes-Session-Key` and a conversation-scoped `X-Hermes-Session-Id`.
- Gemini chat and Hermes Lab use one explicit Gemini candidate per request rather than sequentially trying several model IDs. UI labels no longer claim Gemini 3.5.
- Nemotron request timeouts are bounded at 15 seconds per attempt.

## Nous Hermes deployment contract

Run the official `nousresearch/hermes-agent` image as a separately managed private service. Enable its API server and require a strong API key. Keep the Hermes data directory on a persistent volume; never bake memories, API keys, sessions, or skills into the container image.

HAL environment:
- `HERMES_AGENT_URL`: private base URL for the Hermes gateway, without the `/v1` suffix.
- `HERMES_AGENT_API_KEY`: gateway API key.

The gateway must be reachable only from HAL's backend/private network. Do not expose its API port publicly without a separate authenticated reverse proxy. The HAL adapter calls `POST /v1/chat/completions` with `model: hermes-agent`.

**Important boundary:** this initial adapter provides agent-backed fallback and tenant-separated Hermes memory keys. It does not yet grant the Nous runtime direct access to HAL's MCP tools or business database. That requires a dedicated authenticated MCP bridge that derives tenant scope from a short-lived server-issued credential, not from model arguments. Do not connect a global, unscoped HAL MCP endpoint to Hermes.

## Memory and learning policy

Cached files are not training data. HAL must not automatically fine-tune a model from arbitrary cache directories, browser caches, build artifacts, temporary files, or other tenants' content.

Use an evidence pipeline instead:
1. Select only tenant-owned, durable business records and approved artifacts.
2. Exclude credentials, personal secrets, temporary files, generated build output, and unverified external content.
3. Extract useful facts, decisions, successful procedures, and outcome evidence into tenant-scoped retrieval memory or reviewed Hermes skills.
4. Preserve source IDs, timestamps, provenance, and confidence.
5. Allow corrections, deletion, and retention policies to propagate to derived memory.
6. Never describe retrieval-memory updates as model-weight training.

## Not yet implemented / requires runtime validation

- Live Nous service deployment, persistent volume provisioning, and secret injection in Render.
- Nous release polling, update notification UI, staged upgrade, backup verification, and rollback.
- Tenant-scoped HAL MCP bridge and the broader capability registry.
- Streaming chat UI and end-to-end latency telemetry across database context, provider inference, tool execution, and persistence.
- Production provider health tests and verified model reporting for every AI-powered module.

Do not advertise these capabilities as complete until each is implemented and verified in production.
