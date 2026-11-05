# HALBiz AI provider verification matrix

**Audit date:** 2026-11-05  
**Scope:** Gemini, NVIDIA Nemotron, OpenAI, Anthropic, provider diagnostics, credential ownership, and runtime observability.  
**Production target:** Render deployment `halbiz-full-application.onrender.com`.

## Provider matrix

| Provider | Runtime adapter | Request protocol | Model IDs in this codebase | Production credential | Verification |
|---|---|---|---|---|---|
| Google Gemini | Implemented in `src/lib/gemini.ts` using `@google/genai` | Google GenAI SDK `models.generateContent`; API key auth | `gemini-3.8-flash`, then `gemini-flash-latest` | `GEMINI_API_KEY` | Manual authenticated System Health diagnostics; configured key alone is unverified |
| NVIDIA Nemotron | Implemented in `src/services/nemotron.ts` | OpenAI-compatible `POST https://integrate.api.nvidia.com/v1/chat/completions`; Bearer auth | `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3-nano-30b-a3b`, `nvidia/nemotron-3-super-120b-a12b` | `NVIDIA_API_KEY` | Manual authenticated System Health diagnostics; configured key alone is unverified |
| OpenAI | No inference adapter found; credential can be saved only | No runtime request contract implemented | None | No production variable is consumed by the current runtime | Unsupported / not operational |
| Anthropic | No inference adapter found; credential can be saved only | No runtime request contract implemented | None | No production variable is consumed by the current runtime | Unsupported / not operational |

Model identifiers are implementation defaults, not proof that a model is enabled for a particular account, region, project, or API key. NVIDIA's hosted NIM catalog and Google's Gemini model catalog are the authoritative sources for current availability.

## Production configuration (Render)

Set the following in the Render service's protected Environment settings. Never put values in Git, client-side configuration, logs, or support messages.

### Required for deployment-level Gemini inference
- `GEMINI_API_KEY`: Google AI Studio / Gemini API key with Gemini API access and billing/quota appropriate to the workload.

### Required for deployment-level Nemotron inference
- `NVIDIA_API_KEY`: NVIDIA API key with access to the hosted NIM inference endpoint.

### Required for encrypted tenant connector credentials
- `LEAD_ENCRYPTION_KEY_B64`: base64-encoded 32-byte key. The existing AES-256-GCM encryption implementation uses this key for connector credential vault values as well as supported PII fields. Keep it stable for decryption; rotate only with a deliberate re-encryption migration and backup.
- The PostgreSQL connection variable(s) documented in `ENVIRONMENT_AND_CREDENTIAL_OWNERSHIP.md` must remain available to the application.

### Optional selection
- `HAL_ACTIVE_AI`: optional preference (`gemini`, `nemotron`, or `dual`). A preference does not establish provider health. Runtime selection still requires the corresponding deployment-level key.

### Not currently consumed by inference
- OpenAI `OPENAI_API_KEY` and Anthropic `ANTHROPIC_API_KEY` are not active adapter configuration in this repository. Do not add them to Render expecting HAL to call those providers. The Settings UI stores tenant credentials encrypted. Anthropic is consumed by the HAL chat adapter; OpenAI remains credential-only and is not an active inference adapter.

## Credential ownership and encryption findings

- Connector values are persisted in PostgreSQL in `connector_credentials`, scoped by `contractor_id` and service.
- Values are encrypted server-side through the shared AES-256-GCM `encrypt/decrypt` functions. The ciphertext format contains a random 12-byte IV, ciphertext, and authentication tag.
- The connector read API returns boolean configured flags, not secret values.
- Tenant Gemini credentials are currently loaded by the credential helper and surfaced as a saved/configured indicator, but inference calls use `process.env.GEMINI_API_KEY`. Tenant key injection is not implemented.
- NVIDIA inference uses `process.env.NVIDIA_API_KEY`; the current tenant connector flow does not make a tenant NVIDIA credential available to inference.
- OpenAI and Anthropic tenant credentials are storable but not consumed by runtime adapters.
- Production encryption fails closed when `LEAD_ENCRYPTION_KEY_B64` is absent or invalid. Non-production/test fallback key behavior must never be treated as a production configuration.

## Diagnostics semantics

The authenticated `POST /api/system/diagnostics/ai-providers` endpoint is an explicit, billable live-inference probe. It is restricted to an admin and rate-limited. It tests only Gemini and Nemotron. It does not probe OpenAI or Anthropic because no adapters exist.

The probe result contract is:
- `not_configured`: no deployment-level credential exists; no request is made.
- `verified`: a real provider response contains the exact health marker.
- `failed`: the request failed, timed out, or returned an unexpected response.
- `overall: verified` is returned only when every configured provider tested in that scan passes. Partial provider failure is `degraded`.

The diagnostics helper enforces a bounded 15-second response deadline and returns only status, latency, and a sanitized error code. The provider operation itself is not actively cancelled by this helper after the deadline; the caller must not treat a timed-out probe as a confirmed provider shutdown.

**Required operator action:** an administrator must open System Health and manually select **Run Diagnostics Scan** in production. Until that happens, the production provider matrix remains `configured_unverified` or `not_configured`; this PR's CI does not prove production connectivity.

## Usage, latency, and observability gaps

- Diagnostic latency is measured per provider probe.
- The regular Gemini and Nemotron inference adapters do not yet persist a normalized usage event with provider, model, tenant, request ID, input/output token counts, cost estimate, and latency.
- Gemini SDK and NVIDIA response usage metadata are not consistently normalized into a shared accounting contract.
- No durable AI usage ledger/table was identified for cross-provider token and cost accounting.
- Some adapter error logs still include provider exception messages or response details. Production logs should be reviewed for accidental upstream payload disclosure; never log API keys, authorization headers, or raw prompts.
- Fallback results must retain the actual successful provider/model in the result metadata. A caller that returns only text loses attribution. Do not label a fallback response as the originally requested provider.

These gaps are deliberately reported rather than papered over with synthetic usage numbers or health states.

## Automated coverage added in this workstream

`tests/unit/ai-provider-diagnostics.test.ts` covers:
- missing credentials (no network/probe invocation),
- successful marker response,
- empty and malformed responses,
- HTTP/provider failure with sanitized error code,
- stalled provider timeout.

`tests/security/ai-provider-diagnostics.test.ts` continues to protect the admin-only route, response secrecy, and manual-only live inference trigger.

## Acceptance checklist

- [x] Dedicated workstream branch; no direct commits to `main`.
- [x] Distinguish stored tenant credentials from deployment credentials actually consumed by inference.
- [x] Keep OpenAI and Anthropic explicitly unsupported until adapters exist.
- [x] Bound the diagnostics response wait and reject malformed health responses.
- [x] Document exact Render variable names and provider status semantics.
- [ ] Run the full CI workflow and review its result.
- [ ] Admin manually runs the production diagnostics scan.
- [ ] Record actual production scan evidence before marking Gemini or Nemotron live-verified.
- [ ] Implement durable token/usage accounting and request-level provider attribution in a follow-up.
