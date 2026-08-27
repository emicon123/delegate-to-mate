# Architecture — delegatetomate.pl rebuild

> **Status of this document (2026-08-27, Task 01 complete):** The Phase 0–5 deploy-validation spike (`.claude/tasks/done/ftp-host-validation.task.md`) passed its go/no-go review; the real content-mapping pass (Task 01, `.claude/tasks/01-content-mapping.task.md`) has also completed — live rendered HTML extracted from `https://www.delegatetomate.pl/` + `/uslugi/` (see §Real content mapping below), nine-section → component map written, CMS decision recorded (ADR-002: Decap CMS), and the final roadmap open question checked directly with the user ("No, single page only" 2026-08-27). No open questions gate the nine-section build any longer. `site/` is still the walk-skeleton source directory, now unblocked for the real Frontend build (Task `02-nine-section-build.task.md`).

---

## Validation spike — phase results (Phases 1–4)

Summary of the live findings from `.claude/tasks/done/ftp-host-validation.task.md`. Full detail and mitigations live in `.claude/agents/deploy.md`; this is the architecture-relevant digest.

| Phase | What it tested | Result |
|---|---|---|
| 1 — Local walking skeleton | Astro build, root base path and `/_test-static/` subpath base, both `npm run build` variants | **PASS** — both configs build clean, hashed filenames present, zero console errors locally. Confirms Astro (see Decision 1 below) and seeds the real `site/` source directory. |
| 2 — Live LiteSpeed static-serving | FTP upload of the subpath build to `public_html/_test-static/` on the real seohost.pl server, alongside the untouched live WP install | **PASS** — served correctly with **no `.htaccess` change needed**; WP's existing rewrite conditions pass real static files through untouched. Live WP homepage confirmed unaffected before/after. Also surfaced: a per-IP rate-limiter/WAF in front of LiteSpeed (rapid sequential HTTPS requests trip a `429`, clearing on its own within ~20–300s; HTTP(S) only, not triggered by FTP). Documented in `.claude/agents/deploy.md`. |
| 3 — FTP bulk-upload stress test | 255 synthetic files (varied sizes, nested folders, roughly Astro-build-shaped) mirrored via `lftp mirror` into `public_html/_test-static/bulk/` | **PASS** cleanly — no drops/timeouts, exact file-count/checksum match, ~33s, no parallelism/retry mitigation needed. Also surfaced: this host's FTPS needs `set ssl:verify-certificate no` to connect at all (self-signed cert) — without it every `lftp` operation fails at connect time. Both gotchas documented in `.claude/agents/deploy.md`. |
| 4 — PHP `mail()` live contact-form test | Minimal PHP probe wired to the Phase 1 form UI, real test message sent from the live server | **FAIL — for `mail()` as the contact-form destination, specifically.** `mail()` returned `true`, server-side validation and header-injection defenses held (raw `curl -X POST` bypassing client JS was rejected), no PHP errors leaked, PHP version matched. But the delivered email landed in **spam/junk**, not the inbox — an explicit fail against the phase's stated pass criteria (inbox delivery, not just a successful send). This is a deliverability finding about shared-hosting mail reputation, not a defect in the form mechanism itself. |

Phases 2 and 3 leave no open action beyond what's already documented in `.claude/agents/deploy.md` (the WAF pacing note and the FTPS cert flag). Phase 4's result is resolved by Decision 3 below.

---

## Decision 1 — Build tool: Astro (confirmed)

**Call:** Use **Astro** for the site, in `site/` — this directory is not a throwaway; Phase 1's walking skeleton seeds the real site source.

**Rationale:** `dtm-architecture.html` §04–§05 already leaned this way ("React (via Astro, or plain Vite)"). The site is a single mostly-static marketing page — nine scroll sections of prose/imagery plus one interactive island (the contact form). Astro's default output is zero-JS static HTML per page, with React hydrated only where a component is explicitly marked as an island — that maps directly onto "static everywhere, interactive only at the form." Astro also has first-class, low-config support for exactly what this spike needed to prove: a configurable `base` path (root vs. `/_test-static/`, and separately the Phase 1 RPi `/delegate` prefix per `CLAUDE.md`'s deployment phases) and a plain static `dist/` output that's just files for FTP to push, with no server runtime assumptions.

