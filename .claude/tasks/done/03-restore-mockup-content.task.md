# Task: Restore mockup copy as final content, layer conversation-sourced edits on top

**Status as of 2026-08-28 (Architect verification pass, see `docs/adr/004-shipped-copy-is-canonical.md`): NOT moved to `done/` — left open.** Four of the five conversation-sourced edits below are fully and correctly applied in the working tree. Edit #4 (line-level copy edits) is only 3-of-4 correct — see the updated "Done when" checklist for the specific miss. Separately, the source-of-truth this task restored from (the mockup snapshot) has itself since been superseded: per `docs/adr/004-shipped-copy-is-canonical.md`, the user has now confirmed the *shipped* component copy — not the mockup snapshot — is canonical going forward, and that pass surfaced several further divergences from this task's original spec (pricing figures, a reversed compensation clause, a dropped price floor, a renamed Benefits card, a reworded Intro paragraph) that were never confirmed as intentional. Those are tracked in ADR-004 and `CLAUDE.md`'s "Visual & content reference" dated entry, not here — this task file's own scope stays the original five edits.

**Reverses part of `02-nine-section-build.task.md`'s "REMEDIATION" pass.** That pass (2026-08-27) deliberately stripped the mockup's copy — pricing tiers, "Abonament Prawa Ręka"/"Concierge Auto" naming, FAQ content, "Prawa Ręka" headline, etc. — and replaced it with copy extracted from the live WordPress site, because at the time that was confirmed as the correct source of truth. On 2026-08-28, after seeing the result on the Phase 1 RPi preview, the user reversed that decision directly and repeatedly: **the mockup's own copy is the desired final content**, not the WP-extracted copy. See `CLAUDE.md`'s "Visual & content reference" section (updated) for the current, authoritative framing.

**Owner:** Architect (decision record + exact final copy spec) then Frontend (implementation). **Live-site risk:** none directly — RPi Phase 1 only; no seohost.pl/production changes.

## What stays from the 2026-08-27 rewrite (do not throw away)

The `fix: wire real site copy into all nine sections` commit (`fcd4079`) wasn't just a copy swap — it introduced real engineering improvements: Astro content collections (`getCollection()`) for services/benefits/testimonials, Decap CMS wiring, accessibility work, SEO/meta, and (from the current working tree, uncommitted) a responsive-CSS fix to `.hero__cards`/`.hero__mini` (missing breakpoint caused text to crowd the icon on narrow viewports) plus spacing/line-height hardening across icon+text card patterns. **Keep all of this.** The task is to re-populate that improved component/content structure with the mockup's copy — not to `git checkout 881cc59 -- site/` and lose the engineering.

## What comes back (from the mockup — `Desired-UI-Look*.jpg`, `dtm-architecture.html`, and commit `881cc59` as an exact-wording reference)

