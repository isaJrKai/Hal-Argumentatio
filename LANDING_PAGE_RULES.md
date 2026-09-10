# Landing Page Builder Rules

These are the non-negotiable rules for the HAL Landing Page Builder: what the tool must enforce on every page it creates or edits, and how the builder itself behaves. They inherit the HAL Constitution and Intentionality Directive (human voice, no AI slop, purposeful design/motion, evidence over vibes).

---

## 1. Page Purpose & Structure

- **One primary job per page**: Every landing page has exactly one main conversion goal (emergency dispatch, schedule estimate, book service, download quote, signup). Secondary links are permitted; competing primary CTAs are strictly forbidden.
- **Above-the-fold contract**: Within the first viewport screen, the visitor must see:
  1. Clear value proposition (what it is + who it is for).
  2. Primary CTA button with high-contrast action verb.
  3. Real proof or concrete specificity that anchors credibility (license #, exact warranty, local neighborhood reference).
- **Section order is intentional**: Default recommended conversion narrative:
  `Hero` ➔ `Problem / Agitation or Social Proof` ➔ `How It Works / Core Benefits` ➔ `Services / Features & Pricing` ➔ `Proof (verified reviews, before/after case studies, certifications)` ➔ `FAQ / Objection Handling & Who It Is / Isn't For` ➔ `Final CTA & Guarantee`.
- **No orphan sections**: Every section must advance the visitor towards the CTA or eliminate a specific objection. Purely decorative filler is banned.
- **Scannable typographic hierarchy**: Exactly one `<h1>`. Clear `<h2>` headers for every section. Short paragraphs (2-3 sentences max). Bullet points only when assisting fast visual scanning. Zero walls of text.

---

## 2. Copy Rules (Humanizer & Anti-Slop Enforced)

- **Lead with the point**: No throat-clearing openings (*"In today's fast-paced world..."*, *"Here's the thing..."*, *"What nobody tells you..."*).
- **Ban binary contrast theater**: Forbidden patterns: *"It's not X. It's Y."* or *"The question isn't X, it's Y."* State the claim directly and factually.
- **Ban AI vocabulary**: Strictly eliminate words like:
  `delve`, `landscape`, `tapestry`, `pivotal`, `showcase`, `leverage`, `robust`, `cutting-edge`, `seamless`, `game-changer`, `next-level`, `unlock`, `empower`, `foster`, `utilize`, `paradigm`, `transformative`, `revolutionize`, `elevate`.
- **Be concrete**: Always prefer real numbers, mechanisms, response times, and specific outcomes over abstractions (*"Cuts furnace diagnosis from 4 hours to 45 minutes"* instead of *"improves heating efficiency"*).
- **One unified voice**: Consistent tone (direct, specific, authentic tradesman or business operator). No sudden formal corporate or sleazy marketing shifts.
- **CTA language is Action + Outcome**:
  - *Good*: "Book Emergency Dispatch", "Request Flat-Rate Quote", "Lock In Free Diagnostic".
  - *Banned*: "Learn more", "Submit", "Click here".
- **No fake profundity or mic-drop endings**: End sections and pages with a concrete next action or takeaway, not empty aphorisms.
- **Portability test**: If any sentence could sit on an unrelated SaaS or generic competitor's page unchanged, rewrite or delete it.
- **Facts only**: Never invent stats, credentials, or fake reviews. If proof is missing, flag it visibly as an unverified placeholder awaiting owner review.

*All generated or AI-edited copy must pass through the automated Humanizer / Anti-Slop linter before user presentation.*

---

## 3. Design System Rules (Impeccable & MengTo Spirit)

- **Tokens first**: Colors, typography, spacing units, border radii, shadows, and button styles derive from a unified design token system. No one-off hex colors or random font sizes.
- **Reject default AI aesthetics**:
  - NO purple/violet gradients as primary brand colors.
  - NO gradient text on headings.
  - NO side-stripe accent borders on cards.
  - NO nested cards inside cards.
  - NO gray text on colored backgrounds (strict WCAG AA 4.5:1 contrast requirement).
  - NO generic single-weight font soup; distinct display hierarchy paired with clean body typography.
  - NO default glassmorphism.
  - NO repetitive rounded-square icon tiles stacked above every heading.
- **Whitespace is deliberate**: Generous breathing room without barren emptiness. Mathematical rhythm between sections (64px–96px vertical rhythm).
- **Imagery has a job**: Real job-site photography, authentic before/after project shots, and verified license emblems. No stock photos of people pointing at clipboards or laptops.
- **Mobile is not an afterthought**: Fluid mobile-first architecture. 48px+ touch targets, zero horizontal overflow, responsive typography scaling.
- **One visual hierarchy**: Primary CTA is visually dominant. Secondary controls (e.g. click-to-call or directions) remain quieter.

---

## 4. Motion & Interaction Rules (Emil Kowalski Bar)

- **Purposeful motion only**: Motion exists to explain hierarchy, confirm user actions, guide gaze, or provide justified tactile polish. Remove anything purely decorative.
- **Prefer `transform` + `opacity`**: Never animate geometry-affecting layout properties (`top`, `left`, `width`, `height`, `margin`) for user interface feedback.
- **Micro-interaction timing**: 140ms–220ms with smooth cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Entrances**: Gentle ease-out starting near `scale(0.96)` or `translateY(8px)` with fade-in, never exaggerated bounces or `scale(0)`.
- **Accessibility & Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` override eliminating transitions and animations for sensitive users.
- **No reading interference**: Hero animations must never delay readability of the core value proposition.

---

## 5. Conversion & Trust Rules

- **Primary CTA repetition**: Appears immediately above the fold, mid-page after core services, and once at the closing section. Identical destination and action framing.
- **Explicit objection handling**: Dedicated FAQ section and "Who this is for / Who this is not for" clarifying scope upfront.
- **Specific proof**: Certified master licenses, bonded liability insurance amounts, exact warranty duration, real homeowner quotes with neighborhood names.
- **Friction matches intent**: High-urgency emergency flows request only name, phone, and issue. Long-term remodeling quotes collect project scope.
- **Zero dark patterns**: No artificial countdown timers that reset on refresh, no pre-checked promotional consents, no deceptive pricing tricks.
- **Performance discipline**: Zero render-blocking scripts, optimized responsive images, instant First Contentful Paint.

---

## 6. Builder Product Rules (How the Tool Itself Works)

- **Interview before inventing**: The builder prompts for (or imports): Target Audience, 1 Primary Goal, Core Offer, Available Proof, and Tone before synthesizing. It does not hallucinate pages from a blind prompt without confirmation.
- **Variants over endless rerolls**: Provides 2–3 distinct directional archetypes (e.g., *High-Urgency Emergency Dispatch*, *Master Craftsman Proof & Warranty*, *Clean Flat-Rate Modern*).
- **Live, honest preview**: Dual-viewport desktop (1280px) and mobile (375px) switcher with real copy length and functional interactive state previews.
- **Editable structure**: Drag/reorder, duplicate, toggle visibility, and delete sections without breaking design token consistency.
- **Guardrails with overrides**: Proactively flags multiple primary CTAs, contrast violations, banned AI words, and missing H1s, while permitting deliberate user overrides.
- **Audit diffs & changelog**: When copy passes through the humanizer or style cleaner, visual diffs display exactly what was altered.
- **Export & publish fidelity**: 1-click single-file HTML bundle, schema.org JSON-LD structured data, and webhook lead ingestion.

---

## 7. Quality Gates Before "Publish" or "Done"

A landing page cannot be published or marked production-ready until passing:

- [ ] **Single Primary Goal**: Exactly 1 primary conversion destination across the page.
- [ ] **Above-the-Fold Contract**: Value proposition, proof anchor, and primary CTA present in first viewport.
- [ ] **Anti-Slop Linter**: 0 banned AI vocabulary words or binary contrast tropes.
- [ ] **Design Token Purity**: No rogue hex values, purple gradients, or nested card anti-patterns.
- [ ] **WCAG AA Contrast**: ≥4.5:1 text-to-background ratio verified across all elements.
- [ ] **Mobile Touch Test**: Touch targets ≥44px with 0 horizontal scroll.
- [ ] **Emil Kowalski Motion Bar**: Hardware-accelerated transitions with prefers-reduced-motion fallback.
- [ ] **Proof Transparency**: Testimonials and license numbers verified or flagged as explicit placeholder.
- [ ] **Performance & SEO Schema**: LocalBusiness Schema.org JSON-LD and clean metadata tags validated.

---

## 8. Short Agent System Prompt Add-On

```
For any landing page: one primary conversion goal; concrete human copy with zero AI-slop patterns; design-system tokens only; reject default AI visual tells; motion only with purpose and reduced-motion support; proof must be real or clearly placeholder; interview or use context before generating; show variants and diffs; enforce the publish checklist.
```