**Status:** Confirmed, not just provisional. Phase 1 built successfully on Astro with no issues surfacing that would reverse the choice, and Phase 2's live LiteSpeed test served that Astro output with zero `.htaccess` changes — the strongest possible evidence the shape of Astro's build output is compatible with this host as-is.

---

## Decision 2 — Phase 4 contact-form test order: PHP `mail()` first (historical, now closed out by Decision 3)

**Call:** Phase 4 of the spike tested **PHP `mail()` on this host first**, before a hosted form API.

**Rationale:** This was a decision about test *order* for the spike, not the final production destination. PHP `mail()` on shared hosting was the **higher-uncertainty** path — deliverability depends on the host's outbound mail reputation, SPF/DKIM/reverse-DNS configuration, and shared-IP spam-filter history outside this project's control — none of which could be verified without a real send from the real server to a real inbox. A hosted form API is a well-understood, widely-used third-party service that didn't need the same live proof. Testing the higher-uncertainty, harder-to-fix-late option first, while there was still time to change course, was the correct order regardless of which one ended up chosen for production.

**Status:** Closed. Phase 4 ran, `mail()` failed the inbox-delivery pass criterion (landed in spam), and the production destination is now decided — see Decision 3.

---

## Decision 3 — Contact form destination: hosted form API (Web3Forms or Formspree) — DECIDED

**Call:** The production contact form routes through a **hosted form-submission API** (Web3Forms or Formspree), not PHP `mail()`/SMTP on this host. This is no longer an open question in `CLAUDE.md` — it's decided. Full reasoning, trade-offs, and consequences: **ADR-001**, `docs/adr/001-contact-form-destination.md`.

**Rationale (short version):** Phase 4's live test proved the form mechanism sound end-to-end (validation, header-injection defenses, correct headers) but the test email landed in spam, not the inbox — a shared-hosting mail-reputation problem that isn't fully controllable from this codebase, since the IP/mail infrastructure is shared with other tenants on the same seohost.pl account. A hosted form API sidesteps that reputation problem entirely, adds no PHP code to maintain or secure, fits the free-tier-only constraint at this project's traffic level, and keeps the build static-first — one less piece of server-side logic in the request path.

**Which vendor:** Web3Forms vs. Formspree is an **implementation detail for Frontend to pick between** when building the real contact form — both are free-tier-suitable and roughly equivalent for this use case. No further live validation is required; this document doesn't need updating with the specific pick unless it surfaces a real trade-off.

---

## Real content mapping (Phase 6 — Task 01, 2026-08-27)

> **Source:** live rendered HTML fetched from `https://www.delegatetomate.pl/` (and `https://www.delegatetomate.pl/uslugi/` via `https://www.delegatetomate.pl/wp-json/wp/v2/pages/23` — raw Elementor JSON in the response). DB hostname is `localhost` in `.env`, so the raw `wp_postmeta` Elementor blob is not reachable from outside the host; the rendered pages are the primary source per `CLAUDE.md`. All Polish copy below is verbatim from that HTML — no re-translation, no cleanup. The WAF/rate-limiter documented in Phases 2–3 (`429` after rapid HTTPS requests, `Retry-After: 300`) throttled follow-up fetches of `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/` on 2026-08-27; the sitemap confirms those pages exist but the single-page rebuild's nine sections live entirely on `/` and `/uslugi/` (the latter's five service boxes are the canonical service copy). The mapping therefore merges `/uslugi/`'s service tiles into the single-page services section.

### Live site as extracted (2026-08-27)

Site is currently **multi-page** (sitemap: `Start` id 19 `/`, `Usługi` id 23 `/uslugi/`, `O nas` id 21 `/o-nas/`, `Kontakt` id 27 `/kontakt/`, `Polityka prywatności` id 3 `/polityka-prywatnosci/`) — not a single-page scroll as `dtm-architecture.html` §02 / `CLAUDE.md`'s "nine sections" list describes. The rebuild consolidates these into one scroll page per the `Desired-UI-Look*.jpg` layout (visual reference only — its pricing/FAQ/footer copy is placeholder, confirmed with the user).

