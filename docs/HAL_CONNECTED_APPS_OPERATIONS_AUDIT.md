# HAL Connected Apps, Settings and Operations Audit

## Release contract

This audit is an execution checklist, not a declaration of completion. Every item must be classified as implemented and verified, implemented but unverified, partially implemented, planned, or blocked by provider credentials/approval. A saved credential is not proof of connectivity. A draft is not a sent message. A webhook URL is not proof that events are routed to the correct tenant.

## Confirmed findings from the current main branch

- The encrypted connector credential vault is tenant-scoped and returns configuration flags rather than secret values.
- Settings currently exposes a large flat collection of API-key fields. Some integrations have save actions, but a saved key does not establish provider connectivity or prove that an application feature consumes it.
- Google Workspace has a separate OAuth flow. Gmail send and Calendar read paths exist in code, but still require live OAuth/scope verification.
- Resend email dispatch can use tenant credentials. Sender verification, real recipient delivery, delivery webhook reconciliation and durable retry/dead-letter handling still require production evidence.
- WhatsApp has a signed inbound webhook route at `/api/outreach/whatsapp/webhook`. The current connector copy says inbound phone-number-to-workspace routing is not configured; the route fails closed until that mapping exists.
- SMS/Twilio remains simulation-only. The app must not display a Twilio key as a live SMS connection until send, signature-verified inbound, tenant routing and delivery reconciliation are implemented and tested.
- The communications hub supports one selected lead at a time and simulation/live modes. Multi-recipient dispatch and mail-merge are not yet established by the inspected UI.
- A notification table exists in the database schema and the server has an SSE broadcast helper. The current client initializes notifications as an empty array, appends SSE events in memory and clears them locally. Initial persisted-history loading and durable read/dismiss state need verification/implementation.
- Settings receives the current theme but does not expose a theme-change control. The top telemetry bar receives a theme toggle callback but does not render a theme control.
- The primary workspace tab ribbon is horizontally scrollable and has no expand/collapse control.
- The app shell uses a fixed viewport-height layout with nested overflow containers. Installed/PWA viewport sizing and ribbon/workspace clipping need device-level verification.
- `docs/HAL_OPERATING_LAYER.md` defines the intended lifecycle and task/ledger contracts, but explicitly leaves cross-module end-to-end coverage incomplete.

## Work checklist

### A. Connected Apps and credential ownership

- [ ] Create one canonical integration catalogue with categories: AI/model providers, messaging, email delivery, CRM, advertising/analytics, calendar/productivity, payments/finance, automation, data import/export and infrastructure.
- [ ] For every catalogue entry document: credential type, OAuth vs API key, required scopes, secret owner, backend adapter, routes, consuming features, test method, webhook URL/events, disconnect/revoke behavior and verification state.
- [ ] Reconcile duplicate credential surfaces in Settings and Connected Apps; make Connected Apps the home for external-provider credentials.
- [ ] Keep account, workspace profile, security, appearance, notifications and operational preferences in Settings.
- [ ] Keep secrets encrypted server-side, tenant-scoped, write-only in the UI, redacted in logs, and excluded from URLs/local storage.
- [ ] Add provider-specific validation and safe connection tests. A generic “saved” flag must never mean “connected”.
- [ ] Add explicit remove/rotate flows and audit events.
- [ ] Implement a capability registry so the UI only offers actions that have a real backend adapter.
- [ ] Support an extensible number of integrations without creating dead credential fields. Do not add providers until their adapters and tests exist.

### B. Integration catalogue — audit every candidate

| Area | Providers/capabilities to audit | Required functional path |
|---|---|---|
| AI/model providers | Gemini, OpenAI, Anthropic, NVIDIA/Nemotron, OpenRouter, other model APIs | Save secret, safe provider probe, request-scoped adapter, usage/error reporting |
| Messaging | WhatsApp Business Cloud API, Twilio SMS/Voice, other supported SMS providers | Number/account mapping, outbound send, signed inbound webhook, tenant resolution, delivery/reply events |
| Email | Resend, SendGrid, Mailchimp/Brevo and Gmail | Sender/domain verification, contact consent, template/send, unsubscribe, delivery/bounce webhooks |
| CRM | HubSpot, Salesforce and importable CRM sources | OAuth/API auth, tenant-scoped contacts/deals sync, field mapping, idempotent import/export |
| Advertising/analytics | Meta Ads, Google Ads, GA4, Google Maps/Places | Account selection, least-privilege scopes, real data sync, attribution and provider error handling |
| Calendar/productivity | Google Calendar/Workspace, Microsoft 365, Notion, Slack | OAuth scopes, create/read actions as supported, event sync and revocation |
| Finance/payments | Stripe, QuickBooks and supported accounting providers | Account connection, read/write scope separation, webhook signature checks, ledger reconciliation |
| Automation | Zapier, Make and generic outbound webhooks | Signed event delivery, retries, event catalogue, idempotency, test endpoint and documented payloads |
| Data exchange | CSV/XLSX, CRM exports, contact lists and bulk email imports | Preview, field mapping, deduplication, consent/source capture, validation report and rollback-safe import |

The provider list is an audit backlog, not a claim that all providers are currently supported. Prioritize based on real HAL workflows and buyer-owned credentials.

### C. Messaging and agency contact directory