All nine sections' copy, per `CLAUDE.md`'s "Visual & content reference" section-by-section breakdown — including things the 2026-08-27 remediation explicitly removed:
- Hero headline "Prawa Ręka do prowadzenia firmy i do zakupu auta" + its subhead and two CTAs.
- Full "Usługa 01"/"Usługa 02" pricing structure (tiers, `zł` amounts, overage note, Concierge Auto's two pricing paths) — see below for the renaming layered on top.
- FAQ's four accordion questions.
- "Dla kogo" and "Dlaczego" headings/copy, CTA+Footer closing heading and footer details.
- Testimonials: still pull full real quotes (not the mockup's own flagged-incomplete fragments) — the mockup itself marks these `[UZUPEŁNIĆ: pełne cytaty...]` as needing the real quotes; that instruction stands even though the rest of the copy reverts to mockup text.

## Conversation-sourced edits to layer on top of the mockup baseline (do not skip — these are not in the raw mockup)

1. **Header CTA consolidation.** The mockup's Header has a plain "Kontakt" nav link *and* a separate "Umów rozmowę" CTA button — user confirmed these are the same action. Remove the plain nav link; keep the CTA button; change its label to **"Kontakt"** (desktop + mobile nav). This was already implemented against the interim real-content `Header.astro` — reapply the same logic against the mockup-restored Header.

2. **Pill-tag cleanup.** Remove the small amber pill-tag badges — at minimum "NOWA OFERTA" (Hero) and the "USŁUGA 01"/"USŁUGA 02" tags on the two service blocks. Keep the underlying section content; only the decorative badge labels go.

3. **Rebrand the two service blocks:**
   - "Usługa 01 — Abonament „Prawa Ręka”" → **"Delegate Wsparcie"**
   - "Usługa 02 — Concierge Auto" → **"Delegate Drive"**

4. **Line-level copy edits** (exact replacements, Polish diacritics as given):
   - Hero subhead: "…toną w bieżączce…" → "…toną w sprawach bieżących…"
   - Hero/tagline line: "Przejmuję operacyjny ciężar Twojej firmy i pilnuję, żebyś nie przepłacił za samochód firmowy." → "…żebyś nie przepłacił za nowy samochód."
   - "Delegate Wsparcie" bullet: "Koordynacja zadań, terminy, dostawcy, rekrutacja" → "Terminy, dostawcy, klienci"
   - "Delegate Drive" bullet: "Negocjuję bez konfliktu interesu" → "Negocjuję ceny bez konfliktu interesu"

5. **Typography/responsive CSS fixes** (already implemented against the interim build, working tree uncommitted) — reapply/verify against whatever markup shape the mockup-restored Hero/Services components end up with: `.hero__cards` needs a `min-width: 640px` breakpoint before going two-column, icon→title→paragraph spacing should use flex+gap (not stacked margins), and card-title line-heights should be loosened for Polish-diacritic safety. Don't lose this work when re-authoring the sections' markup.

## Explicit scope note for Architect

Restoring full mockup pricing (`zł` amounts, tier names, overage/negotiation terms) is itself a reversal of the "no invented pricing" constraint from the prior resolution — this is intentional and user-confirmed, not an oversight. Record this clearly in `docs/architecture.md` and add/update an ADR so a future reader doesn't mistake it for a violation of the "content parity, no invented copy" quality gate. Do not additionally invent anything beyond what's in the mockup images/`dtm-architecture.html` plus the five edits above — if something in the mockup is genuinely illegible/ambiguous in the screenshots, flag it rather than guessing.

## Done when

- [x] `docs/architecture.md` and a new/updated ADR record this reversal and the current authoritative content source. (ADR-003, plus the "Content restoration" section of `docs/architecture.md`.)
- [x] All nine sections render the mockup's copy (verified against `Desired-UI-Look*.jpg`/`dtm-architecture.html`), with the five conversation-sourced edits above applied on top — **with one exception**, see next line.
- [x] **Edit #4, third bullet — fixed 2026-08-29.** `Hero.astro`'s "Delegate Wsparcie" mini-card bullet now reads `"Terminy, dostawcy, klienci"` (the `"Koordynacja zadań,"` prefix dropped), matching this task's specified target. All four Edit #4 replacements are now correctly applied.
- [x] Content-collection/CMS/a11y/SEO engineering from the 2026-08-27 rewrite is preserved, not reverted.
- [x] The responsive/typography CSS fixes are present and correct against the final markup — verified 2026-08-28: `.hero__cards` has its `min-width:640px` breakpoint, `.hero__mini` uses flex+gap, line-heights loosened.
- [x] `npm run build` clean — re-verified 2026-08-29 after the Edit #4 fix.
- [x] RPi Phase 1 container rebuilt and redeployed 2026-08-29; `curl` of the Tailscale `/delegate/` URL confirms "Terminy, dostawcy, klienci" is live and the stray "Koordynacja zadań" no longer appears in the Hero mini-card (a separate, legitimate occurrence of that phrase remains in the Services.astro scope list, unrelated to this bullet).
- [x] Task complete — moved to `.claude/tasks/done/`. Per the note below, "done" here means the five edits are correctly applied on top of *current* shipped copy (ADR-004's canonical source), not a re-import of the mockup snapshot's exact wording anywhere the tree has since intentionally diverged.
