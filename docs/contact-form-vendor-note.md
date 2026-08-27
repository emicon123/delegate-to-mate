# Contact form vendor choice — Web3Forms

**Chosen:** Web3Forms (https://web3forms.com) over Formspree.

**Why:** Both free tiers are ample for tiny traffic, but Web3Forms needs only a single `access_key` (no dashboard form creation, no per-form ID, no double opt-in). Key is safe to expose client-side by design (static-site model, CORS-locked, honeypot + optional reCAPTCHA), one env var (`PUBLIC_WEB3FORMS_ACCESS_KEY`), and the POST shape is plain `FormData` to `https://api.web3forms.com/submit` — simpler to wire, test with curl, and swap later (Formspree would be a one-line endpoint change). Deliverability leaves shared-hosting IP, no PHP on host, static-first intact. See `site/src/components/ContactForm.tsx` and `site/.env.example`.

**Env:** `PUBLIC_WEB3FORMS_ACCESS_KEY` — set in `site/.env` (gitignored), exposed client-side via `import.meta.env`. Build embeds it; missing key shows a clear phone-fallback error instead of silently failing.

**Decap + FAQ:** FAQ collection ships empty (live site has no FAQ). Component hides gracefully and shows `/admin` hint until first `src/content/faq/*.md` is created via Decap or git.
