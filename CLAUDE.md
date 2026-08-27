# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Whenever doing any task leading to code changes:
- spawn an architect agent for anything touching content mapping, structure, or open decisions
- if the task is big, create task.md file(s) in `.claude/tasks`
- spawn frontend/deploy agent(s) to handle the implementation (+ architecture context)

You can see more in ## Agent orchestration and ## Task workflow below.

## What this is

delegatetomate.pl — a single Polish-language marketing landing page ("Prawa Ręka do prowadzenia…"), currently a WordPress 7.1 + Elementor(+Pro) install on seohost.pl shared hosting. Migrating off WordPress to a static-first React/Astro build, staying on the same server. No blog, no user accounts, no e-commerce — the entire "app" is nine scroll sections plus a contact form (see `dtm-architecture.html` §02).

**Canonical read:** `dtm-architecture.html` in the repo root is the architecture doc — the current WP install as inferred from disk, the page's actual content structure, what the host actually allows, and the stack decision with reasoning. Read it before any structural work. If a task or code contradicts what it says, flag it — don't silently pick a side.

`.env` (gitignored, never read into this doc or committed) holds the FTP deploy credentials (`FTP_SERVER`, `FTP_PORT`, `FTP_LOGIN`, `FTP_PASSWORD`) and the MariaDB connection (`MARIA_DB_HOSTNAME`, `MARIA_DB`, `DB_USERNAME`, `DB_PASSWORD`) for this hosting account.

## Visual & content reference — `Desired-UI-Look*.jpg`

These two screenshots (a scroll capture, `Desired-UI-Lookjpg.jpg` then `Desired-UI-Look2jpg.jpg`) are the target look for the rebuild — read them before proposing any layout or component structure. **Visual/layout reference only — the copy shown is placeholder, not final content** (resolved, see Open Questions below): pricing, FAQ answers, footer address/phone, all of it needs to be re-derived from the live site, not copied from the mockup text. Look at the images directly for exact colors/spacing/type — sample real values from the files rather than guessing hex codes.

**Design language:** dark navy sections (Hero, Dlaczego, CTA+Footer) alternating with warm cream/beige sections (Dla kogo, Usługa 01/02, Opinie, FAQ); amber/gold as the one accent color, used only for CTAs, pill-tags (`NOWA OFERTA`, `DLA KOGO`, `USŁUGA 01`, …), and small label text; bold serif-ish display headlines over clean sans body text; rounded buttons and cards; a "most popular" pricing tier gets a highlighted amber tag.

**Section-by-section, matching the nine sections named elsewhere in this file:**
- **Header/Nav:** "delegate to mate" wordmark (accent color on "to mate"), nav links (Usługi, Jak to działa, Opinie, FAQ), dark "Umów rozmowę" CTA button.
- **Hero:** headline "Prawa Ręka do prowadzenia firmy i do zakupu auta", subhead, two CTAs ("Umów rozmowę" filled amber, "Zobacz cennik" outline), two small service-preview cards, and a client-logo strip ("Zaufali nam": Płatkowski.net, Horizon, Bartom, Art-Bud, Gelato Nobile, Budspaw).
- **Dla kogo:** heading "Prowadzisz firmę, nie dyspozytornię." plus an audience-framing paragraph.
- **Usługa 01 — Abonament "Prawa Ręka":** a bulleted base scope, an amber-highlighted "Moduł premium" upsell box, and three pricing tiers (Bazowy 2400 zł/20h, Standard 3300 zł/30h — marked "najczęściej wybierany", Rozszerzony 4000 zł/40h) with an overage note ("Bezpiecznik: przekroczenie limitu godzin to dopłata 250 zł/h…").
- **Usługa 02 — Concierge Auto:** two pricing paths (has an offer already: 30% of negotiated savings, with a 1000 zł compensation guarantee if negotiation fails; starting from zero: 2500 zł flat or 1% of config value, min 2000 zł).
- **Dlaczego:** heading "Partner biznesowy, który działa dla dobra Twojej firmy, nie pracownik na etacie." plus four value-prop cards (Ekonomika oddelegowania, Brak konfliktu interesu, Przewidywalny koszt, Brak ryzyka finansowego).
- **Opinie:** three testimonial cards (Rafał Płatkowski/Płatkowski.net, Zespół Horizon, Zespół Bartom) — **the mockup itself flags these as incomplete**: `[UZUPEŁNIĆ: pełne cytaty z aktualnej strony, powyższe to fragmenty widoczne dziś na delegatetomate.pl]` ("fill in: full quotes from the current site, the above are just fragments visible today"). Architect must pull the real, full quotes from the live site for these — don't ship the fragment text as final copy.
- **FAQ:** four accordion questions (unused-hours rollover, whose interest is represented when buying a car, overage cost, whether delegating is worth it at all) with one shown expanded as an example.
- **CTA+Footer:** closing heading "Koniec z gaszeniem pożarów.", phone CTA "(+48) 796 017 986 · dostępny 24/7", and a footer with nav links, contact (phone, address "Marii Konopnickiej 22, 43-200 Pszczyna", Facebook/Instagram @delegate_to_mate), and a copyright line.

