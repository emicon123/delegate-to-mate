# ADR-003: Restore mockup copy as final content, superseding the live-site extraction

**Date:** 2026-08-28
**Status:** Accepted

**Context:**

ADR-implicit decision from 2026-08-27 (documented in `docs/architecture.md` §"Real content mapping", executed in commit `fcd4079`, task `.claude/tasks/done/02-nine-section-build.task.md`) deliberately replaced the `Desired-UI-Look*.jpg` mockup's copy — the "Prawa Ręka" headline, the "Abonament „Prawa Ręka”"/"Concierge Auto" service naming, all three pricing tiers, the Concierge Auto pricing paths, and the four-question FAQ — with copy extracted from the live WordPress site (`https://www.delegatetomate.pl/`). That was the correct call at the time: the mockup was explicitly unconfirmed as final content, none of that pricing/FAQ text existed anywhere in live content, and `CLAUDE.md`'s quality gate barred inventing copy.

On 2026-08-28, after seeing the WP-extracted-copy version live on the Phase 1 RPi preview, the user reversed this directly and repeatedly: **the mockup's own copy is the desired final content**, not a placeholder. `CLAUDE.md`'s "Visual & content reference" section was updated to reflect this before this ADR was written.

A complication: the exact mockup-copy build that the user confirmed was never committed to git (checked both `881cc59` and `fcd4079` — neither contains the "Prawa Ręka" headline, pricing tiers, or "NOWA OFERTA" pill). It only ever existed as a manually-built Docker image on the RPi, and that image was overwritten by a `--no-cache` rebuild before this correction landed — confirmed unrecoverable via `docker images` (no dangling image survived). A full HTML snapshot of the exact page was fetched and saved before the overwrite, at `docs/reference/mockup-build-snapshot.html`, and is the only remaining byte-exact record of what the user confirmed.

**Decision:**

Treat `docs/reference/mockup-build-snapshot.html` — not the `Desired-UI-Look*.jpg` screenshots, not `dtm-architecture.html`, and not the live WP site (except for testimonials, see below) — as the **primary, authoritative source for all nine sections' copy**, superseding the 2026-08-27 live-site extraction for eight of nine sections. `docs/architecture.md` §"Content restoration" carries the full section-by-section spec transcribed from this file, with five additional conversation-sourced edits (header CTA consolidation, pill-tag removal, the Delegate Wsparcie/Delegate Drive rebrand, four line-level copy replacements) layered on top per `.claude/tasks/03-restore-mockup-content.task.md`.

**Exception — testimonials:** the mockup snapshot's own build flags its three testimonial cards as fragments needing the real quotes (`[Na życzenie: pełne cytaty z aktualnej strony…]`). The live-site extraction already pulled the real, full quotes for all 6 testimonials on 2026-08-27, and they're already committed in `site/src/content/testimonials/*.md`. That work is not undone by this reversal — it's the one section where the live site remains the copy source of record, because the mockup itself says so.

This also explicitly reverses the 2026-08-27 "no invented pricing" quality-gate note. The pricing figures being restored (`2400 zł`/`3300 zł`/`4000 zł` tiers, `250 zł/h` overage, Concierge Auto's `30%`/`1000 zł`/`2500 zł`/`1%`/`2000 zł` terms) are not new inventions — they are figures from a previously built and user-confirmed version, being reinstated from the preserved snapshot.

**Consequences:**

- `docs/architecture.md`'s "Real content mapping" section (2026-08-27) is left in place as a historical record — it is not deleted — but is explicitly marked superseded by the newer "Content restoration" section for everything except testimonials. A future reader comparing the two should trust the later section.
- `Services.astro` needs a structural rewrite, not just new Markdown files: the current component and its Zod schema (`content.config.ts`) were built for a generic N-item service-tile loop with no pricing fields, matching the live site's 5 prose-only services. The restored content is two fixed, differently-shaped blocks (a 3-tier pricing table and a 2-path pricing card layout) that don't fit that loop.
- `benefits` collection content is fully replaced (8 live-site entries → 4 mockup entries) rather than merged — the old 8 no longer describe any shipped section.
- `faq` collection goes from intentionally empty (a 2026-08-27 decision: "do not ship the mockup's placeholder Q&A") to populated with that same Q&A, now that it's confirmed non-placeholder. The component logic (`faqs.length > 0` guard) needs no change — only content.
- Two items are flagged in `docs/architecture.md` rather than silently resolved: FAQ's first answer still refers to "Prawa Ręka" un-rebranded against the new "Delegate Wsparcie" service name, and the page's SEO `<title>`/`<meta description>` are stale WP-era copy with no "final" replacement text in any source — a proposed fix assembled from already-restored copy is offered, not invented independently.
- This is a copy-source decision only. It does not reopen or alter ADR-001 (contact form → hosted API), ADR-002 (Decap CMS), the static-first/Astro stack decision, or the single-page-roadmap conclusion.
- Going forward, if the RPi/Docker workflow produces another manually-tweaked build that isn't committed to git before a `--no-cache` rebuild, that content is at real risk of being unrecoverable — as it nearly was here. Worth a Deploy-side note to commit or snapshot before any `--no-cache` rebuild that follows manual, uncommitted changes.