**Homepage `/` (1070 lines, ~297 KB, `public_html` snapshot + live fetch)**

- **Header/Nav** — logo wordmark + nav links: `Start` → `/`, `Usługi` → `/uslugi/`, `O nas` → `/o-nas/`, `Kontakt` → `/kontakt/` (JS `jet-nav-menu`, mobile hamburger). No anchor-nav to sections as the mockup shows (`Usługi`, `Jak to działa`, `Opinie`, `FAQ`, CTA `Umów rozmowę`).
- **Hero** — `H1: INNOWACYJNE` + `H2: ROZWIĄZANIA DLA TWOJEGO BIZNESU` + `H4: Twoje wsparcie i efektywne zarządzanie zasobami` + CTA `NASZA FIRMA` (×2, local link). Not the mockup's `Prawa Ręka do prowadzenia firmy i do zakupu auta` / `Umów rozmowę` + `Zobacz cennik`.
- **Intro / Dla kogo** — `H2: DELEGATE TO MATE` + `P: DELEGATE TO MATE to wszechstronne wsparcie dla firm, które odciąża przedsiębiorców w kluczowych obszarach. Działamy elastycznie, dostarczając konkretne rozwiązania dla Twojego biznesu w kluczowych obszarach:` + 5 portfolio tiles (all linking to `/uslugi/`): `WSPARCIE OPERACYJNE`, `KOORDYNACJA ZADAŃ ZESPOŁU`, `REKRUTACJA PRACOWNIKÓW`, `POŚREDNICTWO ZAKUPOWE`, `POZYSKIWANIE KLIENTÓW` + CTA `POZNAJ USŁUGI`. Counters section (visually present, JS-animated, defaulting to `0` in raw HTML): `głównych obszarów działania 0`, `zleceń zakończonych sukcesem + 0`, `zaoszczędzonych godzin klientów + 0`, `procent zaangażowania w Twój biznes 0`.
- **Why-contact interstitial** — `H2: Wybierając współpracę z DELEGATE TO MATE, wybierasz skuteczność, oszczędność i rozwój.` + `P: DELEGATE TO MATE może być Twoim strategicznym partnerem, który dba o to, by Twoje cele biznesowe zostały osiągnięte szybciej i efektywniej.` + CTA `SKONTAKTUJ SIĘ`.
- **Dlaczego → Korzyści** — `H2: Korzyści współpracy z DELEGATE TO MATE` + 8 animated-box cards (each duplicated front/back for hover, `jet-animated-box`):
  1. `Redukcja kosztów` — `Dzięki moim umiejętnościom negocjacyjnym i analizie rynku pomagasz swojej firmie oszczędzać pieniądze, wybierając najlepsze oferty i optymalizując wydatki.`
  2. `Oszczędność czasu i zasobów` — `Przejmuję na siebie czasochłonne zadania, takie jak rekrutacja, pozyskiwanie klientów, negocjacje zakupowe czy koordynacja projektów, co pozwala Ci skupić się na kluczowych aspektach działalności.`
  3. `Profesjonalizm i doświadczenie` — `Moja wiedza, umiejętności i narzędzia gwarantują skuteczność we wszystkich obszarach działalności, od zarządzania zespołem po wsparcie finansowe. Współpracując ze mną, zyskujesz dostęp do sprawdzonych strategii i narzędzi.` (also truncated variant `...od zarządzania zespołem po wsparcie finansowe. Współpracując ze mną, zyskujesz dostęp do sprawdzonych` in the collapsed front).
  4. `Indywidualne podejście` — `Każdy klient jest inny, dlatego dostosowuję moje usługi do Twoich unikalnych potrzeb i celów biznesowych. Oferuję elastyczne rozwiązania, które idealnie wpasują się w Twoje wymagania.`
  5. `Transparentność i zaufanie` — `Moim fundamentem jest uczciwość i otwarta komunikacja. Działam w Twoim interesie, dostarczając realnych wyników i jasno raportując efekty pracy.`
  6. `Wsparcie finansowe i doradztwo` — `Współpracując z renomowanymi partnerami, oferuję kompleksowe rozwiązania finansowe, które pomogą zabezpieczyć przyszłość Twoją i Twoich bliskich.`
  7. `Budowanie przewagi konkurencyjnej` — `Wsparcie w pozyskiwaniu nowych klientów oraz skuteczne zarządzanie projektami przyspieszy rozwój Twojego biznesu, zapewniając przewagę na rynku.`
  8. `Kompleksowe wsparcie w jednym miejscu` — `Oferuję szeroki wachlarz usług – od zarządzania zasobami ludzkimi, przez rozwój sprzedaży, aż po doradztwo finansowe – co pozwala uniknąć potrzeby współpracy z wieloma podwykonawcami.`
