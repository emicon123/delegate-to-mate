# ADR-002: Headless CMS — Decap CMS (git-based) over hosted API CMS

**Date:** 2026-08-27
**Status:** Accepted

**Context:**

`CLAUDE.md` resolved that a CMS is needed (non-technical copy/pricing edits must be possible without code changes) but left the specific CMS choice open. The evaluation is constrained by this project's hard constraints:

- **Cost-free only** — zero recurring spend.
- **Static-first / Astro** — page views ship pre-built HTML/CSS/JS from `public_html` over FTP, no DB or PHP in the request path.
- **FTP-only deploy** — cPanel SSH / Node.js Passenger exist but are not the confirmed deploy path; publishing must remain "rebuild + FTP the output".
- **No persistent backend process** — no Node/Python daemon to keep alive on shared hosting unless strictly necessary.
- **Tiny traffic** — a handful of real visits/day.

The mockup (`Desired-UI-Look*.jpg`) is placeholder copy; all real copy comes from the live site (see `docs/architecture.md` §Real content mapping). The CMS therefore manages volatile prose: pricing (when/if it exists), FAQ, testimonials, service descriptions, contact details — not layout or component structure.

Candidates evaluated:

| Candidate | Model | Cost at this traffic | Runtime on host | Publish flow | Fit |
|---|---|---|---|---|---|
| **Decap CMS** (ex-Netlify CMS) | Git-based: admin UI is a static SPA (`/admin`) that commits Markdown/YAML/JSON to the repo via GitHub OAuth + `decap-cms` proxy or Git Gateway; no server of its own | Free, open-source | None — `/admin` is static files served by LiteSpeed | Content edit → git commit → `npm run build` → FTP `dist/` to `public_html` | Exact fit for static-first + FTP + zero-cost. Versioned content in repo. Works with Astro content collections reading `src/content/*.md`. |
| **Contentful (free tier)** | Hosted API: content fetched at build via `contentful` SDK, or at runtime | Free tier 2 locales / 25k records, but quota + vendor lock-in | None at runtime if fetched at build | Edit in Contentful UI → `npm run build` (pulls API) → FTP | Viable, but introduces external API dependency, build-time network requirement, content not versioned in repo, free-tier terms can change. No advantage over Decap at this scale. |
| **Sanity (free tier)** | Hosted API + Studio (React app you host or run at sanity.io) | Free tier generous, paywall at higher usage | Studio can be self-hosted but still needs Sanity cloud | Similar to Contentful — API fetch at build | Same trade-offs as Contentful plus heavier Studio tooling. Over-provisioned for a single marketing page. |
| **TinaCMS** | Git-based but requires a Node backend (`tinacms dev`) for local editing and optionally a hosted Tina Cloud for prod editing | Free self-hosted, cloud paid beyond trial | Needs Node process for visual editing | Commit → build → FTP | Closer than hosted APIs, but heavier than Decap (React admin tightly coupled, Node required). |
| **Strapi / Directus (self-hosted)** | Self-hosted Node/PHP CMS with DB | Free self-hosted, but requires DB + persistent Node/PHP process | Requires Passenger Node or PHP + MariaDB hit | Edit → API → build | Re-introduces the very runtime (DB + server process) the static-first decision removed. Ruled out by constraints. |

**Decision:**

Use **Decap CMS** as the headless CMS. Content lives as Markdown/YAML/JSON files under `site/src/content/` (or `site/content/`), consumed at build via **Astro content collections** (`src/content/config.ts`). The Decap admin is served as a static route at `site/public/admin/index.html` + `site/public/admin/config.yml`, built into `dist/admin/` by Astro's static output.

**Consequences:**

- Content edits are versioned git commits. "Publish" = merge commit + `npm run build` + FTP — no new deploy pipeline, no external service to stay up.
- No secrets or runtime credentials on the host. GitHub OAuth for Decap is gated at the git provider, not on seohost.pl.
- Free and self-contained; no free-tier caps to outgrow at this traffic level.
- Adds a small static admin bundle to `dist/` (~tens of KB) and a `config.yml` that must be kept in sync with the content collection schema — Frontend owns that wiring.
- What is CMS-managed vs. in-code (see `docs/architecture.md` for the full list):
  - **CMS-managed:** testimonials (`src/content/testimonials/*.md`), benefits/why-us cards (`src/content/benefits/*.md`), service tiles + descriptions (`src/content/services/*.md`), FAQ items (`src/content/faq/*.md` — currently empty in live content, seeded as placeholder), contact details + footer (`src/content/site.json`: phone, address, socials), brand strip logos, counters (if kept).
  - **In-code (layout, not prose):** Header/Nav structure, Hero layout, section ordering/alternating dark/cream backgrounds, CTA button styling, Astro components, SEO/meta, Decap config itself. Copy unlikely to change frequently stays in `.astro` files as fallback/default.
- Frontend builds: Decap admin route + config, Astro content collection schema (Zod), and fallback rendering when CMS files are absent. No runtime fetch — `Astro.glob` / `getCollection()` at build time only.
- If Decap's GitHub OAuth flow becomes unwieldy (e.g. no GitHub org), fallback is file-edits-via-PR — same files, same build, no architecture change.
- Hosted APIs (Contentful/Sanity) are not disqualified in general — they remain the correct call if the site later grows to shared multi-channel content or needs non-git editors at scale — they are out *for this project today* because they add an external dependency and build-time network requirement for no compensating benefit at a single-page, tiny-traffic scale.
