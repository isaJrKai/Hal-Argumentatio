# Live tool test (server run locally against a stand-in Postgres, no AI keys set)

Method: started the real server, registered + logged in, called every GET endpoint and the main action endpoints with a valid session.
Not tested: browser UI rendering, real Gemini/AI output, WhatsApp/email/SMS delivery, real Neon DB.

## Works
- Register, login, sessions. 35/37 read endpoints return 200 (other 2 are expected: need params / WhatsApp unconfigured).
- Create lead (201), lead grounding verification (correctly rejects a fake lead), chat endpoint (needs login now), skills list (23 skills), pricing/ad-economics skills, geo skill returns data.

## FAILING / WRONG: fix before calling it ready
1. **Landing page generator ignores the trade (no AI key => template fallback).** Asked for "sump pump", Toronto, "Dry Basement Co": got the *Calgary plumbing* template. Leftovers on the page: logo "APEX PLUMBING", button "Call (403) 555-0199" (the phone I gave was not applied there), "Calgary" in banner/address/schema (locality Toronto + street Calgary), footer "© Apex Precision Plumbing", fake licence "MP-88402", invented claims ("12,000+ property owners", "average arrival 26 minutes", "$5,000,000 policy"). This breaks the app's own LANDING_PAGE_RULES.md (no invented stats/credentials). Needs: real sump_pump/waterproofing/flood templates, full substitution of business name/phone/city/address, and unverified claims shown as visible placeholders. Also verify what the page looks like WITH a Gemini key (not tested).
2. **Website audit scores are fabricated.** `/api/audit/website` derives mobile/desktop/SEO scores from a hash of the URL string (`absHash`), hard-codes "TLS valid 180 days", and estimates lost revenue from them. Same URL always gives the same invented numbers. README says HAL must not present fixtures as intelligence. Either label as "ESTIMATE" in the UI or wire a real source (e.g. PageSpeed Insights API + real TLS check). Do not demo these as measured.
3. **Generated landing form posted `contractorId: ""`** so leads attach to the first contractor in the DB. Pass the real contractor id when generating/publishing.
4. **geo_weather returned Winnipeg when called with city "Toronto".** Probably wrong input name + silent default; confirm param name and fail loudly instead of defaulting.
5. **Skill errors return HTTP 500 for bad input** (missing required input / unknown skill id). Should be 400/404. Cosmetic, but looks broken in logs.
6. Without AI keys the chat answers "standalone diagnostic mode". Fine, but make the UI say "AI key not configured" so it does not look broken in a demo; ensure GEMINI_API_KEY is set for the demo.

## Fixed in this bundle
- Landing page lead form told visitors "request logged" even when the request failed (lead silently lost). Now checks `res.ok`, shows failure + the business phone, re-enables the button.
- (Earlier) chat/AI-landing auth holes, CRM webhook secret, theme, WhatsApp icon, cleanup: see AUDIT.md.