- **Opinie** — 6 `jet-testimonials` cards, each `H5` company + quote + author (when present):
  - `Platkowski.net` — `Jestem właścicielem małej firmy. Potrzebowałem zebrać pewne dane do analizy. DELEGATE TO MATE mi w tym pomógł! Polecam.` — `Rafał Płatkowski`
  - `Horizon` — `Maciej jest wyjątkowo zaangażowany w sprawy swoich klientów i kontrahentów. Wykazuje się zrozumieniem potrzeb klienta i dążeniem do ich spełnienia. Jest konkretny, szybki w działaniu i komunikatywny. Szuka rozwiązań póki ich nie znajdzie. Polecam współpracę z Maciejem` — `Horizon`
  - `Bartom` — `Nawiązanie współpracy z DELEGATE TO MATE pozwoliło zaoszczędzić czas i pieniądze. Gwarancja biznesowego wsparcia na najwyższym poziomie. Indywidualne podejście do klienta i oferowanie rozwiązań przynoszą korzyści.` — `Bartom`
  - `Art-Bud` — `DELEGATE TO MATE to najlepszy wybór współpracy z zakresu doradztwa biznesowego. Narzędzia i rozwiązania, które są proponowane do wdrożenia w firmie, pozwalają zaoszczędzić czas i pieniądze.` — `Art-Bud`
  - `Gelato Nobile` — `Dzięki tej współpracy udało się pozyskać wielu nowych klientów, którzy regularnie zamawiają nasze produkty. Takie rozwiązanie okazało się bardzo korzystne, z pewnością godne polecenia.` — `Gelato Nobile`
  - `Budspaw` — `Profesjonalne podejście, świetna organizacja i umiejętność dopasowania rozwiązań do naszych potrzeb. Polecam każdemu, kto szuka skutecznego partnera w biznesie!` — `Budspaw`
  Logos strip (`Zaufali nam` heading on `/uslugi/`) repeats these 6 brands: `platkowski.net`, `RRT_screenshot_0236`, `RRT_screenshot_0268`, `RRT_screenshot_0235`, `Logo Horizon`, `Budspaw2` (images under `wp-content/uploads/2025/02/` + `platkowski.net_.png`).
- **CTA+Footer** — `H2: W skrócie` + `P: Delegate To Mate to firma oferująca wsparcie biznesowe dla przedsiębiorców, którzy chcą odzyskać czas i skupić się na rozwoju swojej firmy. Pomagam właścicielom jednoosobowych działalności i małych zespołów w delegowaniu zadań operacyjnych, sprzedażowych oraz projektowych, które na co dzień pochłaniają ich energię i uwagę.` + `H2: Strony` → `Polityka prywatności` + `H2: Kontakt` → `Tel: (+48) 796 017 986`, `24/7 dostępny dla Ciebie`, `Marii Konopnickiej 22, 43-200 Pszczyna` (`jet-services` widget), copyright `© Zemez . All Rights Reserved.` + `Facebook-f` / `Instagram` (`@delegate_to_mate` per mockup, not in raw footer text but in asset alt).

**`/uslugi/` (690 lines, `elementor-23`, via `/wp-json/wp/v2/pages/23` `content.rendered`)**