**RESOLVED:** confirmed with the user — the mockup's copy is placeholder throughout, not just the testimonials. Architect must derive all nine sections' real copy from the live site (fetch the rendered pages — DB access to the raw Elementor JSON isn't confirmed reachable from outside the host, so treat the live rendered HTML as the primary source), using the mockup only for layout/visual structure.

## Hard constraints (these shape every decision)

These describe the **production target** (Phase 2 below) — the RPi testing phase doesn't change any of them, it's a staging environment to preview builds before the real cutover.

- **Same server, no upgrade assumed** — seohost.pl shared hosting: LiteSpeed + PHP-FPM, MariaDB, cPanel. **FTP is the confirmed deploy path.** cPanel also exposes SSH and a Node.js/Python Application Manager (Passenger), but don't assume either is in active use without checking first.
- **Static-first** — no PHP, no WordPress, no DB in the request path for a page view. Ship pre-built HTML/CSS/JS to `public_html`.
- **Cost-free only** — every tool, library, and service must be free / open-source, matching current spend (effectively zero).
- **Tiny traffic** — a handful of real visits/day, the rest is bots. Optimize for correctness and low maintenance, not scale.
- **Go is off the table** on this host — seohost's Application Manager covers Node.js and Python via Passenger only; Go needs a VPS upgrade. Don't propose it.

## Deployment phases

**Phase 1 — testing (current).** Before the real seohost.pl cutover, the build runs on a home Raspberry Pi — the same box that already hosts investing-app — reachable over the internet only via Tailscale VPN, no public domain yet. URL for now: `<tailscale-hostname>/delegate`.

Served through that Pi's existing shared Docker/Nginx stack rather than a standalone setup. investing-app's `infra/nginx/nginx.conf` and `infra/compose.yml` already establish the pattern for hosting multiple sibling apps behind one Nginx on that Pi: each app is its own container on the external `investing-shared` Docker network, proxied under a path prefix (`/ticket/`, `/leszek/`, `/magda/` are the existing examples — `/leszek/` and `/magda/` in particular are the closest precedent, since like this project they're a frontend container proxied under a prefix). This project's `frontend-delegate` (or similar) container should follow that same pattern, and needs a matching `location /delegate/` block added to investing-app's shared `nginx.conf` — that file lives in the investing-app repo, not here, so this is a cross-repo change to call out explicitly when it's time to wire it up, not something to edit silently from this project.

**Build implication:** because the same static output gets served from a subpath now (`/delegate/`) and from the domain root later (Phase 2), don't hardcode root-relative asset paths (`/assets/...`). Use a configurable base path (e.g. Astro's `base` config option) so the same build output works in both places, or is trivially reconfigured between them.

**Phase 2 — production (target, unchanged).** Once the rebuild is verified on the RPi, deploy moves to the real target: seohost.pl over FTP, per the hard constraints above and the rest of this file. The RPi phase is temporary scaffolding for testing, not a second permanent home.

## Known security issue — close this as part of the work

`public_html/backup.php` → `db_dump.php` → `zip.php` is a live, **unauthenticated** dump-and-zip chain with **hardcoded plaintext DB credentials**, and it writes the resulting `.sql`/`.zip` straight into the public web root. These three files are already gitignored so they won't get committed forward, but they are still live on the actual server today. Before or alongside the rebuild:
- delete/move these three files off the server entirely
- rotate the DB password they contain — check *both* databases on the hosting account, since the script's hardcoded DB name doesn't match this site's own (looks like a leftover from another project on the same account)
- check the live web root for any `db_backup_*.sql` / `www_backup_*.zip` already dropped there and remove them

Full detail: `dtm-architecture.html`, the "Before anything else" callout.

## Agent orchestration

The main Claude Code session is the orchestrator. It reads this file, then spawns specialist agents (subagents cannot spawn further subagents — one level only). Each agent starts with fresh context and receives this file plus a task summary.

| Work | Agent |
|---|---|
| Content mapping (Elementor JSON → components), CMS/no-CMS and other open decisions, ADRs | **Architect** |
| React/Astro static build — all nine sections, contact form UI, SEO/meta, accessibility | **Frontend** |
| FTP deploy (Phase 2), the interim RPi/Docker/Tailscale deploy (Phase 1), `.htaccess`/LiteSpeed config, contact-form backend endpoint (if kept in PHP), hosting cleanup incl. the backup.php exposure above | **Deploy** |

**Sequencing gate:** Architect maps content and resolves the open questions below *before* Frontend starts building sections against them.

## Open questions (settle before scoping the build — see `dtm-architecture.html` §05)

- ~~Does anyone non-technical need to edit copy/pricing later?~~ — **RESOLVED: yes — Decap CMS.** Git-based, no backend, content edits become commits via a static `/admin` SPA; publishing stays `rebuild + FTP`. Alternatives (Contentful, Sanity, Tina, Strapi) evaluated and rejected for this project's `cost-free + static-first + FTP-only + no persistent process` constraints. Full reasoning: `docs/adr/002-headless-cms.md` and `docs/architecture.md` (Decision 4).
- ~~Contact form destination~~ — **RESOLVED.** Hosted form API (Web3Forms or Formspree), not PHP `mail()` on this host. Decided after a live Phase 4 test (`.claude/tasks/done/ftp-host-validation.task.md`) showed `mail()` working mechanically but landing in spam. Full reasoning: `docs/architecture.md` (Decision 3) and `docs/adr/001-contact-form-destination.md`.
- ~~Is the copy shown in `Desired-UI-Look*.jpg` final content or placeholder?~~ — **RESOLVED: placeholder.** All copy (not just testimonials) must come from the live site, not the mockup. See the note in the "Visual & content reference" section above. Real copy extracted 2026-08-27 from the live rendered pages — `docs/architecture.md` §Real content mapping.
- ~~Anything beyond this one page on the roadmap (blog, multi-language, gated content)?~~ — **RESOLVED: no.** Checked directly with the user 2026-08-27 — no concrete near-term plan beyond this single landing page (standalone `/polityka-prywatnosci/` is the only other retained page). Static-first Astro + Decap stands; Next.js trigger remains per `dtm-architecture.html` §04–§05.

## Quality gates

- A page view must not depend on the database or a PHP render step — static files served directly by LiteSpeed.
- Content parity: every one of the nine current sections (Header/Nav, Hero, Dla kogo, Usługa 01, Usługa 02, Dlaczego, Opinie, FAQ, CTA+Footer) is accounted for in the rebuild or explicitly dropped with a stated reason.
- Polish-language copy is preserved as-is during migration — no re-translation or "cleanup" unless explicitly asked.
- Accessibility and SEO should match or improve on the current Elementor output — for a one-page marketing site, both are load-bearing.
- No secrets in the repo — DB creds, SMTP creds, etc. live in `.env` (gitignored), never in code.

## Task workflow

Work items live in `.claude/tasks/` as `<task-name>.task.md` files. When starting a session:
1. List `.claude/tasks/` and read the first task file.
2. Execute it — spawn the appropriate specialist agent(s) per the orchestration table above.
3. On completion, delete the task file (or move it to `.claude/tasks/done/` if history is useful).

Add new tasks by dropping a `<name>.task.md` file into `.claude/tasks/`.

## Git

- Repository has no commits yet — the current working tree is the initial FTP snapshot of `public_html`, pulled down for reference and migration. First commit is still pending.
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.).

