# Task: Real content mapping + CMS decision (kicks off the real build)

**Why now:** the deploy-validation spike (`.claude/tasks/done/ftp-host-validation.task.md`) proved the static-first/Astro/FTP stack works end-to-end on the real host. This task starts the actual nine-section build by resolving the two remaining open questions from `CLAUDE.md` and producing a real content map — `02-nine-section-build.task.md` is blocked on this per the sequencing gate ("Architect maps content and resolves the open questions before Frontend starts building sections against them").

**Owner:** Architect. **Live-site risk:** read-only (fetching the public live site is fine; no FTP writes, no server-side changes in this task).

## 1. Extract real content for all nine sections

The mockup (`Desired-UI-Look*.jpg`) is confirmed **layout/visual reference only** — its copy (pricing, FAQ answers, footer info, everything) is placeholder, not final content. All real copy must come from the live site.

- **DB access to the raw Elementor JSON is not confirmed reachable from outside the host** (`MARIA_DB_HOSTNAME=localhost` in `.env` implies it's only reachable from within seohost.pl itself) — don't spend time on a direct DB connection. Instead, fetch the **live rendered pages** (`https://delegatetomate.pl/` / `https://www.delegatetomate.pl/` — note the live site redirects `delegatetomate.pl` → `www.delegatetomate.pl`, confirmed during the validation spike) and extract the actual current copy from the rendered HTML.
- Cover all nine sections named in `dtm-architecture.html` §02 / `CLAUDE.md`: Header/Nav, Hero, Dla kogo, Usługa 01, Usługa 02, Dlaczego, Opinie, FAQ, CTA+Footer. Pull exact Polish copy — no re-translation, no "cleanup" (per `CLAUDE.md`'s quality gates).
- FAQ accordion text is likely present in the DOM even if visually collapsed — check the fetched HTML directly rather than assuming content is missing because it's not visually expanded.
- Testimonials specifically were already flagged (mockup shows fragments only) — get full, real quotes from the live site.
- If anything on the live site doesn't match what `dtm-architecture.html`'s content-structure section describes, flag the mismatch — don't silently pick a side (per this project's standing rule on doc/reality mismatches).

## 2. Map content → component structure

Write the mapping into `docs/architecture.md` (already has the Phase 0-5 validation-spike history — add a new section for this, don't overwrite the existing history): one target component per section, matching the visual/layout structure from `Desired-UI-Look*.jpg` but with the real extracted copy. Flag anything that doesn't survive the port as-is (an Elementor widget with no static equivalent, etc.).

## 3. Decide the headless CMS

`CLAUDE.md`'s open questions: **CMS need is resolved (yes, needed)** — the specific CMS choice is not. Evaluate options against this project's hard constraints (cost-free only, static-first/Astro, FTP-only deploy, no persistent Node/backend process, tiny traffic):

- A **git-based CMS** (e.g. Decap CMS — no backend of its own, content edits become git commits via an admin UI served as a static route, "publish" is still just "rebuild + FTP the output") is a strong starting candidate given these constraints specifically — evaluate it seriously, but don't default to it without comparing against at least one real alternative (e.g. a hosted headless CMS with a generous free tier) and stating why the chosen one wins here.
- Record the decision as an ADR in `docs/adr/` (pattern: `002-headless-cms.md`, following `001-contact-form-destination.md`'s format) and fold the practical consequences into `docs/architecture.md` — what content becomes CMS-managed (probably: pricing figures, FAQ text, testimonials — things likely to change) vs. what stays in code (layout, structure, copy unlikely to change), and what Frontend needs to build (the CMS admin route/config, and how Astro reads CMS-authored content — e.g. Astro content collections reading Markdown/YAML files).

## 4. Quick check on the remaining open question (roadmap)

`CLAUDE.md`'s last open question ("anything beyond this one page on the roadmap?") is not a hard blocker — the static architecture is already substantially proven via the spike, and revisiting the whole stack over a speculative future feature would be overkill. Ask the user directly (one question) whether there's a *concrete* near-term plan beyond this page; if genuinely nothing concrete, note that in `docs/architecture.md` and move on — don't block the build on it.

## Done when

- `docs/architecture.md` has the real content map for all nine sections and the CMS decision + ADR.
- `CLAUDE.md`'s remaining open questions are updated to reflect resolution (CMS choice, roadmap check).
- This task file moves to `.claude/tasks/done/`.
- `02-nine-section-build.task.md` is unblocked.