- `H1: USŁUGI` + `P: Z dumą prezentuję Państwu moje projekty, które stworzyłem wykorzystując wszystkie moje umiejętności i profesjonalizm.`
- Same 5 animated-box services as homepage portfolio, now with full back-side descriptions (the canonical service copy for the rebuild):
  - `wsparcie operacyjne` — front short + back: `Sprawny biznes zaczyna się od dobrze zorganizowanych działań. W ramach Delegate To Mate przejmuję zadania operacyjne, które na co dzień pochłaniają czas przedsiębiorców i odciągają ich od rozwoju firmy. Pomagam uporządkować procesy, koordynuję bieżące działania i dopilnowuję, aby zadania były realizowane terminowo i zgodnie z planem.`
  - `Koordynacja Zadań Zespołu` — back: `Efektywne zarządzanie projektami to klucz do sukcesu każdej organizacji. Oferuję kompleksową koordynację zadań zespołu, obejmującą monitorowanie postępów i egzekwowanie działań. Dzięki moim narzędziom i umiejętnościom, zapewniamy, że każdy projekt zostanie zrealizowany zgodnie z ustalonym harmonogramem i budżetem.`
  - `Rekrutacja Pracowników` — back: `W świecie biznesu kluczowym elementem sukcesu jest zespół składający się z wysoko wykwalifikowanych pracowników. Moje usługi rekrutacyjne są skoncentrowane na zrozumieniu Twoich unikalnych potrzeb oraz kultury organizacyjnej, co pozwala pozyskać idealnych kandydatów. Zapewniam elastyczne podejście - nie musisz zatrudniać pracowników odpowiedzianych za HR. Powierz mi poszukiwania, a dostarczę Ci najlepsze osoby do Twojego zespołu.`
  - `Pośrednictwo Zakupowe` — back: `Twój czas i pieniądze są dla mnie priorytetem. Moje usługi pośrednictwa zakupowego polegają na wyszukiwaniu najlepszych ofert na rynku oraz negocjowaniu korzystnych warunków. Niezależnie od tego, czy potrzebujesz asortymentu, specjalistycznej maszyny, czy nowego pojazdu firmowego, załatwię wszystko za Ciebie, abyś mógł skoncentrować się na kluczowych aspektach swojej działalności.`
  - `Pozyskiwanie Klientów` — back: `Skuteczna sprzedaż zaczyna się od właściwych relacji. Jako doświadczony sprzedawca w marce premium, oferuję kompleksowe wsparcie w budowaniu relacji z klientami oraz rozwijaniu sprzedaży. Skontaktuję się z potencjalnymi kontrahentami, zaprezentuję Twoją ofertę i doprowadzę do finalizacji transakcji, abyś mógł skupić się na rozwijaniu swojego biznesu.`
- `H2: Zaufali nam` + same 6-brand strip.
- Footer identical to homepage.

**Not found on either page**

- No pricing tiers, amounts (`zł`), package names (`Bazowy`/`Standard`/`Rozszerzony`), overage notes, or `Concierge Auto` paths from `Desired-UI-Look*.jpg`'s Usługa 01/02. The only `zł` hit in the HTML is an SVG path fragment, not copy. Pricing is **absent** in live content — mockup pricing is placeholder.
- No FAQ section, accordion, `jet-tabs`, or `?`-terminated questions in content DOM (only `jet-tabs` CSS/JS includes present). `FAQ — 4 questions` from the mockup has no counterpart in the rendered homepage or `/uslugi/`.
- No `Prawa Ręka` / `Concierge Auto` phrasing; no `Dla kogo: Prowadzisz firmę, nie dyspozytornię.`; no `Dlaczego: Partner biznesowy…`; no `Koniec z gaszeniem pożarów.` — all mockup headlines absent.

### Doc/reality mismatches flagged (do not silently pick a side)

