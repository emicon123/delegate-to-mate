# Architecture — delegatetomate.pl rebuild

> **Status of this document (2026-08-27, Task 01 complete):** The Phase 0–5 deploy-validation spike (`.claude/tasks/done/ftp-host-validation.task.md`) passed its go/no-go review; the real content-mapping pass (Task 01, `.claude/tasks/01-content-mapping.task.md`) has also completed — live rendered HTML extracted from `https://www.delegatetomate.pl/` + `/uslugi/` (see §Real content mapping below), nine-section → component map written, CMS decision recorded (ADR-002: Decap CMS), and the final roadmap open question checked directly with the user ("No, single page only" 2026-08-27). No open questions gate the nine-section build any longer. `site/` is still the walk-skeleton source directory, now unblocked for the real Frontend build (Task `02-nine-section-build.task.md`).
>
> **Superseded again, 2026-08-28 (later the same day as Phase 7 below):** neither the "Real content mapping" section nor the "Content restoration" section below is current any longer. Per `docs/adr/004-shipped-copy-is-canonical.md`, the authoritative copy source is now **the shipped components themselves** (`site/src/components/sections/*.astro`, `site/src/content/**`), not any document. Both sections are kept as historical record of how the copy got to its current state; where either disagrees with the actual tree, the tree wins. See "Phase 8 — shipped copy is canonical" near the end of this document for what changed and what's still flagged/unconfirmed.

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

## Content restoration — mockup copy is the final content (Phase 7 — Task 03, 2026-08-28)

> **Reverses the "Real content mapping" section above, on direct, repeated user instruction after seeing the result on the Phase 1 RPi preview.** The 2026-08-27 remediation (`fcd4079`) was correct given what was known at the time — but the user has now confirmed the mockup's own copy (headline, "Prawa Ręka"/"Concierge Auto" naming, pricing tiers, FAQ) is the desired final content, not a placeholder. This section is the new authoritative copy spec. It does not reopen the CMS, contact-form, or roadmap decisions (Decisions 1–4 above stand); it only changes which text ships in the nine sections.

### Source authority, in order

1. **`docs/reference/mockup-build-snapshot.html`** — a full HTML snapshot of the exact build the user confirmed on the RPi preview, saved before that container image was overwritten by a `--no-cache` rebuild and became unrecoverable via `docker images`. This is **byte-exact rendered markup**, not a re-transcription — treat every string below as pulled directly from it. **Primary source for all nine sections' copy.**
2. **Live WP site** (`https://www.delegatetomate.pl/`, already extracted 2026-08-27, see "Real content mapping" above) — **testimonials only**. The mockup's own build flags its testimonial cards as fragments (`[Na życzenie: pełne cytaty z aktualnej strony…]`); the real full quotes were already pulled from the live site and are already committed in `site/src/content/testimonials/*.md` (6 entries). No new extraction needed — see "What does not change" below.
3. **`Desired-UI-Look*.jpg`** — visual/layout reference only from here on (colors, spacing, card arrangement). No longer a copy source.
4. **`dtm-architecture.html`** — secondary cross-check only, per the redirect. Not consulted for copy text in this pass since the snapshot is more reliable (exact HTML vs. a screenshot transcription).

### Explicit reversal of the "no invented pricing" constraint

The 2026-08-27 remediation's quality-gate note ("Frontend must not invent pricing — if tiers return, they become CMS-managed") is **deliberately reversed** here, on direct user confirmation, not an oversight. The pricing tiers below (`2400 zł`/`3300 zł`/`4000 zł`, `250 zł/h` overage, `30%`/`1000 zł`/`2500 zł`/`1%`/`2000 zł` Concierge terms) are real values already published in a previous confirmed build (the snapshot) — restoring them is not "inventing" new figures, it's reinstating figures the user has already seen and approved. A future reader should not mistake this for a quality-gate violation; see ADR-003.

### Conversation-sourced edits — applied on top of the snapshot baseline

Per `.claude/tasks/03-restore-mockup-content.task.md`, these five edits are **not** in the raw snapshot and must be layered on top. They're marked inline as **[EDIT #n]** in the section-by-section spec below.

