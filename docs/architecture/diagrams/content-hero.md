# Content Architecture — Hero & Singleton Collections

> Scope: `site/src/content/**` (10 collections) + `site/src/lib/collections.ts` facade + `site/src/pages/index.astro` orchestrator + `site/src/components/sections/Hero.astro` view.
> Follows §1 Evaluate → §2 Diagram (software-design-excellence). See pattern table below + UML legends.

## §1 Evaluate — Pattern & Principle Selection

| Candidate | Verdict | Why |
|---|---|---|
| **Repository (interface + impl)** | rejected | YAGNI — single source (markdown via `astro:content`), no swapping, no test double needed today. Astro's `getCollection` already is repository. |
| **Facade (`lib/collections.ts`)** | **adopted** | DRY — hides `[0]?.data` + `sort(order)` repetition across 7 singletons + 3 lists. Minimal wrapper, KISS, centralizes Zod typing. |
| **Factory Method / Abstract Factory** | rejected | Single creation path: `glob` + `z.object`. No varying families. Plain schema suffices. |
| **Builder** | rejected | YAGNI — cards built declaratively in YAML frontmatter, not programmatically. |
| **Adapter** | rejected | No incompatible interface to adapt; Zod schema matches Decap widget output 1:1. |
| **Decorator / Proxy / Cache** | rejected | Build-time only, no runtime cost. No cross-cutting concern to decorate. |
| **Composite** | rejected | `cards` is flat `HeroCard[]`, no leaf/composite hierarchy. |
| **Strategy** | rejected | One rendering strategy per section. No interchangeable algorithm. |
| **Template Method** | rejected | Sections shapes differ (Hero=cards+CTAs, Wsparcie=tiers, Omnie=bio list). No common skeleton to template; composition preferred. |
| **Observer / State / Command** | rejected | Static site, no lifecycle or event flow. |
| **Layers (PoSA)** | **adopted** | `Markdown → Zod Collection → Facade → Page → View` — boundaries explicit, testable, static-first. |
| **MVC** | **adopted** | `index.astro` = Controller (fetches via facade), `sections/*.astro` = View (props in). Thin controller, dumb view. |
| **Component-Based** | **adopted** | Each section is isolated `*.astro` component, composes via `index.astro`. |
| **Microservices / Broker / CQRS** | rejected | Single landing page, tiny traffic, cost-free. Would violate KISS/YAGNI. |

**Principles:**
- **SRP** — Page fetches, View renders. Hero.astro must not call `getCollection` itself (two reasons to change). Fix: props injection.
- **DIP** — View depends on `HeroProps` interface (abstraction), not on `astro:content` (detail). Facade is the abstraction boundary.
- **DRY** — extracted after 3rd duplication `[0]?.data` (hero×7). Rule of Three satisfied.
- **LoD** — View touches `hero` + `hero.cards[]` one level deep only; no `a.getB().getC()` chain. Guard `hero` via required prop.
- **YAGNI/KISS** — ties broken toward no pattern. No `Repository` interface, no `AbstractSectionFactory`.

## §2 Diagrams

### classDiagram — Content domain + Facade + View

