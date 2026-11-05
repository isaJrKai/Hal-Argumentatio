# HAL capability deep-dive inventory and end-to-end audit

**Audit started:** 2026-11-05  
**Scope:** Existing HALBiz application only. This is an inventory and verification plan, not a claim that every listed surface is complete.  
**Rule:** Improve and connect existing capabilities. Do not create duplicate modules or parallel systems.

## 1. Product-critical business development workflow

| Existing capability | Existing implementation surface | Current evidence / known boundary | Verification still required |
|---|---|---|---|
| Territory Harvester | LeadsPanel; authenticated `POST /api/leads/harvest`; `POST /api/leads/ingest`; `harvestRealBusinesses` | UI calls live harvest API and imports selected prospects. Imported prospects create tenant-owned leads and human review tasks. Existing CRM audit documents PostgreSQL ownership and ingestion. | Verify each source field against source evidence; source URL/date and confidence; duplicate resolution; phone/email/website validation; empty/provider-failure handling; real production discovery and source attribution. |
| Website Auditor | AI Business Skills registry: `website_audit`; `src/skills/website-audit.ts`; shared network verification | Previously a checklist that never fetched the URL. This workstream now adds bounded public HTML fetching and measured page analysis, plus response-header observations. | Confirm CI; exercise through authenticated Skills UI/API; verify page fetch limits, SSRF and redirect handling; persist audit against selected tenant lead; retain timestamp/evidence and refresh behavior. |
| Security Auditor | AI Business Skills registry: `security_auditor`; shared DNS/TLS verifier | Previous LLM fallback could invent TLS/header findings. This workstream removes fabricated claims and restricts results to actual DNS/HTTP/TLS evidence. | Confirm CI and UI behavior; add independently measured TLS/header details only where safe; authorized scope required for intrusive checks. |
| Landing Page Studio | `LandingPageStudioPanel`, landing templates/generator, quality gates, SEO/schema panel, landing artifacts | Existing builder, templates, HTML/TSX generators, version history, quality gates and save APIs are present. Architecture doc marks provider-neutral website redesign as planned for agent tool execution. | Verify selected prospect context is populated from the canonical lead; save/reload/version/export; quality gate evidence; ownership; no fake portfolio claims; approval-gated publication. |
| Proposal & Contracts | Document Studio, Contracts Studio, proposal and acceptance APIs | CRM/Finance audit documents tenant-owned saved-lead proposal drafts, explicit price inputs, internal approval, one-time client acceptance and project/invoice lifecycle tests. Internal approval is not client signature or external e-signature. | Verify hand-off from the exact lead and saved page/audit deliverables; no sample metrics; correct client terms and price; acceptance and legal/signature wording; browser journey from harvested lead. |
| Business Intelligence | Overview, Intelligence/Forecasts, Revenue Intelligence, Financials, campaign and recommendation surfaces | CRM/Finance audit removed synthetic revenue/outcome values and documents tenant-scoped finance and outcome rules. Several metrics remain unavailable without attributable source records. | Trace every displayed metric to persisted records; verify attribution and event lifecycle; distinguish forecast from actual; verify all screens use canonical PostgreSQL records. |

## 2. Existing application surfaces to include in the inventory

The current App navigation and lazy-loaded components expose these existing areas. Each needs a route/API/persistence/tenant/approval/browser-verification row before it can be marketed as operational:

- Workspace and CRM: Overview, Leads, Map, Board, Missions, Work Queue, Work History, Staff Management.
- Sales and delivery: Campaigns, Outreach Hub, Document Studio, Contracts & Agreements, Client Work Orders, Deal Logger, Client Reports, Lead Capture Forms, Landing Pages, Email Designer.
- Intelligence: Forecasts, Revenue Intelligence, Financials, Decision Engine/Neural, ROI Calculators, AI Business Skills.
- Operating layer: HAL Copilot, Operating Loop, Hermes Studio, Task Schedule, System Status, Operating Manual.
- Platform and integrations: Connected Apps, Settings & Keys, Company Vault, Admin Console.