1. **Header CTA consolidation** — drop the plain "Kontakt" nav link, keep only the CTA button, relabel it "Kontakt" (desktop + mobile).
2. **Pill-tag cleanup** — remove the decorative amber pill-tag badges.
3. **Service rebrand** — "Abonament „Prawa Ręka”" → **Delegate Wsparcie**; "Concierge Auto" → **Delegate Drive**.
4. **Four line-level copy replacements** (exact text below).
5. **Responsive/typography CSS** — `.hero__cards` breakpoint, flex+gap icon/title/paragraph spacing, loosened line-heights.

### Section-by-section final copy

**1. Header/Nav** (`Header.astro`)

- Wordmark: `delegate` + amber `to mate` (unchanged).
- Nav links: Usługi (`#uslugi`), Jak to działa (`#jak-to-dziala`), Opinie (`#opinie`), FAQ (`#faq`). **[EDIT #1]** No plain "Kontakt" link — the snapshot has one (`<a href="#kontakt">Kontakt</a>` inside `.nav`); drop it.
- CTA button (desktop + mobile): **[EDIT #1]** label "Kontakt" (snapshot has it as "Umów rozmowę" — relabel).
- **Already correct in the working tree:** the current (uncommitted) `Header.astro` already implements both halves of Edit #1 — no plain nav "Kontakt" link, CTA already labeled "Kontakt". When Frontend swaps the rest of the page back to mockup content, **keep this exact Header.astro nav/CTA structure** — don't reintroduce the snapshot's duplicate "Kontakt" link or its "Umów rozmowę" CTA label.
- FAQ nav link stays conditional on `hasFaq` (`getCollection('faq').length > 0`) — no logic change needed, it will resolve `true` once the FAQ collection is populated below.

**2. Hero** (`Hero.astro`)

- Pill "NOWA OFERTA" — **[EDIT #2]** remove.
- H1: `Prawa Ręka do prowadzenia firmy i do zakupu auta`
- Subhead — **[EDIT #4]** two replacements applied: `Dla właścicieli małych firm, którzy toną w sprawach bieżących i nie mają czasu na rozwój. Przejmuję operacyjny ciężar Twojej firmy i pilnuję, żebyś nie przepłacił za nowy samochód.` (snapshot has "…toną w bieżączce…" and "…za samochód firmowy." — both are replaced per Edit #4, not the snapshot's literal wording).
- CTAs: `Umów rozmowę` (filled amber, → `#kontakt`), `Zobacz cennik` (outline, → `#uslugi`).
- Two hero mini-cards — **[EDIT #3 + #4]** the task file names these cards by their edit-list wording ("'Delegate Wsparcie' bullet…", "'Delegate Drive' bullet…"), which is how I've resolved an otherwise-ambiguous scope question: the rebrand and the two bullet edits apply to these mini-cards, not just the full service-section headings below — flagged here for Frontend/user visibility since it's an inference, not a literal snapshot quote.
  - Card 1: icon `◈`, bold label **Delegate Wsparcie** (snapshot: "Abonament „Prawa Ręka”"), bullet **[EDIT #4]** `Terminy, dostawcy, klienci` (snapshot: "Koordynacja zadań, terminy, dostawcy, rekrutacja").
  - Card 2: icon `⬢`, bold label **Delegate Drive** (snapshot: "Concierge Auto"), bullet **[EDIT #4]** `Negocjuję ceny bez konfliktu interesu` (snapshot: "Negocjuję bez konfliktu interesu").
- **CSS — already satisfied, no change needed:** current `global.css` already has `.hero__cards { grid-template-columns: 1fr 1fr }` under `@media (min-width: 640px)` (line ~356), and `.hero__mini` already uses `display:flex; flex-direction:column; gap:10px` with `strong { line-height:1.3 }` / `p { line-height:1.6 }` (lines ~359–384). This is Edit #5. Frontend should verify it still holds once the markup swaps from the current collection-driven two-card loop back to the two fixed cards above (same DOM shape, so it should carry over unchanged) — not re-derive it from scratch.
- Logo strip ("Zaufali nam", 6 brands) — unchanged, already correct in current `Hero.astro`.

**3. Dla kogo** (`Intro.astro`, section `id="jak-to-dziala"`)

- Pill "DLA KOGO" — **[EDIT #2]** remove.
- H2: `Prowadzisz firmę, nie dyspozytornię.`
- Paragraph: `Produkcja, budowlanka i podobne branże. Codziennie gasisz pożary: terminy, dostawy, rekrutacja, oferty do sprawdzenia, i nie zostaje czasu, żeby usiąść i pomyśleć o rozwoju firmy. Nie potrzebujesz kolejnego pracownika na etacie ani asystentki „do wszystkiego”. Potrzebujesz kogoś, kto realnie przejmie operacyjny ciężar i działa dla dobra Twojej firmy, jak partner biznesowy, nie podwykonawca zadań z listy.`
- This entirely replaces the current live-site "DELEGATE TO MATE" intro paragraph + 5-tile grid + "POZNAJ USŁUGI" button — those go, this two-column heading/paragraph layout (per the snapshot's `1fr 1.55fr` grid) replaces them.

**4. Usługa 01 → Delegate Wsparcie** (`Services.astro`, section `id="uslugi"`)

- Pill "USŁUGA 01" — **[EDIT #2]** remove.
- H2: **[EDIT #3]** `Delegate Wsparcie` (snapshot: "Abonament „Prawa Ręka”").
- Standfirst: `Wsparcie operacyjne rozliczane w jasnym, miesięcznym pakiecie godzin, bez liczenia każdej minuty i bez niespodzianek na fakturze.`
- "Zakres bazowy" list (unchanged by Edit #4 — that edit targets the Hero mini-card bullet only, not this list; the exact string "Koordynacja zadań, terminy, dostawcy, rekrutacja" only matches the Hero card, not any line here):
  - Koordynacja zadań i pilnowanie terminów
  - Kontakt z klientami i dostawcami
  - Rekrutacja
  - Analiza ofert
  - Negocjacje z dostawcami i podwykonawcami
- "Moduł premium (płatny dodatkowo)" box: `Pozyskiwanie klientów, sprzedaż, analiza rynku i konkurencji, negocjacje sprzedażowe. Zakres i cena ustalane indywidualnie, po rozmowie o Twoich celach sprzedażowych.`
- Pricing tiers: **BAZOWY** 2400 zł / 20h mies. — **STANDARD** 3300 zł / 30h mies., tagged "NAJCZĘŚCIEJ WYBIERANY" — **ROZSZERZONY** 4000 zł / 40h mies. This tier badge is a functional pricing-recommendation flag, not a decorative section-kicker pill — it is **not** in scope for the pill-tag cleanup (Edit #2).
- Overage note: `Bezpiecznik: przekroczenie limitu godzin to dopłata 250 zł/h. Przy regularnych przekroczeniach po prostu zmieniamy pakiet na wyższy, koszt miesięczny zawsze znasz z góry.`

**5. Usługa 02 → Delegate Drive** (new component or extended `Services.astro`, no `id` in snapshot — sits directly below Usługa 01, same `<section>` rhythm)

- Pill "USŁUGA 02" — **[EDIT #2]** remove.
- H2: **[EDIT #3]** `Delegate Drive` (snapshot: "Concierge Auto").
- Standfirst: `Kupujesz samochód firmowy? Sprawdzam ofertę albo prowadzę cały proces od zera, tak żebyś nie przepłacił.`
- Path 1 card — "MASZ JUŻ OFERTĘ": H3 `Weryfikuję i negocjuję lepsze warunki`, price line `30% od wynegocjowanego zysku brutto`, body `Zarabiam wtedy, kiedy Ty realnie oszczędzasz. Jeśli mimo negocjacji nie dojdzie do zakupu, 1000 zł rekompensaty dla Ciebie.`
- Path 2 card — "ZACZYNASZ OD ZERA": H3 `Przejmuję cały proces zakupu`, price line `2500 zł ryczałtu`, body `albo 1% wartości konfiguracji, zależnie co wyższe, minimum 2000 zł. Dobór konfiguracji, rozeznanie rynku, negocjacje, finalizacja.`

**Structural flag for Frontend — Services.astro needs a real rewrite, not a content-file swap:** the current `Services.astro` maps generically over `getCollection('services')` (5 real-site services, no pricing fields), and the `services` Zod schema (`content.config.ts`) has no tier/price fields at all. The two-service, three-tier, two-path layout above cannot be expressed as that generic collection loop — it needs bespoke markup for both service blocks (either two fixed sections, or a schema extended with a `tiers`/`paths` structure per service). This is a structural change, not just new Markdown content — flagging it explicitly since ADR-002 documented "service tiles + descriptions" as CMS-managed via the generic collection, and that assumption no longer holds for this content shape.

**6. Dlaczego** (`Benefits.astro`, section `id="korzysci"`)

- Pill "DLACZEGO DELEGATE TO MATE" — **[EDIT #2]** remove.
- H2: `Partner biznesowy, który działa dla dobra Twojej firmy, nie pracownik na etacie.`
- Four cards (replaces the current 8 real-site "Korzyści" cards — the `benefits` collection's 8 entries are all superseded):
  1. **Ekonomika oddelegowania** — `Godzina Twojej pracy jako właściciela jest warta więcej niż stawka, którą płacisz za moją.`
  2. **Brak konfliktu interesu** — `Przy zakupie auta zarabiam na wysokości rabatu, nie na wyborze dealera czy partnera finansowego.`
  3. **Przewidywalny koszt** — `Bezpiecznik w abonamencie oznacza, że koszt miesięczny znasz z góry.`
  4. **Brak ryzyka finansowego** — `Jeśli negocjacje zakupu auta się nie powiodą, 1000 zł rekompensaty. Ryzyko biorę na siebie.`
- Each card also has an icon glyph in the snapshot (`◎`, `◈`, `▭`, `⬢` respectively) — carry these over; `Benefits.astro`'s schema (`title`, `order`, `description`) has no `icon` field today, unlike `services`, so add one or hardcode per-card icons.
- Mechanically: replace the 8 files in `src/content/benefits/` with these 4 (delete the WP-sourced ones — `oszczednosc-czasu.md`, `kompleksowe-wsparcie.md`, `redukcja-kosztow.md`, `przewaga-konkurencyjna.md`, `transparentnosc.md`, `profesjonalizm.md`, `indywidualne-podejscie.md`, `wsparcie-finansowe.md` — rather than leaving them as orphaned/unused CMS drafts, since they no longer describe a shipped section).

**7. Opinie** (`Testimonials.astro`) — **no change.**

The current component already renders exactly the mockup's heading ("Co mówią klienci"), star row, blockquote/footer card shape, sourced from `getCollection('testimonials')` — and that collection already holds the 6 full, real quotes pulled from the live site 2026-08-27 (Płatkowski.net, Horizon, Bartom, Art-Bud, Gelato Nobile, Budspaw — verified against `site/src/content/testimonials/*.md`, matches this doc's "Real content mapping" section verbatim). This *is* the testimonials exception the task calls for — it was already done in the prior pass and doesn't need to be redone. Only the pill tag "OPINIE" — **[EDIT #2]** — is removed. The mockup snapshot's own 3-card version with its `[Na życzenie: pełne cytaty…]` disclaimer is superseded by this already-complete 6-quote version; do not revert to the snapshot's 3 fragments.

**8. FAQ** (`FAQ.astro`)

- Pill "FAQ" — **[EDIT #2]** remove.
- H2: `Najczęściej zadawane pytania`
- Four Q&A, first expanded by default:
  1. **Q:** `Co jeśli nie wykorzystam wszystkich godzin z pakietu?` **A:** `Abonament to nie bank godzin do wykorzystania kiedykolwiek — to Twoja dostępna Prawa Ręka na dany miesiąc. Niewykorzystane godziny nie przechodzą na kolejny okres. Jeśli regularnie zostaje zapas, przechodzimy na mniejszy pakiet.`
  2. **Q:** `Czyj interes reprezentujesz przy zakupie auta?` **A:** `Zawsze Twój. Przy weryfikacji oferty mam % od wypracowanej oszczędności, przy przejęciu całego procesu — ryczałt. Nie biorę prowizji od dealera ani partnera finansowego, więc nie mam powodu kierować Cię do droższego wyboru.`
  3. **Q:** `Co jeśli przekroczę limit godzin w abonamencie, ile wtedy zapłacę?` **A:** `Przekroczenie to dopłata 250 zł/h. Jeśli widzimy, że regularnie przekraczasz limit, po prostu podnosimy pakiet — bez kar, bez niespodzianek, koszt znasz z góry przy zmianie.`
  4. **Q:** `Czy w ogóle opłaca się oddelegować te zadania, zamiast robić je samemu?` **A:** `Jeśli Twoja godzina jako właściciela jest warta więcej niż stawka abonamentu, oddelegowanie zwalnia Ci czas na działania, które realnie budują przychód — sprzedaż, relacje, rozwój. Policz, ile godzin tygodniowo gasisz pożary, i pomnóż przez swoją stawkę — wynik zwykle odpowiada sam.`
- Mechanically: populate `src/content/faq/*.md` with these 4 entries (schema already fits: `question`, `answer`, `order` — no schema change needed, unlike Services/Benefits above). Once populated, `FAQ.astro`'s existing `faqs.length > 0` guard resolves true automatically and the section — plus the Header/Footer FAQ nav links — appear with no component-logic change.
- **Flagged, not silently fixed:** Q1's answer still says `…to Twoja dostępna Prawa Ręka na dany miesiąc` — the old service name, un-updated for the Edit #3 rebrand to "Delegate Wsparcie". This is in the snapshot verbatim; Edit #3 in the task file only names the two H2 headings and (per the Hero-card inference above) the two mini-card labels — it doesn't mention FAQ prose. Leaving it as "Prawa Ręka" here would read as a naming inconsistency against the rebranded section immediately above it. Not fixing this without a decision — flagging for the user/Frontend to say whether Q1's answer should also say "Delegate Wsparcie".

**9. CTA+Footer** (`CTA.astro` + `Footer.astro`)

- CTA heading: `Koniec z gaszeniem pożarów.`
- CTA subtext: `Napisz, pogadajmy o tym, co można oddać z Twojego biurka.`
- Left panel: icon `✦`, H3 `Porozmawiajmy o Twojej firmie`, body `Delegate To Mate — wsparcie operacyjne i concierge zakupowy dla właścicieli małych firm. Odzyskaj czas na rozwój.`
- Phone CTA button: `Zadzwoń: (+48) 796 017 986` (unchanged `tel:` href).
- Phone line: `(+48) 796 017 986 · dostępny 24/7` (current `CTA.astro` has "24/7 dostępny dla Ciebie" — snapshot has "dostępny 24/7"; use the snapshot's word order since it's the primary source for this pass).
- Address: `Marii Konopnickiej 22, 43-200 Pszczyna` (unchanged).
- Email line (new vs. current `CTA.astro`, which has no email): `kontakt@delegatetomate.pl — odpowiada Maciej`, `mailto:` link.
- Form card: H3 `Napisz wiadomość`, standfirst `Odpowiem tego samego dnia. Formularz zabezpieczony, bez przeładowań.` (current `CTA.astro` has only "Formularz zabezpieczony, bez przeładowań." — snapshot adds the "Odpowiem tego samego dnia." lead-in; use the snapshot's fuller version).
- Form fields, honeypot, submit label, privacy-policy link text — unchanged, already match current `ContactForm.tsx` exactly (not touched by the WP remediation pass, no diff to apply).
- Footer tagline: `Wsparcie operacyjne i concierge zakupowy dla właścicieli małych firm.` (replaces the current, longer WP-sourced "Delegate To Mate to firma oferująca…" paragraph).
- Footer "STRONA" nav: Usługi, Jak to działa, Opinie, FAQ (unchanged — footer never had a "Kontakt" entry, so Edit #1's consolidation doesn't touch it).
- Footer "KONTAKT" block: phone, address, `Facebook · Instagram @delegate_to_mate` (unchanged from current).
- Copyright bar: `© 2026 Delegate to Mate. Wszelkie prawa zastrzeżone.` + `Polityka prywatności` link (current footer's copyright bar has only the policy link, no copyright line at all — add it).

### SEO/meta — flagged, not a literal snapshot restore

`site/src/pages/index.astro`'s `title`/`description` (and the `<title>`/`<meta description>` the snapshot's own `<head>` carries) are **still the old WP-sourced SEO copy** ("DELEGATE TO MATE — Innowacyjne rozwiązania dla Twojego biznesu…") — this didn't get updated when the mockup body content was built, so the snapshot itself is internally inconsistent (mockup body, stale head). There is no "final" head-tag text to copy verbatim from any source. Proposed resolution, assembled entirely from copy already restored above (not invented prose): title `delegate to mate — Prawa Ręka do prowadzenia firmy i do zakupu auta` (wordmark + the restored H1), description = the restored Hero subhead verbatim (`Dla właścicieli małych firm, którzy toną w sprawach bieżących…żebyś nie przepłacił za nowy samochód.`, ~200 chars, truncates gracefully). JSON-LD `Organization`/`WebSite` blocks (phone, address, `sameAs`) are unaffected either way and don't need to change.

### What does not change (already correct in the working tree — don't redo)

- `Header.astro`'s nav/CTA structure (Edit #1) — already implemented, uncommitted.
- `.hero__cards`/`.hero__mini` responsive CSS in `global.css` (Edit #5) — already implemented, uncommitted.
- `Testimonials.astro` and its 6-entry content collection — already the real, full quotes; no re-pull needed.
- `ContactForm.tsx` — form fields/labels already match the snapshot exactly.
- ADR-001 (contact form → hosted API), ADR-002 (Decap CMS), the single-page roadmap call — none of these are reopened by this copy reversal.

### Done when (Frontend)

- All nine sections above render this spec's copy, with the five edits applied and the two flagged open items (FAQ Q1's "Prawa Ręka" reference, SEO meta text) either resolved per the proposal above or explicitly deferred back to the user.
- `services` and `benefits` Zod schemas and content files are restructured per the notes above (Services needs bespoke tier markup; Benefits collection is a straight 8→4 swap).
- `npm run build` clean; RPi Phase 1 container rebuilt and redeployed per the task file's own done-when list.

---

## Phase 8 — shipped copy is canonical (2026-08-28, later the same day as Phase 7)

> Full reasoning: `docs/adr/004-shipped-copy-is-canonical.md`. This section is a short pointer, not a re-transcription of the nine sections — the source of truth for actual copy is the components themselves from this point on, not this document.

After Phase 7 landed in the working tree, further edits happened directly against the components — some described to Architect and confirmed as intentional, some found only by spot-checking the tree against the Phase 7 spec while writing this section. The user then confirmed directly: the page content as it currently stands is the desired content, and documentation should catch up to it, not the other way around.

**Confirmed-final (user-described or directly made, not bugs):**

- **Hero** — "Zaufali nam" 6-brand logo strip removed entirely (markup + `.hero__brands*`/`.brand-logo*` CSS). A Hero sub-element, not a top-level section — content parity across the nine sections is unaffected.
- **CTA** — heading "Koniec z gaszeniem pożarów." → "Koniec z ciągłym przeciążeniem."; subhead "…co można oddać z Twojego biurka" → "…co można zdjąć z Twojego biurka"; phone/contact block lost "· dostępny 24/7", the street address, and "— odpowiada Maciej" (now just phone + email).
- **Footer** — tagline paragraph under the wordmark removed; street address removed from the KONTAKT column (phone + Facebook/Instagram remain).
- The `LocalBusiness`/`Organization` JSON-LD in `site/src/pages/index.astro` still carries the street address, untouched — an **open question**, not a decision: should it also drop now that the address is gone from visible page content, or does structured data legitimately keep it regardless of what's rendered?

**Flagged, not confirmed** — found via spot-check against the Phase 7 spec, not described as deliberate edits, and materially change a commercial term or figure in three of five cases:

| Where | Phase 7 spec said | Tree currently ships | Materiality |
|---|---|---|---|
| `Services.astro` overage note + `faq/przekroczenie-limitu.md` | `250 zł/h` | `200 zł/h` (consistent across both files) | Pricing figure |
| `Services.astro` Delegate Drive, "Masz już ofertę" | Company pays client 1000 zł if negotiation fails and no purchase results | Client pays company 1000 zł if they cancel the purchase after work starts — reversed direction | Commercial term, high |
| `Services.astro` Delegate Drive, "Zaczynasz od zera" | "…minimum 2000 zł" floor on the 1% figure | Floor clause absent | Pricing term |
| `benefits/brak-ryzyka-finansowego.md` | "Jeśli negocjacje zakupu auta się nie powiodą, 1000 zł rekompensaty. Ryzyko biorę na siebie." | "Jeśli nie dostarczę większej korzyści, nadal nic nie tracisz." (title also extended to "…przy zakupie pojazdu") | Reworded to match the reversed compensation framing above |
| `Services.astro` "Zakres bazowy", 3rd bullet | "Rekrutacja" | "Wsparcie rekrutacji" | Cosmetic |
| `benefits/ekonomika-oddelegowania.md` | Title "Ekonomika oddelegowania" | Title "Ekonomia delegowania" | Cosmetic rename |
| `Intro.astro` | "Codziennie gasisz pożary: terminy, dostawy, rekrutacja…" | "Jesteś zmuszony do załatwiania mnóstwa spraw: terminy, dostawy, rekrutacja, komunikacja, klienci…" — no "gasisz pożary" line at all | Matches neither Phase 7 nor any alternative the user was shown mid-session per the orchestrator; no final wording picked |

The 1000 zł-clause reversal and its matching Benefits-card reword are internally consistent with each other, which reads more like an intentional (if undocumented) business-model change than an accident — but "internally consistent" isn't the same as "confirmed," so it stays flagged rather than written up as decided. Same for the 200 zł/h rate, consistent across two files. None of these were edited as part of this reconciliation pass; a future pass either confirms them with the user and syncs this document, or corrects the component/content files back toward the Phase 7 figures — both are content decisions outside this pass's docs-only scope.

Separately, `.claude/tasks/03-restore-mockup-content.task.md`'s own Edit #4 (line-level copy edits) is only 3-of-4 correctly applied — the "Delegate Wsparcie" Hero mini-card bullet ships as `"Koordynacja zadań, terminy, dostawcy, klienci"`, matching neither the pre-edit snapshot text nor the edit's specified target `"Terminy, dostawcy, klienci"`. That task file stays open (not moved to `done/`) pending a Frontend fix.

## Tenth section — "O mnie" (About me) — Task 04, 2026-08-28

> **New scope, beyond the original nine-section WP migration.** This is not a content-parity item traced back to the live WP site or the mockup — it's a personal "about the founder" section the user requested directly on 2026-08-28, with a design proposal shown as an Artifact mockup and explicitly approved ("Propozycja jest dobra. Zakoduj."). Full approved spec: `.claude/tasks/04-add-o-mnie-section.task.md`. This entry records that spec in the same place Frontend looks for every other section's content contract; it does not reopen or alter Decisions 1–4 or ADRs 001–004.

**What it is:** a photo-plus-copy section introducing Maciek Boryś as the person behind the service — a signature/credibility beat between the value-proposition argument (Dlaczego) and the social-proof section (Opinie).

**Where it sits:** `src/components/sections/OMnie.astro`, rendered in `site/src/pages/index.astro` between `<Benefits />` (Dlaczego) and `<Testimonials />` (Opinie) — i.e. the page's section order becomes Header → Hero → Intro → Services → Benefits → **OMnie** → Testimonials → FAQ → CTA → Footer.

**Why here, and why cream:** comes right after the value-prop argument and right before client-proof testimonials — the natural point to introduce the person behind the promise, before the reader hears from other clients. It also fixes section rhythm: Benefits (Dlaczego) is `.section--navy`, so a cream section here avoids two navy sections back to back. Background: the existing `.section--cream-2` gradient token (`linear-gradient(180deg, var(--cream-2) 0%, var(--cream) 100%)`) — no new color token needed.

**Status of the content below (updated 2026-08-29):** all four pieces are now final. The bio paragraphs and photo were placeholders when this section was first specced (2026-08-28); the user has since sent the real photo (`site/src/assets/o-mnie/maciek-borys.png`) and five real bio sentences, both now wired into `OMnie.astro`. The "Content contract for Frontend" subsection below is left as originally written — it documents the approved placeholder-era spec (layout, kicker, signature element, CTA are all still accurate and unchanged; the bio-paragraph and photo text within it are superseded by the shipped component, same treatment this doc gives other historical specs elsewhere).

| Element | Status |
|---|---|
| Name "Maciek Boryś" | **Final.** Confirmed directly by the user. |
| Role "Założyciel delegate to mate" | **Final.** Confirmed directly by the user (male form — "Założyciel", not "Założycielka"). |
| Bio paragraphs (now five, not two) | **Final.** Real copy sent by the user 2026-08-29 — see `OMnie.astro` for the shipped text. No more `.fill`/bracket placeholder styling. |
| Photo | **Final.** Real photo supplied 2026-08-29 — `site/src/assets/o-mnie/maciek-borys.png` (427×640, background-removed cutout), wired via `astro:assets` `<Image>`. |

### Content contract for Frontend

**Layout:** two-column grid, photo left / copy right on desktop, `grid-template-columns: 0.85fr 1.15fr`, gap ~60px — same breakpoint convention as `.intro__grid`/`.hero__grid` (`@media (min-width: 900px)`; stacked, photo above copy, below that width).

**Kicker:** small-caps, amber, **no pill background** — the site removed pill-tag badges sitewide 2026-08-28 (ADR-003's Edit #2); don't reintroduce one here.
> "Poznaj swoją prawą rękę"

**Heading:** `.h-section`-equivalent, `font-family: var(--font-display)`, weight 400.
> "Cześć, jestem Maciek."

**Bio paragraphs (DRAFT — pending real copy from the user):** `.lead`-style (`color: #475569`, `font-size: 15.5px`, `line-height: 1.75`, `max-width: 56ch`). Bracketed spans (`[X lat]`, `[branża / tło zawodowe]`) get a `.fill` class (`border-bottom: 1.5px dotted var(--amber-dark); color: var(--amber-dark); font-weight: 600`) so the placeholder nature is visually obvious rather than reading as finished copy:
1. "Nie jestem platformą ani call center — jestem jedną osobą, z którą rozmawiasz od pierwszego telefonu do ostatniego załatwionego tematu. **[X lat]** spędziłem w **[branża / tło zawodowe]**, zanim doszedłem do wniosku, że najwięcej wnoszę tam, gdzie mogę zdjąć z kogoś operacyjny ciężar prowadzenia firmy."
2. "Traktuję Twoją firmę jak swoją — bez podwykonawców, bez „to nie mój dział”. Jeśli się na coś umawiamy, biorę za to odpowiedzialność osobiście."

**Signature element (final copy, the section's one distinctive touch):** below a `border-top: 1px solid var(--border-cream)` divider — name set in italic Fraunces amber, reusing the exact `.hero h1 em` treatment already in `global.css` (`color: var(--amber); font-style: italic; font-weight: 400;`), at ~28–32px:
> "Maciek Boryś"

Below it, smaller muted text:
> "Założyciel delegate to mate"

**CTA:** a text link (not a `.btn`) styled like the nav's underline-on-hover pattern — amber `border-bottom`, gap widens on hover.
> "Umów rozmowę →" → `#kontakt`

**Photo spec (placeholder-pending-real-photo):**
- Portrait aspect ratio 4:5, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-card)`.
- Offset amber-bordered frame behind/around it (`border: 2px solid var(--amber)`, offset ~18px down-right, `opacity: ~0.55`) — reads as a framed photograph.
- Placeholder fill (no real photo exists yet): the site's navy/amber gradient (`radial-gradient(...rgba(201,162,39,0.35)...), linear-gradient(155deg, #17412e, #0d2b1e, #0a2217)`) with a minimal two-shape flat SVG bust/silhouette (cream fill, low opacity — not a detailed illustration), plus a small caption strip at the bottom: "Miejsce na zdjęcie · portret, proporcje 4:5".
- Build this so the swap is trivial later: land the real file under `site/src/assets/o-mnie/` when it arrives, and leave a code comment in `OMnie.astro` pointing at exactly which placeholder block becomes an Astro `<Image>` (`astro:assets`) once that file exists. Don't wire up an `astro:assets` import for a file that doesn't exist yet — that would fail the build.

**Accessibility/motion:** responsive down to mobile (stacked below 900px), keyboard-focusable CTA with a visible focus state, `prefers-reduced-motion` respected if any transition is added — same bar as the other nine sections.

**Follow-up expected:** the user will send the real photo and finished bio text in a later message. When that happens, the photo swap and the two `.fill`-marked paragraphs are the only things that should need to change — no other markup. `.claude/tasks/04-add-o-mnie-section.task.md` carries a note to this effect and moves to `.claude/tasks/done/` with that caveat once Frontend ships the placeholder version.

### ADR? — not warranted

No ADR was written for this addition. The ADR guidance in this repo (see the Architect role definition) reserves ADRs for decisions with a real trade-off to weigh — CMS vs. no CMS, form destination, stack choice. This is not that: placement, layout, photo treatment, and copy were already designed, shown to the user as a mockup, and approved outright, with no competing option Architect had to weigh or that a future reader would need reasoning to understand. It's an approved content/design addition, not an architectural decision — recording it here, in the same place every other section's content contract lives, is the right level of documentation.

---

## Not decided here — none remaining

All `CLAUDE.md` open questions that gate the nine-section build are now resolved: copy source (**superseded twice, 2026-08-28** — first to the mockup snapshot, see "Content restoration" above; then to the shipped components themselves, see "Phase 8" above and ADR-004), CMS (Decap, ADR-002), contact-form destination (hosted API, ADR-001), roadmap (single page only, checked 2026-08-27). The build is unblocked; ADR-003 and ADR-004 record the two copy-source reversals. A handful of content items surfaced in Phase 8 (pricing figures, a possibly-reversed compensation clause, Intro's paragraph) remain genuinely open and need the user's confirmation — they don't gate the build, since the build already ships whatever is in the tree, but they do gate calling those specific figures "correct."
