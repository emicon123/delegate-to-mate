# ADR-001: Contact Form Destination — Hosted Form API over PHP mail()

**Date:** 2026-08-27
**Status:** Accepted

**Context:**

The rebuilt delegatetomate.pl still needs to capture leads via the contact form (CTA+Footer section, and the Hero CTAs that point to it). Two candidate destinations were live-tested against the real seohost.pl host in Phase 4 of the FTP/host-validation spike (`.claude/tasks/done/ftp-host-validation.task.md`, full plan at `/home/wojtekrpi/.claude/plans/shiny-petting-hanrahan.md`):

- **PHP `mail()` on this shared host** — tested first per the spike's Phase 0 provisional call, since it carries the higher host-specific uncertainty: deliverability depends on seohost.pl's outbound mail reputation, SPF/DKIM/reverse-DNS configuration, and whether the shared IP has been flagged by spam filters for reasons unrelated to this project — none of which is controllable from this codebase.
- **A hosted form API** (Web3Forms or Formspree) — a well-understood third-party service, deferred as the fallback if `mail()` failed Phase 4's pass criteria.

The Phase 4 live test deployed a minimal PHP probe wired to the Phase 1 walking-skeleton form UI and sent a real test message. Server-side, everything worked as designed: `mail()` returned `true`, server-side validation held, a raw `curl -X POST` bypassing client-side JS was correctly rejected, no PHP errors leaked to the client, and the live PHP version matched what the script targeted. But the user confirmed the delivered test email landed in **spam/junk**, not the inbox — an explicit **FAIL** against Phase 4's stated pass criteria, which required inbox delivery, not merely a successful `mail()` call. This is a deliverability finding, not a code defect: the mechanism (form → PHP → `mail()`) is mechanically sound, but outbound mail reputation on shared hosting isn't something this project can fully control, since the IP/mail infrastructure is shared with other tenants on the same seohost.pl account.

**Decision:**

Route the production contact form through a **hosted form-submission API** — **Web3Forms or Formspree** — instead of PHP `mail()` on this host. Both are free-tier-suitable at this project's traffic level (a handful of real submissions/day) and roughly equivalent for this use case; picking between the two specific vendors is an implementation detail left to Frontend. This ADR settles the *category* (hosted API vs. self-hosted PHP mail), not the specific vendor.

**Consequences:**

- Sidesteps shared-hosting mail reputation entirely — inbox deliverability becomes the API vendor's problem, not something dependent on other tenants sharing this server/IP.
- No PHP code to write, maintain, or secure on the host for the contact form — zero server-side logic in the request path, consistent with the static-first decision (`dtm-architecture.html` §04–§05) and the broader goal of nothing querying MariaDB or running PHP on a page view once migration is complete.
- Reduces Deploy's surface area — no contact-form PHP endpoint to build, harden against injection, or patch over time.
- Introduces a third-party runtime dependency for lead capture: if the chosen vendor's free tier changes terms, rate-limits, or has an outage, the form breaks until Frontend swaps configuration (endpoint URL / access key) — this is a config change, not an architecture change.
- Submitted data transits a third-party service before reaching the recipient inbox — acceptable for a low-sensitivity marketing contact form (name/email/message); worth revisiting only if the form is ever asked to collect more sensitive data.
- Free-tier submission caps exist on both candidates, well above this project's real traffic (a hard constraint already — "tiny traffic" in `CLAUDE.md`) — not a blocking concern.
- Frontend picks Web3Forms vs. Formspree when building the real contact form; no further live validation is required here. Update this ADR only if that pick surfaces a real trade-off worth recording (unlikely).
- PHP `mail()` is not disqualified as a mechanism in general — Phase 4 proved it mechanically sound (validation, header-injection defenses, correct PHP version) — it is out for *this* contact form specifically because of spam deliverability on this host.
