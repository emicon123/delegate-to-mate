# ADR-005: Content/design editing — local AI coding agent over Decap CMS

**Date:** 2026-08-29
**Status:** Accepted — supersedes ADR-002 (Decap CMS)

**Context:**

ADR-002 picked Decap CMS to let a non-technical person (Maciek) edit copy/pricing without touching code. It was built — `/admin` route, `config.yml` mapping every content collection to form fields — but never actually wired to a working login. Decap's `github` backend defaults to Netlify's hosted OAuth proxy, and this project deliberately isn't on Netlify. Making it work would mean either a Netlify account just for OAuth (defeats the point of avoiding Netlify) or standing up a separate OAuth proxy (a new Cloudflare/Vercel account and a small serverless function) — real setup cost for both the developer and the non-technical user, who'd still be capped at whatever fields `config.yml` happened to expose. Wanting to add a new section, change a color, or restructure a card would still require a developer.

Meanwhile Maciek already has a MacBook and is willing to use a terminal-based AI coding agent (OpenCode, or Claude Code) directly against this repo. That gives him full-repository editing power — copy, pricing, colors, new sections, anything — through natural-language requests, with zero new accounts and no OAuth to stand up.

**Decision:**

Drop Decap CMS. The `/admin` route and `config.yml` are deleted. Content and design changes go through a local AI coding agent working directly in this git repo, guided by a new root-level file, `Maciek.md`, aimed specifically at that workflow (separate from this file, which stays aimed at the engineering/architecture context Maciek doesn't need). The published workflow:

1. Maciek asks his agent for a change (copy, pricing, color, a new section — anything).
2. The agent edits the site, then runs `npm run dev` so Maciek can see the result on `localhost` before anything goes live.
3. Once approved, the agent commits and pushes straight to `main` — no PR gate, by choice, to keep this frictionless for content-only changes.
4. A GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on every push to `main`: it builds the site and FTP-mirrors the output to `public_html` on seohost.pl automatically. No manual deploy step.

**Guardrail:** local preview (step 2) protects against a change looking wrong, but Maciek has no way to notice if an agent also touched something outside the site itself — the deploy pipeline or its credentials. The workflow's first job diffs the pushed commits against a **denylist** (`.github/`, `.env*`, anything FTP/deploy-related) and fails before building if anything on it was touched. Content/design freedom stays unrestricted; the deploy mechanism itself is the one thing that can't be silently changed by a prompt.

**Consequences:**

- No OAuth, no new third-party accounts, no server-side CMS process — stays inside the cost-free, static-first constraint at zero marginal infrastructure.
- Maciek can go beyond copy edits (layout, styling, new sections) without waiting on a developer, which Decap's field-based config never would have allowed anyway.
- The safety net is weaker than Decap's hard UI boundary — it's a git-history record plus a deploy-time denylist check, not a prevention of the edit itself. Accepted given local preview catches the common failure mode (content looks wrong) and the denylist catches the dangerous one (pipeline/secrets tampering); a bad-but-passing change still reaches production automatically, recoverable via `git revert` + a follow-up push, not instant/unrecoverable.
- `CLAUDE.md`'s "no CI/CD" framing for FTP deploy was written when this repo had no GitHub remote at all; it now does (`emicon123/delegate-to-mate`), and this ADR is the first thing to actually use GitHub Actions for deploy. Larger structural changes (new dependencies, build config, the workflow file itself) still go through the normal Architect/Frontend/Deploy flow in `CLAUDE.md`, not through Maciek's agent.
