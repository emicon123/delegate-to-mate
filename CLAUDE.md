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

These two screenshots (a scroll capture, `Desired-UI-Lookjpg.jpg` then `Desired-UI-Look2jpg.jpg`) are the target look **and content** for the rebuild — read them before proposing any layout or component structure. **The mockup's copy is final content** (RESOLVED 2026-08-28, superseding the 2026-08-27 "real content only" resolution below): pricing, section headings, FAQ answers, footer address/phone — all of it comes from the mockup text itself, not re-derived from the live WordPress site. A set of specific edits layered on top of that mockup-copy baseline (button consolidation, pill-tag cleanup, two rebranded service names, several line-level copy edits, and responsive/typography fixes) is tracked in `.claude/tasks/03-restore-mockup-content.task.md` — apply those on top of the mockup baseline. Look at the images directly for exact colors/spacing/type — sample real values from the files rather than guessing hex codes.

**Design language:** dark navy sections (Hero, Dlaczego, CTA+Footer) alternating with warm cream/beige sections (Dla kogo, Usługa 01/02, Opinie, FAQ); amber/gold as the one accent color, used only for CTAs, pill-tags (`NOWA OFERTA`, `DLA KOGO`, `USŁUGA 01`, …), and small label text; bold serif-ish display headlines over clean sans body text; rounded buttons and cards; a "most popular" pricing tier gets a highlighted amber tag.

