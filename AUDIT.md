# HAL pre-handoff audit (code review + build/test run)

Verified by running: `npm ci`, `tsc --noEmit` (clean), `vite build` (ok), `vitest` (24 files / 132 tests pass), on the patched tree.
NOT verified (needs a human or an agent with a browser/live DB): rendered UI, live Postgres/Neon sync, provider keys, other-city behaviour.

## Fixed in this bundle
| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | CRITICAL | `/api/intelligence/chat*` (history read, delete, send) had no auth and fell back to the admin account (`con_admin_seed`): anyone could read/delete admin chat and use AI | Added `authenticate`; removed admin fallback |
| 2 | HIGH | `/api/landing-pages/generate-ai` and `/regenerate-section` unauthenticated: anyone can burn the owner's Gemini credits | Added `authenticate` |
| 3 | HIGH | CRM webhook fell back to hard-coded secret `hal_secure_crm_secret_2026` outside NODE_ENV=production; non-constant-time compare | Env secret required (16+ chars), endpoint disabled otherwise, `timingSafeEqual`; added to `.env.example` |
| 4 | UI | App ignored the OS theme (defaulted dark) | Follows system theme, live updates until user picks one |
| 5 | UI | Outreach hub hard-coded dark slate colours | Moved to theme tokens |
| 6 | UI | Generic chat icon for WhatsApp | Real WhatsApp glyph (`src/components/icons/WhatsAppIcon.tsx`) |
| 7 | UI | Landing Page Studio chrome hard-coded dark | Moved to theme tokens (generated page HTML/TSX untouched on purpose) |
| 8 | Hygiene | 11 scratch scripts in repo root (`update_neural_panel*.ts`, `rewrite_neural.ts`, `test_db.ts`...) | Removed (none referenced) |
| 9 | Docs | README lacked a quick start | Added 3-step quick start |

## Still open: for the next agent (highest value first)
1. **Landing "skills" / new templates.** Add contractor templates in `src/components/landing/templates.ts` (`TRADE_TEMPLATES`, extend `TradeType` in `types.ts`): sump pump, waterproofing, flood restoration, emergency dispatch. Follow `LANDING_PAGE_RULES.md`; no invented reviews/stats (mark proof as unverified placeholder).
2. **Basic vs Advanced settings.** `SettingsPanel.tsx` (1600 lines): keep workspace/branding/niche/city as Basic; move Third-Party API Credentials, Neon Postgres link, Active Session Token under a collapsed "Advanced" section.
3. **Operating Manual text overlap** (Settings -> "About & Operating Manual", `HalBiblePanel.tsx`): needs a screenshot to diagnose; suspect `text-[9px]/[10px]` labels and fixed-size flex rows. Add `min-w-0`, `break-words`, larger min font size (11-12px).
4. **Other hard-coded dark colours** remain in ~40 files (`grep -rlE "slate-9|bg-\[#" src/components`). Same token mapping as used in the hub. Document Studio can stay dark.
5. **Postgres URL stored in browser localStorage** (`halbiz_postgres_url`) and the session JWT is shown in Settings. Move the DB URL to server env only, or at least never display it in demos.
6. **Public endpoints** `/api/public/landing-leads`, `/api/public/audit/:id/book`, `/api/public/webhooks/delivery`: confirm per-IP rate limiting and input size limits; `landing-leads` falls back to the first contractor when no `contractorId` is sent.
7. **CORS**: allow-list is empty unless `CORS_ALLOWED_ORIGINS`/`APP_URL` set; fine for same-origin, but set it in production.
8. **Bundle size**: main chunk >500 kB; add route-level `React.lazy` for heavy panels (Maps, D3, studios).
9. **JWT lifetime** is 30 days (comment says 24h); shorten or add refresh/revocation.
10. `firebase-applet-config.json` placeholder configuration active; customize with project credentials upon deployment.
11. Verify end to end with a throwaway Neon DB: connect -> test -> sync; register -> login -> create lead -> outreach flow; switch city (Toronto, Lagos) and check currency/territory.
12. Remove or disable any button that calls an endpoint returning "unavailable" (Phase 4/5 actions) so the demo has no dead ends.
