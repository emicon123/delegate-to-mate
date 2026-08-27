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

## Done when

- All nine sections built with real content, matching the visual design.
- Contact form live-tested against the actual chosen hosted API (a real test submission, not just a mock) — confirm delivery the same way Phase 4 of the validation spike did (check the receiving inbox).
- `npm run build` clean, browser-tested.
- This task file moves to `.claude/tasks/done/`.
- `production-cutover.task.md` becomes unblocked (still needs its own explicit user sign-off before touching the live server, per that task's own gate).