**Section-by-section, matching the nine sections named elsewhere in this file:**
- **Header/Nav:** "delegate to mate" wordmark (accent color on "to mate"), nav links (Usługi, Jak to działa, Opinie, FAQ), dark "Umów rozmowę" CTA button.
- **Hero:** headline "Prawa Ręka do prowadzenia firmy i do zakupu auta", subhead, two CTAs ("Umów rozmowę" filled amber, "Zobacz cennik" outline), two small service-preview cards, and ~~a client-logo strip ("Zaufali nam": Płatkowski.net, Horizon, Bartom, Art-Bud, Gelato Nobile, Budspaw)~~ — **removed 2026-08-28**, see the dated note below. This was a sub-element of Hero, not one of the nine top-level sections, so its removal doesn't touch the content-parity quality gate.
- **Dla kogo:** heading "Prowadzisz firmę, nie dyspozytornię." plus an audience-framing paragraph.
- **Usługa 01 — Abonament "Prawa Ręka":** a bulleted base scope, an amber-highlighted "Moduł premium" upsell box, and three pricing tiers (Bazowy 2400 zł/20h, Standard 3300 zł/30h — marked "najczęściej wybierany", Rozszerzony 4000 zł/40h) with an overage note ("Bezpiecznik: przekroczenie limitu godzin to dopłata 250 zł/h…").
- **Usługa 02 — Concierge Auto:** two pricing paths (has an offer already: 30% of negotiated savings, with a 1000 zł compensation guarantee if negotiation fails; starting from zero: 2500 zł flat or 1% of config value, min 2000 zł). **Flagged 2026-08-28 — shipped `Services.astro` no longer matches this bullet in two ways, neither confirmed with the user:** the "has an offer already" path's 1000 zł clause is now worded as a client-paid cancellation fee ("...zrezygnujesz z zakupu zapłacisz 1000 zł rekompensaty") rather than a company-paid guarantee if negotiation fails — the opposite direction from what's described here; and the "starting from zero" path's "min 2000 zł" floor is absent from the shipped copy entirely. See the dated note below and `docs/adr/004-shipped-copy-is-canonical.md`.
- **Dlaczego:** heading "Partner biznesowy, który działa dla dobra Twojej firmy, nie pracownik na etacie." plus four value-prop cards (Ekonomika oddelegowania, Brak konfliktu interesu, Przewidywalny koszt, Brak ryzyka finansowego).
- **Opinie:** three testimonial cards (Rafał Płatkowski/Płatkowski.net, Zespół Horizon, Zespół Bartom) — **the mockup itself flags these as incomplete**: `[UZUPEŁNIĆ: pełne cytaty z aktualnej strony, powyższe to fragmenty widoczne dziś na delegatetomate.pl]` ("fill in: full quotes from the current site, the above are just fragments visible today"). Architect must pull the real, full quotes from the live site for these — don't ship the fragment text as final copy.
- **FAQ:** four accordion questions (unused-hours rollover, whose interest is represented when buying a car, overage cost, whether delegating is worth it at all) with one shown expanded as an example.
- **CTA+Footer:** closing heading ~~"Koniec z gaszeniem pożarów."~~ → **"Koniec z ciągłym przeciążeniem."** (changed 2026-08-28, see below), phone CTA "(+48) 796 017 986 · dostępny 24/7" — **the "· dostępny 24/7" and the street address in the CTA panel are both removed as of 2026-08-28** — and a footer with nav links, contact (phone, ~~address "Marii Konopnickiej 22, 43-200 Pszczyna"~~ — **also removed from the footer's KONTAKT column 2026-08-28**, Facebook/Instagram @delegate_to_mate), and a copyright line. The address remains unchanged in the page's `LocalBusiness`/`Organization` JSON-LD (`site/src/pages/index.astro`) — not itself visible page content, out of scope for this content-parity note, flagged as an open question in the dated entry below.

**SUPERSEDED 2026-08-28** (was: "RESOLVED: confirmed with the user — the mockup's copy is placeholder throughout... Architect must derive all nine sections' real copy from the live site"). Reversed after direct, repeated confirmation from the user against the deployed Phase 1 RPi preview: the mockup's own copy is the desired final content, not the WP-extracted copy. The `fix: wire real site copy into all nine sections` commit's content-collection/CMS/a11y/SEO/responsive-CSS engineering stays — it should be re-populated with the mockup's copy rather than thrown away. See `.claude/tasks/03-restore-mockup-content.task.md` for the full scope, including the specific edits layered on top of the mockup baseline.

**RESOLVED 2026-08-28 (later same day) — the source of truth moved again, from the mockup image/snapshot to the live shipped components.** After the mockup-copy restoration above landed in the working tree, the user made and confirmed further direct edits on top of it, then instructed: the page content as it currently stands is the real (desired) content. This means **`site/src/components/sections/*.astro` and their content collections (`src/content/**`) — not `Desired-UI-Look*.jpg`, not `dtm-architecture.html`, and not `docs/reference/mockup-build-snapshot.html`** — are now the authoritative source for the nine sections' copy going forward. `docs/architecture.md`'s "Content restoration" section (Phase 7) is left in place as a historical record of one intermediate state, same treatment as the "Real content mapping" section before it — a future reader should trust the actual component files over either documented spec where they disagree. Full reasoning and the specific diffs: `docs/adr/004-shipped-copy-is-canonical.md`.

Confirmed-final deviations from the mockup baseline as of this resolution (verified against the working tree, not bugs):
- **Hero** — the "Zaufali nam" 6-logo client strip (and its `.hero__brands*`/`.brand-logo*` CSS) is removed entirely. Sub-element of Hero, not a top-level section, so the nine-section content-parity gate is unaffected.
- **CTA** — heading is now "Koniec z ciągłym przeciążeniem." (was "Koniec z gaszeniem pożarów."); subhead now reads "…co można zdjąć z Twojego biurka" (was "…co można oddać…"); the phone/contact block dropped "· dostępny 24/7", the street address, and "— odpowiada Maciej", leaving only the phone number and email.
- **Footer** — the tagline under the wordmark ("Wsparcie operacyjne i concierge zakupowy…") and the street address in the KONTAKT column are both removed; footer contact is now phone + Facebook/Instagram only.
- The `LocalBusiness`/`Organization` JSON-LD address in `site/src/pages/index.astro` was left untouched — still the only place the street address survives on the page. Whether it should also come out, now that the address is gone from visible content, is an **open question for the user**, not decided here.

Additional divergences found by spot-checking the other sections against `docs/architecture.md`'s documented spec — **these are flagged, not confirmed as intentional**, since they were never described to Architect as a deliberate edit the way the three above were:
- `Services.astro`'s Usługa 01 overage note and the matching FAQ answer both say **200 zł/h**, not the 250 zł/h recorded in this file and in `docs/architecture.md` — consistent across two independent files, so plausibly a real (if undocumented) pricing decision rather than a typo.
- `Services.astro`'s Delegate Drive "Masz już ofertę" path is reworded so the 1000 zł clause now reads as a **client-paid** cancellation fee ("...zrezygnujesz z zakupu zapłacisz 1000 zł rekompensaty") rather than a **company-paid** guarantee if negotiation fails — a reversed commercial meaning, not a wording tweak. The matching Benefits card ("Brak ryzyka finansowego") was reworded to match this new framing. The "Zaczynasz od zera" path also dropped the "minimum 2000 zł" floor.
- `Intro.astro`'s paragraph no longer uses the "gasisz pożary" firefighting line at all — it reads differently from both the mockup baseline and any alternative the user was shown mid-session, and (per the orchestrator) no final wording was picked. Left as-is; not evaluated as "final" by this resolution.

None of the above are edited into the doc as settled — see the ADR and the architect's report for exactly what needs a user decision.

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

- ~~Does anyone non-technical need to edit copy/pricing later?~~ — **RESOLVED: yes.** First resolution (2026-08-27): Decap CMS — see `docs/adr/002-headless-cms.md`. **Superseded 2026-08-29** (`docs/adr/005-content-editing-without-cms.md`): Decap's `/admin` was built but never actually reachable (its `github` backend needs Netlify's OAuth proxy by default, and this project deliberately isn't on Netlify) — removed entirely rather than fixed. Replaced with a local AI coding agent (OpenCode/Claude Code) working directly in this repo, guided by the new root-level `Maciek.md`, publishing via the auto-deploy GitHub Actions workflow described above. No OAuth, no new accounts, and — unlike Decap's fixed form fields — covers layout/design changes too, not just copy.
- ~~Contact form destination~~ — **RESOLVED.** Hosted form API (Web3Forms or Formspree), not PHP `mail()` on this host. Decided after a live Phase 4 test (`.claude/tasks/done/ftp-host-validation.task.md`) showed `mail()` working mechanically but landing in spam. Full reasoning: `docs/architecture.md` (Decision 3) and `docs/adr/001-contact-form-destination.md`.
- ~~Is the copy shown in `Desired-UI-Look*.jpg` final content or placeholder?~~ — **RESOLVED 2026-08-28, then superseded later the same day.** First resolution: the mockup's own copy — headline, section names, pricing tiers, FAQ — ships, not the live-WordPress-extracted copy from `docs/architecture.md` §Real content mapping (see `.claude/tasks/03-restore-mockup-content.task.md`). **Superseded 2026-08-28 (later same day):** the source of truth moved again, to the shipped components themselves — see the "Visual & content reference" section above and `docs/adr/004-shipped-copy-is-canonical.md`. A handful of divergences this uncovered (Services.astro pricing/wording, Intro's paragraph) are flagged there as still needing user confirmation, not yet resolved.
- ~~Anything beyond this one page on the roadmap (blog, multi-language, gated content)?~~ — **RESOLVED: no.** Checked directly with the user 2026-08-27 — no concrete near-term plan beyond this single landing page (standalone `/polityka-prywatnosci/` is the only other retained page). Static-first Astro + Decap stands; Next.js trigger remains per `dtm-architecture.html` §04–§05.

