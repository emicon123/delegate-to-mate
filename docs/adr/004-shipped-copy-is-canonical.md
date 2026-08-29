# ADR-004: Shipped component copy is canonical, superseding the mockup snapshot

**Date:** 2026-08-28
**Status:** Accepted

**Context:**

ADR-003 (same day, earlier) established `docs/reference/mockup-build-snapshot.html` — a byte-exact snapshot of a previously user-confirmed RPi build — as the primary copy source for eight of the nine sections, with the live WordPress site remaining authoritative for testimonials only. `docs/architecture.md`'s "Content restoration" section (Phase 7) transcribed that snapshot into a full section-by-section spec, plus five conversation-sourced edits layered on top (header CTA consolidation, pill-tag cleanup, the Delegate Wsparcie/Delegate Drive rebrand, four line-level copy replacements, responsive CSS fixes), tracked in `.claude/tasks/03-restore-mockup-content.task.md`.

Since that spec was written, two things happened in the working tree, neither reflected in `docs/architecture.md` or `CLAUDE.md`:

1. **User-confirmed direct edits**, made outside any agent and observed already applied on disk / described directly to Architect:
   - `Hero.astro` — the "Zaufali nam" 6-brand client-logo strip was removed entirely, along with `.hero__brands*`/`.brand-logo*` CSS in `global.css`.
   - `CTA.astro` — heading changed from "Koniec z gaszeniem pożarów." to "Koniec z ciągłym przeciążeniem."; subhead changed "…co można oddać z Twojego biurka" to "…co można zdjąć z Twojego biurka"; the phone/contact block dropped "· dostępny 24/7", the street address, and "— odpowiada Maciej".
   - `Footer.astro` — the tagline paragraph under the wordmark was removed, and the street address was removed from the KONTAKT column.

2. **Unconfirmed divergences**, found only by spot-checking the remaining components against the documented "Content restoration" spec while carrying out this reconciliation pass — see "Flagged, not resolved" below.

The user's instruction was explicit: the page content as it currently stands is the real, desired content, and the documentation needs to catch up. That is a directive about *where the source of truth lives* going forward, not a blanket confirmation of every string currently in the tree — several of the unconfirmed items materially change a commercial term (a compensation clause, a price, a floor amount), which is exactly the class of thing this project's quality gates say to flag rather than silently ship or silently fix.

**Decision:**

The authoritative source for the nine sections' copy is now **the shipped Astro components and their content collections** (`site/src/components/sections/*.astro`, `site/src/content/**`) — not `Desired-UI-Look*.jpg`, not `dtm-architecture.html`, and not `docs/reference/mockup-build-snapshot.html`. `docs/architecture.md`'s "Content restoration" section is left in place as a historical record of one intermediate, no-longer-current state — same treatment ADR-003 already gave the "Real content mapping" section before it. Where the two documented specs (mockup-snapshot restoration vs. current tree) disagree, the tree wins.

This applies without further confirmation to the three items enumerated above (Hero brand-strip removal, CTA copy, Footer copy) — the user described or directly made these edits.

It does **not** retroactively bless the following, found via spot-check, as intentional:

- **`Services.astro` overage rate:** shipped copy says **200 zł/h**; `docs/architecture.md`, the task file, and (until this pass) `CLAUDE.md` all say **250 zł/h**. The matching FAQ answer (`src/content/faq/przekroczenie-limitu.md`) also says 200 zł/h — consistent across two independently-maintained files, which argues for a real (if undocumented) decision rather than a typo, but still not confirmed.
- **`Services.astro` Delegate Drive, "Masz już ofertę" path:** the 1000 zł clause is now worded `"Jeśli podejmiemy działania, ale z jakiekolwiek powodu zrezygnujesz z zakupu zapłacisz 1000 zł rekompensaty"` — a fee the **client** pays on cancelling — versus the documented spec's `"Jeśli mimo negocjacji nie dojdzie do zakupu, 1000 zł rekompensaty dla Ciebie"` — a guarantee the **company** pays the client if negotiation fails. This is a reversed commercial meaning, not a copy-edit. The companion Benefits card (`brak-ryzyka-finansowego.md`, "Brak ryzyka finansowego") was reworded to match this new framing ("Jeśli nie dostarczę większej korzyści, nadal nic nie tracisz." replacing the documented "Jeśli negocjacje zakupu auta się nie powiodą, 1000 zł rekompensaty. Ryzyko biorę na siebie.") — the two files are at least internally consistent with each other, again suggesting a deliberate (if undocumented) rework rather than an isolated slip.
- **`Services.astro` Delegate Drive, "Zaczynasz od zera" path:** the documented "minimum 2000 zł" floor on the 1% figure is absent from shipped copy entirely.
- **`Services.astro` "Zakres bazowy" list:** third bullet reads "Wsparcie rekrutacji" versus the documented "Rekrutacja" — minor, low-stakes wording drift, noted for completeness.
- **`Benefits.astro`, "Ekonomika oddelegowania" card:** title shipped as "Ekonomia delegowania" — a rename, not just a description change.
- **`Intro.astro`:** the paragraph no longer contains the "gasisz pożary" firefighting line at all — it now reads `"Jesteś zmuszony do załatwiania mnóstwa spraw: terminy, dostawy, rekrutacja, komunikacja, klienci, oferty do sprawdzenia…"`, which matches neither the documented mockup-restoration spec nor (per the orchestrator, who flagged this explicitly) any of the alternative rewrites the user was shown mid-session and had not yet picked between. Out of scope for this ADR to resolve; noted so it isn't mistaken for settled.

**Consequences:**

- `CLAUDE.md`'s "Visual & content reference" section carries inline annotations at the Hero, Usługa 02, and CTA+Footer bullets pointing at what's now stale, plus a new dated entry recording this resolution in full — see that file.
- `docs/architecture.md` is **not** rewritten to match the tree line-by-line in this pass — that would mean re-deriving nine sections' worth of copy from component source and asserting divergent, unconfirmed commercial terms (the 1000 zł clause, the 2000 zł floor, the 200 vs. 250 zł/h rate) as settled without the user actually having reviewed them. Instead this ADR is the pointer: for current copy, read the components; for how we got here, read `docs/architecture.md`'s Phase 6/Phase 7 sections plus this ADR.
- The flagged items above are **not fixed** by this ADR — no `.astro`/`.css`/content file was edited as part of this reconciliation pass, per the scope given to Architect. They need one of: the user confirming shipped copy is correct (in which case a future pass syncs the docs and closes them out), or a correction back to the documented figures (in which case that's a Frontend content-file edit, not a docs change).
- `.claude/tasks/03-restore-mockup-content.task.md` stays open, not moved to `done/` — see its updated "Done when" checklist. Its Edit #4 (line-level copy edits) is only 3-of-4 correctly applied: the "Delegate Wsparcie" Hero mini-card bullet ships as `"Koordynacja zadań, terminy, dostawcy, klienci"`, matching neither the original snapshot text (`"…rekrutacja"`) nor the edit's specified target (`"Terminy, dostawcy, klienci"`, i.e. dropping the "Koordynacja zadań," prefix). This reads as an incomplete application of a real edit, not a new decision, so it isn't treated as newly canonical the way the three user-described items above are.
- This is a copy-source-of-truth decision only. It does not reopen ADR-001 (contact form → hosted API), ADR-002 (Decap CMS), or the single-page roadmap conclusion. It also does not reopen the JSON-LD `LocalBusiness`/`Organization` address in `site/src/pages/index.astro`, which still carries the street address unchanged — flagged as an open question (should it also be removed, now that the address is gone from visible content?) rather than decided here.