## 3. Registered AI Business Skills (existing; do not duplicate)

The current skill registry includes:
`website_audit`, `outreach_draft`, `geo_sweep`, `research_deep`, `seo_analytics`, `geo_map`, `ad_spend_optimizer`, `seo_schema_generator`, `review_booster`, `security_auditor`, `competitor_analyzer`, `talent_arbitrage_bridge`, `verified_lead_lists`, `automation_ops_product`, `pricing_margin_calculator`, `ad_spend_breakeven`, `list_subscription_pricing`, `jupyter_live_kernel`, `xurl`, `due_diligence_underwriting`, `compliance_screener`, `ma_target_intel`, and `patent_landscape`.

Registry presence proves discoverability, not that a capability has a live external data source or a persisted workflow. Each skill needs input validation, provider evidence, truthful fallback behavior, tenant ownership where it writes, and a UI/API test.

## 4. Additional gaps surfaced during this deep dive

1. **SEO strategy was fabricating external facts on provider failure.** The previous fallback supplied specific search volumes, difficulty values, backlink counts and competitor content claims without a search-data provider. This workstream replaces those with clearly labelled candidate hypotheses and null metrics.
2. **Website auditing was not actually reading the website.** A checklist was returned as a successful result even though no request occurred. The workstream replaces this with a bounded single-page public HTML fetch, actual metadata/headings/link/image/form/schema observations, response header observations and explicit unmeasured areas.
3. **Security-audit claims were not grounded.** The previous language-model/fallback path could claim missing headers and TLS versions without a probe. The workstream makes the existing skill report only evidence returned by the safe verifier.
4. **The agent capability registry and the Skills UI are separate exposure paths.** The registry explicitly marks full website audit, redesign and publishing as planned for provider tool calling. Do not infer that a feature in Skills UI is automatically available to HAL Copilot/Hermes. Integrate only after a shared executor and approval/persistence contract exists.
5. **No full upstream browser journey is documented as complete.** Existing CRM tests cover proposal acceptance through project delivery, invoice and receipt. The audit explicitly leaves discovery/harvest → website audit → landing page → approved outreach/provider delivery without complete browser end-to-end evidence.

## 5. Security and evidence rules for website intelligence

- Only public HTTP(S) sites, standard ports, bounded time and bounded response bytes.
- Resolve DNS and reject a target if any returned address is non-public/reserved; pin the outbound connection to a validated IP.
- Do not follow redirects automatically. Surface the redirect and require the destination to be separately checked.
- Do not execute scripts, submit forms, authenticate, crawl arbitrary paths, scan ports, exploit vulnerabilities or download assets.
- Report exactly which page and response were inspected, when, status, headers, and parser coverage.
- “Header not observed” is not equivalent to a confirmed exploitable vulnerability.
- Intrusive security testing requires written authorization and a defined scope.
- Never fabricate search volume, rankings, competitor positions, traffic, Core Web Vitals, conversion rates, revenue or ROI.
- Generated client reports must separate measured facts, hypotheses, recommendations and unavailable metrics.

## 6. End-to-end definition of done

A core capability is complete only when all relevant points pass:

1. Real UI action calls a registered authenticated API/executor.
2. The API obtains tenant identity from the authenticated session, never user-supplied tenant IDs.
3. External information is retrieved from an identified source and includes timestamp/source/evidence.
4. Validation and failure states are explicit; no synthetic success fallback.
5. The canonical tenant-owned record is persisted with stable IDs and workflow correlation.
6. Downstream modules read the same canonical record; no copy-paste or disconnected local-only state.
7. Approval gates protect outreach, publishing, spend, contracts and destructive actions.
8. Browser tests cover the actual user journey and reload/persistence.
9. Cross-tenant isolation, retry/idempotency, provider failure and empty-result tests pass.
10. Production deployment and post-deploy smoke checks pass before a capability is called production-verified.

