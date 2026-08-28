# Task: Build the real nine-section site

**BLOCKED — do not start until `01-content-mapping.task.md` is done** (moved to `.claude/tasks/done/`). This task builds against Architect's real content map and CMS decision — starting early means building against placeholder copy and re-doing work.

**Owner:** Frontend. **Live-site risk:** none — local build only. (Live deploy is a separate later step: `production-cutover.task.md`, still blocked on this task completing.)

## Starting point

Build on `site/` — the Astro project already scaffolded and proven during the deploy-validation spike (`.claude/tasks/done/ftp-host-validation.task.md`). Don't start a new project: it already has the configurable base-path build (root vs. `/_test-static/` — the real deploy will need root), TypeScript strict setup, and a placeholder `ContactForm.tsx` island to build on. Read `docs/architecture.md` in full before writing any component — it now has the real content map and CMS decision from Task 01.

## Scope

1. **All nine sections**, styled to match `Desired-UI-Look*.jpg`'s design language (dark navy / cream alternating sections, amber accent, card-based layout — see `CLAUDE.md`'s "Visual & content reference" section for the full breakdown), populated with the **real copy** from Architect's content map — not the mockup's placeholder text, not invented copy.
2. **Contact form**: wire the existing `ContactForm.tsx` component to the decided hosted form API (Web3Forms or Formspree — per `docs/adr/001-contact-form-destination.md`; picking the specific vendor is your call, both are free-tier-suitable and roughly equivalent — state which one and why in a short note if it's not obvious). Keep the client-side validation already built; add whatever the chosen API's integration actually requires (an API key/form ID, likely — check what needs to go in `.env` vs. what's safe to be public in client-side code for that specific service).
3. **CMS integration**: per Architect's decision in `docs/architecture.md`/`docs/adr/002-headless-cms.md` — wire up whatever the chosen CMS needs (e.g. an admin route + config, and Astro content collections reading the CMS-managed content files) so the content Architect flagged as CMS-managed (likely pricing, FAQ, testimonials) is actually editable that way, not hardcoded.
4. **SEO/meta/accessibility**: per `.claude/agents/frontend.md`'s existing guidance — semantic HTML, proper meta tags/OG tags, carry over existing favicon/OG assets from `wp-content` if present, image optimization, keyboard accessibility.
5. **Base path**: keep building both the root-base and `/_test-static/`-equivalent-pattern configurable build working (already wired in `astro.config.mjs`) — Deploy may want another live subpath check before the real cutover; don't remove that capability even though production is root-based.

## Quality gates (from `CLAUDE.md` + `.claude/agents/frontend.md`)

- Content parity: all nine sections present and accounted for, real copy only.
- TypeScript strict, zero errors (`astro check` clean — already proven working in the Task 01... i.e. Phase 1 skeleton).
- `npm run build` (root base path) produces a clean static output.
- No dependency on WordPress, PHP session state, or the database for rendering a page view.
- No `alert()`/`confirm()` for form feedback (already respected in the skeleton — keep it that way).
- Test in an actual browser before calling this done — golden path (page loads, all sections visible, nav works, form submits successfully) and at least one edge case (form validation errors, mobile viewport).

## REMEDIATION — reopened 2026-08-27, previous pass failed content-parity gate

The previous Frontend pass built all nine section components with correct visual layout matching `Desired-UI-Look*.jpg`, but **hardcoded the mockup's placeholder copy verbatim instead of the real live-site copy** — the exact thing this file's quality gates and `CLAUDE.md`'s "Visual & content reference" section explicitly forbid. `docs/architecture.md`'s "Real content mapping" section (already complete, do not redo) has the correct copy; it was simply never wired in. Verified: zero uses of `getCollection()` anywhere in `site/src` — the content collections exist with correct data but nothing reads them.

**Fix required, section by section (content source = `docs/architecture.md`'s content → component mapping table):**

1. **Hero** — replace mockup headline/subhead/CTA-card text with the real live copy (`H1: INNOWACYJNE` / `H2: ROZWIĄZANIA DLA TWOJEGO BIZNESU` / `H4: Twoje wsparcie i efektywne zarządzanie zasobami`, CTA `NASZA FIRMA`). Keep the mockup's layout shape (headline + subhead + two CTAs + preview cards + logo strip) — just swap the text. Logo strip already has real brand assets in `src/assets/brands/`, keep using them.
2. **Intro (Dla kogo)** — replace "Prowadzisz firmę, nie dyspozytornię." with real copy: `H2: DELEGATE TO MATE` + the real intro paragraph + the 5 real portfolio tiles (Wsparcie operacyjne, Koordynacja zadań zespołu, Rekrutacja pracowników, Pośrednictwo zakupowe, Pozyskiwanie klientów), each linking to `#uslugi`.
3. **Services** — delete the invented pricing tables entirely (no `zł` figures anywhere — architecture.md is explicit that pricing does not exist on the live site and must not be invented). Wire this section to `getCollection('services')` and render all 5 real services (title/description/details already correct in `src/content/services/*.md`) as prose+icon cards, no pricing table. Drop "Abonament Prawa Ręka" / "Concierge Auto" naming — that's mockup-only.
4. **Benefits** — wire to `getCollection('benefits')` and render all 8 real cards (the markdown files in `src/content/benefits/*.md` already have correct copy) instead of the 4 hardcoded mockup cards. Keep the mockup's card-grid visual language, just show all 8 (e.g. 4×2 grid, already supported by `.benefits-grid` CSS at `min-width:1024px`).
5. **Testimonials** — wire to `getCollection('testimonials')` and render all 6 real testimonials with their full quotes (files already correct in `src/content/testimonials/*.md`). Delete the hardcoded 3-card version and the `[Na życzenie: pełne cytaty...]` placeholder note currently shipped in `Testimonials.astro` — that note describes a problem that is already solved; leaving it in shipped markup is itself a bug.
6. **FAQ** — per architecture.md: live site has zero FAQ content, so this section must render empty/hidden (or a subtle "Brak pytań" admin hint) until real Q&A exist in `src/content/faq/*.md` (currently empty — correct, leave it empty). Delete the 4 hardcoded mockup Q&A currently in `FAQ.astro` — do not ship mockup Q&A as real content. Keep the `<details>`/`summary` accordion markup/CSS/keyboard-accessibility so it's ready the moment real FAQ content is authored via Decap.
7. **CTA** — replace "Koniec z gaszeniem pożarów." with the real interstitial copy (`H2: Wybierając współpracę z DELEGATE TO MATE, wybierasz skuteczność, oszczędność i rozwój.` + the real paragraph + CTA `SKONTAKTUJ SIĘ`). Keep phone number and contact form as-is (already correct).
8. **Header/Footer** — nav labels and footer copy should reflect the real site structure per architecture.md (`Start`/`Usługi`/`O nas`/`Kontakt` concepts folded into the mockup's anchor-nav shape is fine per the mapping table — that's an intentional mockup-layout/live-copy merge, not a violation — but footer's descriptive paragraph should use the real "W skrócie" copy, not invented text).
9. **`docs/contact-form-vendor-note.md`** — currently claims "FAQ collection ships empty... Component hides gracefully" which was false against the actual shipped `FAQ.astro`. Once FAQ.astro is fixed per point 6, verify this note is now accurate; fix it if not.
10. **Live contact-form test** — no record exists that the required real test submission (Web3Forms) + inbox-delivery confirmation was ever done. Do this and note the result (mirroring how Phase 4 of the validation spike documented its test). **Resolved 2026-08-28:** confirmed by the user — a real submission through the live RPi deploy landed in the connected inbox. Documented in `docs/contact-form-vendor-note.md`.

**Color direction — WITHDRAWN 2026-08-27.** An earlier version of this note asked for an amber→green accent swap; the user then clarified: "accents stay gold, main theme is green." The current palette already satisfies this as-is — `--navy` (`#0d2b1e`, `#113523`, `#17412e`, `#1a4a33`) is already a dark forest-green hue, not navy blue, and the accent is already gold/amber. **No color changes needed anywhere.** Leave `site/src/styles/global.css` and every inline color style exactly as-is. This remediation pass is content-parity only.

**Done when (remediation):** every section renders real live-site copy (verified against `docs/architecture.md`'s extraction, not the mockup), `getCollection()` is used for services/benefits/testimonials, no invented pricing exists anywhere, FAQ ships empty, colors are untouched, `astro check` and `npm run build` stay clean, and the contact form has an actual documented live test result.

## Done when (original)

- All nine sections built with real content, matching the visual design.
- Contact form live-tested against the actual chosen hosted API (a real test submission, not just a mock) — confirm delivery the same way Phase 4 of the validation spike did (check the receiving inbox).
- `npm run build` clean, browser-tested.
- This task file moves to `.claude/tasks/done/`.
- `production-cutover.task.md` becomes unblocked (still needs its own explicit user sign-off before touching the live server, per that task's own gate).