1. **Single-page vs. multi-page:** `dtm-architecture.html` §02 says one landing page / nine scroll sections. Live `sitemap.xml` + nav expose 4 publishable pages + `Start` (`/`, `/uslugi/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/`). The rebuild follows the mockup's single-page scroll structure; `/uslugi/`'s five service boxes are merged into that one page's services section, and `/o-nas/`/`/kontakt/` are folded into nav anchors + footer/contact. Separate `/polityka-prywatnosci/` remains a standalone page (legal requirement — not a marketing section).
2. **Service count & pricing:** Mockup's 2 services with 3 pricing tiers + guarantees vs. live 5 services with prose descriptions and **no pricing at all**. Frontend must not invent pricing — if tiers return, they become CMS-managed; initial ship has no price figures, with CMS placeholders ready.
3. **FAQ:** Mockup FAQ (4 Q&A, one expanded) has zero counterpart in live DOM. Create `src/content/faq/` as CMS-managed but ship empty/hidden until real Q&A are authored — do not ship mockup Q&A as final copy.
4. **Benefits/Dlaczego:** 8 live cards vs. mockup's 4. Rebuild keeps the live 8, styled in the mockup's 4-card grid language.
5. **Testimonials:** 6 live vs. mockup's 3. Keep all 6; mockup's fragment disclaimer (`[UZUPEŁNIĆ: pełne cytaty…]`) is now resolved — the 6 above are the full quotes.
6. **Hero & Nav labels:** As enumerated above — layout from mockup, copy from live.

### Content → component mapping (live copy, mockup layout)

One Astro component per section, in scroll order, with the alternating dark-navy / cream-beige language from `CLAUDE.md`:

| # | Target component | Layout source (mockup) | Content source (live) | CMS-managed? | Notes |
|---|---|---|---|---|---|
| 1 | `src/components/sections/Header.astro` | Header/Nav pill + `Umów rozmowę` CTA | Nav links `Start`/`Usługi`/`O nas`/`Kontakt` → rebuilt as anchor nav (`#uslugi` `#korzysci` `#opinie` `#kontakt`) + `(+48) 796 017 986` tel CTA | `site.json` (phone, nav label overrides) | Wordmark `delegate to mate` stays in code; links become CMS-overridable strings. |
| 2 | `src/components/sections/Hero.astro` | Hero: headline + subhead + two CTAs + two preview cards + logo strip | `H1 INNOWACYJNE` / `H2 ROZWIĄZANIA…` / `H4 Twoje wsparcie…` + `NASZA FIRMA` CTA; logo strip from `Zaufali nam` (6 logos) | `hero.json` / `brands/*` | Two preview cards show the first two services; second CTA `Zobacz cennik` has no live cennik — point to `#uslugi` or hide until pricing exists. |
| 3 | `src/components/sections/Intro.astro` (Dla kogo) | `Dla kogo — Prowadzisz firmę…` paragraph | `H2 DELEGATE TO MATE` + intro `P: DELEGATE TO MATE to wszechstronne…` + 5 tiles as audience/service framing | `intro.md` | Intro keeps live 5-tile set; each tile links to `#uslugi`. |
| 4 | `src/components/sections/Services.astro` (Usługa) | Usługa 01 + 02 with pricing tables | 5 services from `/uslugi/` (full back-side copy above) consolidated into one section; **no pricing table in v1** — prose + icon + feature list per service; CMS-ready price fields hidden until authored | `src/content/services/*.md` (title, icon, `description`, `details`, optional `price`/`priceNote`) | The `jet-animated-box` hover (front/back) maps to a static card — no JS hover dependency. `Counters` (`0` placeholders) are flagged as unused Elementor widgets with no static equivalent — drop unless real figures are supplied; keep layout slot but hide if `count` CMS value is `0`/empty. |
| 5 | `src/components/sections/Benefits.astro` (Dlaczego) | Dlaczego: 4 value-prop cards | 8 live `Korzyści` cards (titles + descriptions above) | `src/content/benefits/*.md` | Render as 2×4 or 4×2 grid in the mockup's card language. |
| 6 | `src/components/sections/Testimonials.astro` (Opinie) | Opinie: 3 cards | 6 live testimonials (quotes/authors above) | `src/content/testimonials/*.md` | Keep all 6; photos/logos from `wp-content/uploads` carried over as optimized `src/assets/` via Astro image pipeline. |
| 7 | `src/components/sections/FAQ.astro` | FAQ: 4 accordion Q&A | **None in live content** — component ships but renders nothing (or a `Brak pytań — zarządzaj w CMS` admin hint) until `src/content/faq/*.md` is populated | `src/content/faq/*.md` | Accordion is expand/collapse without Elementor JS — native `<details>`/`summary` + minimal JS, keyboard-accessible. Do not ship mockup placeholder Q&A. |
| 8 | `src/components/sections/CTA.astro` | CTA+Footer: `Koniec z gaszeniem pożarów.` + phone | Interstitial `Wybierając współpracę…` + `SKONTAKTUJ SIĘ` CTA; phone `(+48) 796 017 986 · dostępny 24/7` | `cta.json` (headline, subhead, phone) | Maps mockup's dark closing band + amber CTA. |
| 9 | `src/components/sections/Footer.astro` | Footer: nav, address, socials, copyright | `W skrócie` paragraph + `Strony` → `Polityka prywatności` + `Kontakt` block + `© Zemez` + `Facebook-f`/`Instagram` | `site.json` + `footer.md` | Address `Marii Konopnickiej 22, 43-200 Pszczyna` is the only street address in live content — keep verbatim. Footer legal link to `/polityka-prywatnosci/` is a real page; it stays as a standalone route (`src/pages/polityka-prywatnosci.astro` rendered from `src/content/legal/policy.md`). |
| — | `src/components/ContactForm.tsx` (island) | Contact form (CTA+Footer) | Contact details `Tel: (+48) 796 017 986` etc. | endpoint/key in `.env` (`PUBLIC_FORM_ENDPOINT` etc. per `docs/adr/001`) | Already scaffolded in `site/`; hydrated as `client:load` island per Decision 1. Destination is ADR-001 hosted API — no PHP in request path. |

