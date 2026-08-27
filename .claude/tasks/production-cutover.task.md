# Task: Production cutover — seohost.pl (Phase 6 of the deploy-validation plan)

**BLOCKED — do not start.** Requires both: (1) `ftp-host-validation.task.md` closed — done, see `.claude/tasks/done/`, and (2) `01-content-mapping.task.md` and `02-nine-section-build.task.md` both done. Full plan detail: `/home/wojtekrpi/.claude/plans/shiny-petting-hanrahan.md`.

**Owner:** Deploy (executes), Architect/Frontend confirm build completeness first. **Risk: maximum — overwrites the live, traffic-serving WordPress install.**

**Important:** every `public_html/...` path below means the **remote** path on the live seohost.pl server, reached over FTP using the credentials in `.env` — not the local `public_html/` directory in this repo, which is a stale local snapshot for reference only. All steps here are FTP/remote operations.

**Confirm with user before starting** — the single most consequential, hardest-to-reverse action in the migration. Get explicit sign-off, ideally with the user available right after step 4's smoke test, before step 5's WordPress removal becomes irreversible.

1. **Backup current `public_html`** — full recursive download (WP core, theme, plugins, uploads, `wp-config.php`), timestamped, kept off-server. Export the DB separately via cPanel's backup tool or phpMyAdmin — **not** the compromised `backup.php` chain. Tell the user explicitly: this is *files kept for reference*, not a one-click restore — once the DB password is rotated in step 5, a restored WP install won't reconnect to its database.
2. **Deploy the real build** — FTP-mirror the final production build (root base path, no `/delegate`/`/_test-static` prefix) into `public_html`, using whatever mirror strategy Phase 3 of the validation task proved reliable. No `--delete` yet — land alongside the still-present WP files.
3. **Replace `.htaccess`** — swap in the static-site rules Deploy designed (trailing-slash handling, cache headers on hashed assets, 404 handling), removing the dead WP rewrite block. Keep the original from step 1's backup on hand.
4. **Smoke-test immediately** — homepage loads at domain root, all nine sections render, nav works, no broken asset paths (first true proof of root-context base-path correctness). **If this fails, rollback is cheap:** restore the original `.htaccess` — WordPress still works, since its files haven't been deleted and its DB password hasn't been rotated yet.
5. **Only once step 4 passes:** delete the old WP core/theme/plugin files. Also do here: `backup.php`/`db_dump.php`/`zip.php` deletion (if not already done), stray `db_backup_*.sql`/`www_backup_*.zip` cleanup, and (if applicable) this site's own DB password rotation — `wp-config.php` is being removed in the same pass, so the "still-live WP needs matching credentials" risk no longer applies.
6. **Remove `_test-static/`** (and `bulk/`) from `public_html`.
7. **Final smoke test:** domain-root homepage, all nine sections, contact form live end-to-end using the **final production endpoint** (re-verify — the validation task tested a probe, not necessarily identical), asset network-tab check for 404s, confirm `backup.php`/`db_dump.php`/`zip.php`/`wp-login.php`/`wp-admin/` now 404.

**Pass:** every item in step 7 checks out, no unresolved 404s/broken assets, user has seen and approved the live result. Once done, delete this task file (or move to `done/`).