## Quality gates

- A page view must not depend on the database or a PHP render step — static files served directly by LiteSpeed.
- Content parity: every one of the nine current sections (Header/Nav, Hero, Dla kogo, Usługa 01, Usługa 02, Dlaczego, Opinie, FAQ, CTA+Footer) is accounted for in the rebuild or explicitly dropped with a stated reason. **This "nine sections" framing predates a tenth, approved 2026-08-28 addition** — a personal "O mnie" (About me) section with a photo, sitting between Dlaczego and Opinie, user-approved and out of scope for the original WP migration. It doesn't replace or narrow this gate; see `docs/architecture.md` ("Tenth section — 'O mnie'") and `.claude/tasks/04-add-o-mnie-section.task.md` for the spec.
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

- Remote: `https://github.com/emicon123/delegate-to-mate` (`main` branch). History was rewritten with `git filter-repo` on 2026-08-29 to strip the old `public_html/` WordPress snapshot (it carried plaintext DB credentials) before this repo was ever pushed — `public_html/` is now git-ignored entirely and no longer kept on disk.
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.).
- `.github/workflows/deploy.yml` auto-builds and FTP-deploys to seohost.pl on every push to `main` (see "Content/design editing without a developer" below) — a denylist check runs first and refuses to deploy if the push touched `.github/` or anything `.env`-named.

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

**Status (2026-08-29): production cutover is complete.** delegatetomate.pl is live on seohost.pl, served entirely from the static build — WordPress core/theme/plugins, `backup.php`/`db_dump.php`/`zip.php`, and `_test-static/` are all deleted from the live server (verified 404). The Phase 1 RPi/Tailscale setup below is **decommissioned** — its container, image, and the `location /delegate/` block in investing-app's `nginx.conf` have been removed; it was scaffolding for pre-cutover testing, not a permanent target. Both phase descriptions are kept below as historical record of how the migration was actually done.

**Ongoing deploys now go through GitHub Actions, not manual FTP** — see "Content/design editing without a developer" above and `.github/workflows/deploy.yml`: push to `main` → auto build → auto FTP to `public_html`, gated by a denylist check on `.github/`/`.env*`. Manual FTP (per Phase 2 below) is still the right tool for larger structural changes outside that workflow's scope (dependency/build-config changes, anything the denylist would correctly refuse to auto-deploy) — use `.env`'s credentials directly, following Phase 2's steps.

**Phase 1 — RPi (historical, testing only — decommissioned):**
1. Build locally in the site source dir → static output, built with the `/delegate` base path.
2. Ship the build into a container (following the `frontend-leszek`/`frontend-magda` pattern in investing-app's `infra/compose.yml`) joined to the external `investing-shared` network.
3. Add/confirm the `location /delegate/` proxy block in investing-app's shared `nginx.conf` — a change in that repo, not this one.
4. Verify at `<tailscale-hostname>/delegate`.

**Phase 2 — seohost.pl (target, once the rebuild is done):**

FTP is the only confirmed deploy path — no CI/CD, no git-based deploy on this host.
1. Build locally in the site source dir (e.g. `npm run build`) → static output, built with the root base path (no `/delegate` prefix).
2. Push the build output to `public_html` over FTP/rsync, replacing the WordPress files it supersedes.
3. Verify `.htaccess` still matches what the static build needs — WordPress's rewrite rules won't apply once WP is gone.