**No Elementor widget needs a non-static equivalent beyond:** `jet-counter` (dropped unless CMS supplies real numbers), `jet-animated-box` (hover flip → static card), `jet-tabs`/`accordion` (not present in live content — if FAQ returns, use `<details>`). All other widgets (`heading`, `text-editor`, `jet-button`, `jet-portfolio`, `jet-testimonials`, `jet-brands`, `jet-services` address block) map to plain HTML/CSS.

---

## Decision 4 — Headless CMS: Decap CMS (git-based) — DECIDED

**Call:** Use **Decap CMS** for non-technical copy/pricing edits, over hosted API CMSes. Full reasoning, alternatives, and consequences: **ADR-002**, `docs/adr/002-headless-cms.md`.

**Rationale (short version):** At `tiny traffic` + `cost-free only` + `FTP-only deploy` + `static-first/Astro` + `no persistent Node/backend process`, a git-based CMS is the only option that adds zero runtime or vendor dependency. Content edits become git commits via a static `/admin` SPA, "publish" is still just `npm run build` + FTP `dist/` — the same deploy already proven. Hosted APIs (Contentful, Sanity) add external build-time dependencies and free-tier vendor risk for no compensating benefit at a single-page scale. Decap maps directly onto Astro content collections (`src/content/*.md` + Zod schema, `getCollection()` at build, no runtime fetch).

**What Frontend builds:** `site/public/admin/index.html` + `site/public/admin/config.yml` (Decap config), `site/src/content/config.ts` (Astro collection schemas for `services`, `benefits`, `testimonials`, `faq`, `brands`, `site/hero/cta` JSON), content files under `site/src/content/**`, and a `public/admin/` bundle that ships in `dist/admin/`. See the component table above for which files are CMS-managed vs. in-code.

---

## Roadmap beyond this one page — CHECKED, no change to stack

`CLAUDE.md`'s last open question ("anything beyond this one page on the roadmap — blog, multi-language, gated content?") **checked directly with the user on 2026-08-27: answer was "No, single page only"** — no concrete near-term plan beyond this landing page (and its standalone `/polityka-prywatnosci/` legal page). The static-first Astro + Decap + FTP stack stands as decided. If a future feature genuinely needs per-request logic (auth, live pricing, booking calendar), that is the already-documented trigger to revisit Next.js on Passenger (`dtm-architecture.html` §04–§05 / Decision 1) — not a change for this build.

---

## Not decided here — none remaining

All `CLAUDE.md` open questions that gate the nine-section build are now resolved: copy source (live site, not mockup), CMS (Decap, ADR-002), contact-form destination (hosted API, ADR-001), roadmap (single page only, checked 2026-08-27). The build is unblocked.