## Project structure (current + target)

```
maciek/
├── dtm-architecture.html      # canonical architecture read
├── Desired-UI-Look*.jpg       # visual AND content reference — see the section above
├── public_html/               # a LOCAL SNAPSHOT of the live web root, pulled down for reference —
│   │                          # not synced to the live site; editing it locally changes nothing
│   │                          # visitors see. The real deploy target is the remote path on
│   │                          # seohost.pl, reached over FTP with .env's credentials.
│   ├── wp-*, wp-admin/, wp-content/, wp-includes/   # current WP core + Dividenz theme + plugins (to be removed)
│   └── .htaccess              # LiteSpeed rewrite rules — will need static-site rules once WP is gone
└── [new] site source dir      # the React/Astro source — Architect names this when scoping the build
```

Once the rebuild is scoped, WordPress core/theme/plugin files under `public_html` get removed and replaced by the static build output. Do not build the new site as a WordPress theme or plugin — the whole point is to drop WordPress.

## Deploying

**Phase 1 — RPi (current, testing only):**
1. Build locally in the site source dir → static output, built with the `/delegate` base path.
2. Ship the build into a container (following the `frontend-leszek`/`frontend-magda` pattern in investing-app's `infra/compose.yml`) joined to the external `investing-shared` network.
3. Add/confirm the `location /delegate/` proxy block in investing-app's shared `nginx.conf` — a change in that repo, not this one.
4. Verify at `<tailscale-hostname>/delegate`.

**Phase 2 — seohost.pl (target, once the rebuild is done):**

FTP is the only confirmed deploy path — no CI/CD, no git-based deploy on this host.
1. Build locally in the site source dir (e.g. `npm run build`) → static output, built with the root base path (no `/delegate` prefix).
2. Push the build output to `public_html` over FTP/rsync, replacing the WordPress files it supersedes.
3. Verify `.htaccess` still matches what the static build needs — WordPress's rewrite rules won't apply once WP is gone.
