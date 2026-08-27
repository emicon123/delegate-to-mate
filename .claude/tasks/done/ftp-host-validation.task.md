# Task: FTP/seohost.pl deploy-risk validation (spike-first, before the real build)

**Why:** the static-first stack was chosen on paper because it fits FTP-only shared hosting — this task proves it against the *actual* host (LiteSpeed static-serving, FTP bulk-upload reliability, PHP `mail()` deliverability, base-path correctness) with a disposable one-page skeleton, before Architect/Frontend invest in the real nine-section build. Full reasoning and phase detail: this file is self-contained, but the original plan (with fuller narrative) is also at `/home/wojtekrpi/.claude/plans/shiny-petting-hanrahan.md` if more context is needed.

**Status:** not started. **Blocks:** the real nine-section build, and `production-cutover.task.md`.

**Important:** every `public_html/...` path in this task means the **remote** path on the live seohost.pl server, reached over FTP using the credentials in `.env`. The `public_html/` directory in this repo is a local snapshot pulled down for reference — it is not synced to the live site, editing it locally does nothing to what visitors see, and it will drift out of date as this task proceeds. All "upload," "delete," "replace `.htaccess`" actions below are FTP operations against the remote server, not local file edits.

## Phase 0 — Provisional decisions + setup
**Owner: Architect. Risk: none.**
- Pick provisionally (not full-ADR): build tool (Astro vs. plain Vite), and which contact-form destination to test first (recommend PHP `mail()` first if it's a live candidate — higher uncertainty than a hosted form API like Web3Forms/Formspree).
- Confirm both choices with the user, and confirm sequencing (this validation before the real build), before Phase 2 touches the live server.

## Phase 1 — Local walking-skeleton build
**Owner: Frontend. Risk: none — local only.**
- Minimal project in the site source dir (name it, e.g. `site/`): one page, one CSS bundle, one image, hashed filenames matching real build output shape.
- Configurable base path (per `CLAUDE.md`'s Phase 1 RPi / Phase 2 seohost requirement), built twice: root base (`/`) and test subpath base (`/_test-static/`).
- If PHP `mail()` is the provisional destination: minimal form UI posting to a placeholder endpoint.
- **Not thrown away** — this becomes the real site source directory; only placeholder content and the disposable deploy target are throwaway.
- **Pass:** `npm run build` exits 0 for both base-path configs, hashed filenames present, each build serves locally with zero console errors, all assets 200.

## Phase 2 — Live LiteSpeed static-serving test (disposable subdirectory)
**Owner: Deploy. Risk: FIRST live-server contact.**

**Confirm with user before starting** — first real FTP write into production `public_html`, even though the target is disposable.

- Upload the Phase 1 subpath-base build to a new `public_html/_test-static/` directory, alongside the untouched live WP files. **Do not touch `.htaccess`** — WP's existing rewrite block already has `!-f`/`!-d` conditions, so real files should pass through untouched; this phase proves that.
- **Pass:** `https://delegatetomate.pl/_test-static/` returns 200 over HTTPS (no mixed-content warnings), correct HTML/CSS/image `Content-Type`s, directory-index resolves to `index.html`, and the live WP homepage at `/` is unaffected (spot-check before/after).

**Security-exposure note (informational, not gating):** this is "the first deploy that touches `public_html`" — the trigger `deploy.md` names for closing the `backup.php` exposure. Deleting `backup.php`/`db_dump.php`/`zip.php` and rotating the *unrelated* hardcoded DB's password is safe anytime, including now. If remediation extends to rotating *this site's own* DB password, that requires a simultaneous `wp-config.php` edit (or live WP breaks) — do that part in Phase 6 instead, where `wp-config.php` is removed anyway.

## Phase 3 — FTP bulk-upload stress test
**Owner: Deploy. Risk: live server, same disposable subdirectory (no new confirmation if continuous with Phase 2; re-confirm if there's a time gap).**
- Generate ~150–300 synthetic dummy files (varied sizes, nested folders, roughly the shape of a real Astro build's output) and mirror via the `lftp mirror` pattern in `deploy.md` into `public_html/_test-static/bulk/`.
- **Pass:** upload completes without drops/timeouts (naive mirror, or a documented retry/parallelism fix); server-side file count matches local exactly; spot-check checksums match.
- **If it fails:** document the working mitigation in `deploy.md`'s FTP section so Phase 6 doesn't rediscover it against production.

## Phase 4 — Contact-form live end-to-end test
**Owner: Deploy (PHP `mail()` path) or Frontend/Architect (hosted form API path). Risk: live server, sends real outbound email.**

**Confirm with user before sending any test email** — ask which inbox should receive it, get explicit go-ahead.

- Deploy a minimal test PHP probe (not the final endpoint) into `_test-static/`, wired to the Phase 1 form UI, submit a real test message.
- **Pass:** email arrives in the confirmed inbox within minutes, **not spam** (landing in spam is a FAIL needing a documented mitigation — switch to hosted API, or fix SPF/DKIM); correct sender/reply-to headers; no PHP errors surfaced to the client; a raw `curl -X POST` bypassing client-side JS is rejected server-side; confirm live PHP version matches what the script targets (seohost allows 5.6–8.5 per domain — don't assume).

## Phase 5 — Go/no-go review
**Owner: Architect (findings/ADRs in `docs/architecture.md`) + orchestrator (summary + sign-off). Risk: none directly.**

**Confirm with user** — present the Phase 1–4 pass/fail summary, get explicit go-ahead before the real nine-section build starts.

- Leave `_test-static/`/`bulk/` in place — cleanup is a Phase 6 step, not done early.
- Once passed: **mark this task done** (move to `.claude/tasks/done/`), normal `CLAUDE.md` flow resumes (Architect content-mapping + remaining open questions, then Frontend builds the real eight remaining sections on the proven Phase 1 scaffold), and `production-cutover.task.md` becomes unblocked once that real build is also complete.