- [ ] Add tenant-scoped contact records with multiple phone numbers per organization/person, labels, source, consent status, preferred channel and opt-out state.
- [ ] Add contact import with preview, field mapping, deduplication and an import report.
- [ ] Add reusable message templates with safe merge fields (for example, contact name, company, assigned operator and next-step URL).
- [ ] Add one-recipient and multi-recipient dispatch only where the provider permits it.
- [ ] Add recipient-level outcomes: queued, submitted, delivered, read (when provider supplies it), failed, opted out.
- [ ] Add explicit campaign review/approval, rate limits, quiet hours and unsubscribe/opt-out handling.
- [ ] Require approved WhatsApp templates for business-initiated messages where WhatsApp policy requires them.
- [ ] Do not expose a bulk-send action while provider setup, consent checks or recipient-level delivery tracking are incomplete.

### D. Zapier, Make and public API

- [ ] Publish a versioned, authenticated HAL API contract for supported resources and actions.
- [ ] Add scoped API tokens with create, rotate, revoke, last-used timestamp and least-privilege permissions.
- [ ] Add signed outbound webhooks with event subscriptions, per-endpoint secrets, retry/backoff, replay protection and delivery history.
- [ ] Add inbound automation endpoints with schema validation, idempotency keys, tenant binding and rate limits.
- [ ] Provide Zapier/Make setup instructions and event/action mappings only after the routes are implemented and tested.
- [ ] Never accept a tenant/workspace ID from an untrusted payload as the sole authorization boundary.

### E. Settings information architecture

- [ ] Reorganize Settings into clear sections: Workspace, Team & access, Security, Appearance, Notifications, Data & privacy, and Advanced.
- [ ] Nest related options instead of showing one long undifferentiated settings page.
- [x] Add explicit Light and Dark controls in Settings and preserve the choice across reloads.
- [ ] Add System appearance mode if it can be supported without breaking existing theme persistence.
- [ ] Remove duplicate API-key entry points after Connected Apps is the canonical location.
- [ ] Audit every setting for save confirmation, persistence, tenant scope and a clear description.

### F. Notifications and activity

- [ ] Load persisted notifications on login and reconnect; do not rely on SSE events received only while the app is open.
- [ ] Add tenant-scoped API actions for mark-read, dismiss and clear-all.
- [ ] Show unread count rather than total in-memory events.
- [ ] Link each notification to the affected lead, task, message, import, mission or result.
- [ ] Emit notifications from committed domain events, not optimistic UI actions.
- [ ] Cover task completion/failure, lead creation/change, imports, outbound delivery, replies, connection failures, approvals and background work.
- [ ] Add duplicate suppression and correlation IDs so one event does not create multiple alerts.
- [ ] Verify persistence, read state, reconnection and tenant isolation.

### G. Operating loops and work lifecycle

- [ ] Inventory each displayed operating loop and map trigger → task → worker/tool → evidence → persisted state → notification → next action.
- [ ] Confirm each loop uses the canonical business record and tenant ID.
- [ ] Add missing transitions and durable task receipts where safe.
- [ ] Ensure unsupported worker/task combinations remain blocked rather than appearing to run.
- [ ] Verify approval gates for outbound communication, spend, contracts, destructive actions and publishing.
- [ ] Test retries, idempotency, duplicate events, worker failure and recovery.
- [ ] Remove any loop card/control that has no real backend action or measurable state.

### H. App shell, ribbon and responsive behavior

- [x] Use dynamic viewport sizing for the installed/mobile shell.
- [x] Add an explicit Expand/Collapse ribbon control; expanded mode wraps all primary workspace tabs.
- [ ] Verify all workspace navigation, action buttons and right-inspector controls are reachable at common desktop, tablet and mobile sizes.
- [ ] Check PWA standalone mode separately from the browser layout.
- [ ] Verify scroll containers, safe areas, keyboard focus and touch targets.
- [ ] Ensure no modal, ribbon or panel is clipped behind the app shell.

### I. Web/app consistency and end-to-end acceptance

- [ ] Compare navigation labels and available features between browser and installed/PWA modes.
- [ ] Run the full user journey: sign in → connect provider → create/import contact → create lead → assign work → draft outreach → approve/send → receive provider event → update lead → record outcome → notify operator.
- [ ] Run a separate email journey and a separate WhatsApp journey; do not treat simulation as live delivery.
- [ ] Verify staff assignment and role boundaries.
- [ ] Verify settings persist after reload and across devices where server persistence is intended.
- [ ] Verify API authentication, tenant isolation, rate limits, secret redaction and webhook signatures.
- [ ] Run CI and production build; deploy; verify `/api/ready`, application logs and production workflows.
- [ ] Record all blocked items that require buyer-owned API keys, provider approval, verified sending domains, phone-number registration or external account access.

## Delivery order

1. Release the completed product-language cleanup.
2. Fix high-confidence UX defects: theme controls, ribbon expansion and viewport sizing.
3. Complete the provider/capability inventory and Connected Apps information architecture.
4. Implement the highest-value real integration workflows (WhatsApp routing, SMS adapter, email delivery verification, contact directory/import, automation webhooks).
5. Connect notifications to persisted events and actions.
6. Trace and test each operating loop end to end.
7. Run production acceptance tests and publish a truthful handover report.

## Current verification boundary

The product-language PR passed CI and was merged. Render deployment must finish and be checked separately. The code-level findings above are not equivalent to live provider verification. Items marked [x] in this checklist are code changes in this branch; all other items remain open until tested.
