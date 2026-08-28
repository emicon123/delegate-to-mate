# Contact form vendor choice — Web3Forms

**Chosen:** Web3Forms (https://web3forms.com) over Formspree.

**Why:** Both free tiers are ample for tiny traffic, but Web3Forms needs only a single `access_key` (no dashboard form creation, no per-form ID, no double opt-in). Key is safe to expose client-side by design (static-site model, CORS-locked, honeypot + optional reCAPTCHA), one env var (`PUBLIC_WEB3FORMS_ACCESS_KEY`), and the POST shape is plain `FormData` to `https://api.web3forms.com/submit` — simpler to wire, test with curl, and swap later (Formspree would be a one-line endpoint change). Deliverability leaves shared-hosting IP, no PHP on host, static-first intact. See `site/src/components/ContactForm.tsx` and `site/.env.example`.

**Env:** `PUBLIC_WEB3FORMS_ACCESS_KEY` — set in `site/.env` (gitignored), exposed client-side via `import.meta.env`. Build embeds it; missing key shows a clear phone-fallback error instead of silently failing.

**Decap + FAQ:** FAQ collection ships empty (live site has no FAQ). `FAQ.astro` reads `getCollection('faq')` and renders nothing at all (no section, no heading, no admin hint) when it's empty — verified against the shipped component 2026-08-27. The nav's `FAQ` link (`Header.astro`/`Footer.astro`) is likewise only rendered when the collection is non-empty, so there's no dead anchor in the meantime. The `<details>`/`summary` accordion markup, CSS, and keyboard accessibility stay in place and activate automatically the first time a `src/content/faq/*.md` file is created via Decap or git.

**Live test:** confirmed working — a real submission through the live RPi deploy (`/delegate/` on the Tailscale host) was sent and landed in the connected inbox, per the user 2026-08-28. Closes remediation item 10 in `.claude/tasks/done/02-nine-section-build.task.md`.
