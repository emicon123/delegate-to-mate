> **Closed 2026-08-29.** `OMnie.astro` shipped with the placeholder photo/bio described below, then updated the same day once the user sent the real photo (`site/src/assets/o-mnie/maciek-borys.png`) and five real bio paragraphs — both are now final, wired in, and `npm run build` is clean. See `docs/architecture.md`'s "Tenth section" status table (updated 2026-08-29) for the final content status. No follow-up remains pending from this task.

# Task: Add a tenth section — "O mnie" (About me) with photo

**New scope, not part of the original nine-section WP migration.** The user asked (2026-08-28) to add a personal "About me" section with a photo. A design proposal was drafted and shown to the user as an Artifact mockup; the user approved it ("Propozycja jest dobra. Zakoduj.") and will send the real photo + bio text in a follow-up message. Name confirmed: **Maciek Boryś** (male — use "Założyciel", not "Założycielka").

**Owner:** Architect (record the decision + content contract) then Frontend (implementation). **Live-site risk:** none — RPi Phase 1 only.

## Approved design spec (from the mockup shown to the user — implement faithfully)

**Placement:** between "Dlaczego" (Benefits.astro) and "Opinie" (Testimonials.astro) in `site/src/pages/index.astro`. Rationale: comes right after the value-prop argument, right before client-proof testimonials — the natural point to introduce the person behind the promise. Also fixes section rhythm: "Dlaczego" is navy, so a cream section here avoids two navy sections in a row.

**Background:** cream, using the existing `.section--cream-2` gradient token (`linear-gradient(180deg, var(--cream-2) 0%, var(--cream) 100%)`), not navy.

**Layout:** two-column grid, photo left / copy right on desktop (`grid-template-columns: 0.85fr 1.15fr`, gap ~60px, breakpoint at 900px per the site's existing `.intro__grid`/`.hero__grid` convention), stacked (photo above copy) below that breakpoint.

**Photo treatment:**
- Portrait aspect ratio 4:5, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-card)`.
- An offset amber-bordered frame behind/around it (`border: 2px solid var(--amber)`, offset ~18px down-right, `opacity: ~0.55`) — reads like a framed photograph.
- **No real photo yet.** Render an elegant placeholder in the meantime: the site's navy/amber gradient (`radial-gradient(...rgba(201,162,39,0.35)...), linear-gradient(155deg, #17412e, #0d2b1e, #0a2217)`) with a simple minimal bust/silhouette (two flat SVG shapes, cream fill, low opacity — not a detailed illustration) and a small caption strip at the bottom: "Miejsce na zdjęcie · portret, proporcje 4:5". This placeholder must be trivial to swap out later — see "Follow-up when the photo arrives" below.

**Copy column:**
- Kicker (small-caps, amber, **no pill background** — the site removed pill-tag badges sitewide in the 2026-08-28 cleanup, ADR-003; don't reintroduce one here): "Poznaj swoją prawą rękę".
- Heading (`.h-section`-equivalent, `font-family: var(--font-display)`, weight 400): "Cześć, jestem Maciek."
- Two short bio paragraphs, `.lead`-style (`color: #475569`, `font-size: 15.5px`, `line-height: 1.75`, `max-width: 56ch`). **Real bio text not yet supplied** — use bracketed draft placeholders for facts only the user can provide (years of experience, professional background), e.g.:
  1. "Nie jestem platformą ani call center — jestem jedną osobą, z którą rozmawiasz od pierwszego telefonu do ostatniego załatwionego tematu. **[X lat]** spędziłem w **[branża / tło zawodowe]**, zanim doszedłem do wniosku, że najwięcej wnoszę tam, gdzie mogę zdjąć z kogoś operacyjny ciężar prowadzenia firmy."
  2. "Traktuję Twoją firmę jak swoją — bez podwykonawców, bez „to nie mój dział”. Jeśli się na coś umawiamy, biorę za to odpowiedzialność osobiście."
  Wrap the bracketed fill-in spans in a `.fill` class (`border-bottom: 1.5px dotted var(--amber-dark); color: var(--amber-dark); font-weight: 600`) so they're visually obvious as drafts, not shipped as final copy.
- **Signature element** (the section's one distinctive/memorable touch): below a `border-top: 1px solid var(--border-cream)` divider, the name set in italic Fraunces amber — reusing the exact treatment already used for the emphasized word in the Hero's `<h1><em>` (`.hero h1 em { color: var(--amber); font-style: italic; }`), at ~28–32px. Text: "Maciek Boryś" (real name — use it now, it's confirmed). Below it, smaller muted text: "Założyciel delegate to mate".
- CTA: a text link (not a `.btn`) styled like the nav's underline-on-hover pattern — amber `border-bottom`, gap widens on hover: "Umów rozmowę →" linking to `#kontakt`.

## What's already decided — don't re-litigate

- Placement, background, layout, photo treatment, signature element, and no-pill rule above are **approved**, not open questions. Record them in `docs/architecture.md`, don't re-derive them from the mockup images or ask the user again.
- Real name is confirmed: **Maciek Boryś**, "Założyciel". Use it in the heading and signature now.

## Follow-up when the photo/bio text arrive (do not block on this now)

The user said they'll send the real photo and finished bio text in a later message. Build the section so swapping them in later is a small, obvious change:
- Photo: land it under `site/src/assets/o-mnie/` and note in a short code comment (in `OMnie.astro`) exactly which placeholder block to replace with an Astro `<Image>` (`astro:assets`) once the file exists — don't wire up an `astro:assets` import for a file that doesn't exist yet.
- Bio paragraphs: the two `.fill`-marked drafts above get replaced with the user's real sentences; no other markup should need to change.

## Done when

- `docs/architecture.md` records this as a deliberate addition beyond the original nine-section WP migration (with a one-line pointer added to `CLAUDE.md` so a future agent doesn't read the "nine sections" content-parity gate as excluding this section) — an ADR is likely unnecessary (no real trade-off to weigh), Architect's call.
- `site/src/components/sections/OMnie.astro` exists, matches the approved spec above, and is wired into `site/src/pages/index.astro` between `<Benefits />` and `<Testimonials />`.
- Responsive down to mobile (stacked layout below 900px), keyboard-focusable CTA with a visible focus state, `prefers-reduced-motion` respected if any transition is added.
- `npm run build` clean.
- This task file moves to `.claude/tasks/done/` once the photo/bio are still pending — leave a note in it (or in `docs/architecture.md`) that a small follow-up is expected when the user sends those assets.