```mermaid
classDiagram
    %% Legend:
    %% <<DTO>> = Zod-validated frontmatter, immutable value
    %% <<Facade>> = lib/collections.ts, centralizes DRY access
    %% <<Component>> = Astro view, props-in only
    %% <<Collection>> = Astro content collection (glob + schema)
    %% Arrows: --|> inheritance, *-- composition, ..> dependency, --> association
    %% Patterns adopted: Facade, Layers, MVC, Component-Based

    class HeroCardDTO {
        <<DTO>>
        +string icon
        +string title
        +string summary
    }

    class HeroDTO {
        <<DTO>>
        +string heading
        +string sub
        +string ctaPrimaryLabel
        +string ctaPrimaryHref
        +string ctaSecondaryLabel
        +string ctaSecondaryHref
        +HeroCardDTO[] cards
    }

    class HeroCollection {
        <<Collection>>
        +loader: glob("hero/*.md")
        +schema: HeroDTO
        +getCollection("hero"): HeroDTO[]
    }

    class SiteDTO {
        <<DTO>>
        +string phone
        +string phoneHref
        +string benefitsHeading
        +NavItem[] nav
    }

    class SiteCollection {
        <<Collection>>
        +loader: glob("site/*.md")
        +schema: SiteDTO
    }

    class BenefitsCollection {
        <<Collection>>
        +loader: glob("benefits/*.md")
        +schema: BenefitDTO
        +sorted by order
    }

    class ContentFacade {
        <<Facade>>
        +getSingleton(name): DTO
        +getSorted(name): DTO[]
        +hasFaq(): boolean
        note "DRY: hides [0]?.data + sort(order)"
    }

    class IndexPage {
        <<Controller MVC>>
        +await Promise.all([getSingleton(hero), ...])
        +render Hero props
    }

    class HeroProps {
        <<DTO Interface>>
        +string heading
        +string sub
        +string ctaPrimaryLabel
        +string ctaPrimaryHref
        +string ctaSecondaryLabel
        +string ctaSecondaryHref
        +HeroCardDTO[] cards
    }

    class HeroView {
        <<Component View>>
        +HeroProps hero
        +render h1 + p + cards map
        note "SRP: render only, no fetch\nDIP: depends on HeroProps"
    }

    class DecapConfig {
        <<Config>>
        +public/admin/config.yml
        +files: hero.md / wsparcie.md / ...
        +folders: benefits / faq
    }

    HeroCollection *-- HeroDTO
    HeroDTO *-- HeroCardDTO
    ContentFacade ..> HeroCollection : wraps
    ContentFacade ..> SiteCollection : wraps
    ContentFacade ..> BenefitsCollection : wraps
    IndexPage ..> ContentFacade : depends on facade
    IndexPage --> HeroView : passes HeroProps
    HeroView ..> HeroProps : renders
    DecapConfig ..> HeroCollection : edits markdown
```

### sequenceDiagram — Build-time content flow (static, no runtime DB)

```mermaid
sequenceDiagram
    participant Editor as Decap Admin / Git
    participant Markdown as hero.md / site.md
    participant AstroBuild as astro build
    participant Zod as Zod schema
    participant Facade as lib/collections.ts
    participant Page as index.astro
    participant Hero as Hero.astro
    participant Dist as dist/index.html
    participant LiteSpeed as LiteSpeed

    Editor->>Markdown: edit frontmatter → git commit
    Markdown->>AstroBuild: glob loader reads *.md
    AstroBuild->>Zod: validate HeroDTO / SiteDTO
    Zod-->>AstroBuild: typed data
    AstroBuild->>Facade: getSingleton("hero")
    Facade->>AstroBuild: hero[0].data
    AstroBuild->>Facade: getSingleton("site") / getSorted("benefits") ...
    Note over Page,Facade: Promise.all parallel fetch (Controller)
    Page->>Page: const hero = await getSingleton("hero")
    Page->>Hero: <Hero hero={hero} />
    Hero->>Hero: render {hero.heading} + cards.map
    Hero-->>Page: HTML fragment
    Page->>Dist: assembled index.html (static)
    Dist->>LiteSpeed: FTP push to public_html
    LiteSpeed-->>Browser: GET / → static HTML (no DB)
```

### stateDiagram — Content entry lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: markdown edited in Decap
    Draft --> Valid: Zod schema passes
    Draft --> Invalid: Zod error → build fails
    Invalid --> Draft: fix frontmatter
    Valid --> Built: astro build embeds HTML
    Built --> Deployed: FTP to public_html
    Deployed --> [*]
```

**Notes / legends applied:**
- SRP: `HeroView` has one reason to change (layout), not fetching.
- DIP: `HeroView` → `HeroProps` (interface), not `astro:content`.
- DRY: Facade extracts 7× `[0]?.data` + 3× `sort(order)` (Rule of Three).
- LoD: view accesses `hero` then `hero.cards` only; no `getCollection().data.cards[0].title` chain.
- YAGNI: Repository interface, Decorator, Strategy rejected — KISS wins.