## 7. Delivery order

1. Complete safe website retrieval and measured website audit in the existing skill.
2. Ground security-auditor output and remove unsupported SEO metrics.
3. Trace Territory Harvester source → verification → persisted lead and close the gaps in provenance/validation.
4. Connect the selected lead and its audit evidence to existing Landing Page Studio; persist versioned drafts and reload them.
5. Connect the same lead and deliverables to existing Document Studio/Proposal APIs.
6. Verify Business Intelligence from attributable events only.
7. Add the full browser end-to-end journey and run production smoke checks.
8. Continue the wider HAL capability inventory, prioritizing useful existing but incomplete modules before proposing new work.

## 8. Status

- [x] Existing application and skill inventory started from source tree and current navigation.
- [x] Existing Website Auditor confirmed to be checklist-only before this workstream.
- [x] Existing security-audit fallback identified as capable of ungrounded findings.
- [x] Existing SEO fallback identified as capable of fabricated metrics.
- [ ] Safe website page fetch and audit pass type-check/tests.
- [ ] Security audit pass type-check/tests.
- [ ] SEO evidence-bound behavior pass type-check/tests.
- [ ] Full Territory Harvester provenance and UI/API verification.
- [ ] Lead-to-audit-to-landing-page-to-proposal integration.
- [ ] Business Intelligence attribution verification.
- [ ] Full browser E2E, production deploy and post-deploy verification.

**Do not use this document as a claim that the unchecked items are implemented. Update the evidence and checkboxes as each acceptance test passes.**


## 9. Wider skill-library evidence review (additional findings)

The second pass found that several existing specialist skills were exposed in the Skills UI but could return convincing-looking statements without actually querying their claimed external sources. This workstream is correcting those existing modules rather than adding replacements:

- **Outbound Strategy & Copywriter:** fallback copy previously claimed a prospect's mobile load time was 4.5 seconds, asserted a 30% visitor loss, and said the prospect ranked well without an audit. Fallback now asks permission for an audit when no evidence is supplied and labels user-entered observations as unverified.
- **Local Competitor & Maps Analyzer:** fallback previously invented market saturation, competitor ratings, review freshness, Maps activity, and a profitable entry window. It is now a comparison/research plan and states that live Maps data was not queried.
- **Geo & Weather Intelligence:** fallback previously returned Winnipeg/Manitoba coordinates and synthetic temperatures for arbitrary cities. It now fails clearly when live geocoding/weather data is unavailable and labels next-12-hour weather-based indices as HAL heuristics, not measured demand.
- **SEO Schema Generator:** fallback previously inserted a stock image, example.com URL, US address, Winnipeg coordinates, and a 35% ranking uplift. It now creates JSON-LD from supplied business details only and omits unavailable fields.
- **Review Booster:** copy previously referenced invented response-rate statistics and offered technician incentives for named reviews. It now asks for honest, unbiased feedback and prohibits incentives/review gating.
- **Compliance Screener:** no watchlist provider was connected, yet fallback returned no sanctions/PEP hits and LOW RISK. It now returns unknown screening status and a checklist; no clearance is issued.
- **Due Diligence & Underwriting:** fallback previously claimed active corporate standing, no lawsuits, a 1.45x liquidity proxy, and AML clearance without registry/financial/news sources. It now returns a diligence evidence checklist and REVIEW REQUIRED.
- **M&A Target Intelligence:** fallback previously invented 15% EBITDA margin, market multiples, route savings, customer counts, and annual synergies. It is being converted to explicit user-assumption valuation scenarios only.
- **Ad Spend Optimizer / Break-even Scoper:** these calculate arithmetic from user inputs. They are now labelled as scenarios, validate inputs, and must not imply actual campaign results or a guaranteed ROI.

The wider inventory also includes custom skills, MCP tools, Hermes, forecasting, revenue attribution, financial ledgers, CRM, document workflows, and connected apps. Their availability must be verified independently from the existence of a UI panel or registry entry.

