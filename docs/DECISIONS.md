# Decisions and history

Why things are the way they are. Newest first within each section. Kept so
that anyone picking the project up doesn't re-suggest something already
tried or turned down.

## Product decisions

- **Sales sheet subscription columns (Oct 2026).** "Currently subscribed?"
  and "Ever subscribed?" read two of the business's own sheets, matched on
  phone only. Payments: Live 360 plans only, refunded ("Processed") rows
  excluded, plan runs from the payment date for "Plan Duration in Months".
  F2F Coupon Master: every row is Live 360, counts once "D1 Activation Date"
  is filled, runs for "Plan duration" months; the sheet's own Start/End
  dates are the coupon's, not the plan's. If a source can't be read, keep
  yesterday's values rather than half-update.
- **Sales dashboard (Oct 2026).** A Dashboard tab of quick facts, written by
  the daily script as plain values. "Warm leads" (renamed from "hot") =
  Intern or Post-Intern who said "Sounds like me" to 2+ statements. "How
  they scored" was removed at her request. "Last 7 days" means exactly
  7×24 hours. She restyled the tab, so the script only styles it on creation.
- **Sales sheet order (Oct 2026).** By first play, oldest first, not by
  phone. Not-yet-played students go last. The sales team should use filter
  views to sort differently, since each refresh restores the order.
- **Course-link tracking (Oct 2026).** Taps recorded per student in
  Supabase, alongside dbmci.one's UTM counts. The link was changed to
  dbmci.one/class-of-27 with UTMs on 30 Sep; earlier clicks can't be told
  apart.
- **Answers-page intro line (Oct 2026).** "Tap any card to view the sample
  NEET PG question." on both answers pages; the score was dropped from that
  line.
- **Campaign links (30 Sep 2026).** Named `?ref=` codes for marketing and the
  faculty's Instagram. First version used readable codes; she rejected them
  as "too obvious", so codes are random and the label lives in Supabase.
- **One scorecard per student (29 Sep 2026).** Cards exist only for the
  WhatsApp message, which is sent once, so only the first round's card is
  stored, and the lead sheet uses the first round. Previously every round
  uploaded one.
- **College picker (Sep 2026).** Started as a type-3-letters search. On
  phones it repeatedly broke (scroll selecting, double and triple taps,
  keyboard swallowing taps). Fixed once reproduced (picking refocused the
  field, which reopened the list), then replaced at her boss's request with
  tap-only cascading dropdowns: India/International → state → college.
  International sorted by country.
- **First round always includes Primary Hyperaldosteronism**, shuffled in;
  later rounds fully shuffled, no repeats until the bank is exhausted.
- **"Challenge a friend" on the start screen only for replays.**
- **Zoom locked on mobile.**
- **Returning students skip the phone page** (number remembered on the
  device) and can resume a round after closing the tab.

## Infrastructure decisions

- **Request cuts (Oct 2026).** Finishing a round is one database call
  (save + board + rank + first-round flag), sign-up is one call (register +
  intro). Both fall back to the older calls if the newer SQL is missing. The
  college list still loads from Supabase: she chose not to bundle it, so
  college fixes don't need a deploy.
- **Lead sync (Sep–Oct 2026).** Originally downloaded every student each
  run and was found running every minute, which would have used up the free
  Supabase data allowance at ~1,500 students. Now incremental (bookmark +
  10-minute overlap + lock) and every 5 minutes, since Make only polls every
  few minutes anyway. Supabase's own PgBouncer health checks are a fixed
  share of log volume we can't control.
- **Hosting.** GitHub Pages first, then Vercel. Vercel's Hobby plan forbids
  commercial use (a paid employee building a site that promotes a paid
  course counts, even though the game is free); her boss initially
  disagreed, then Pro was bought on academics@ and the project is being
  transferred. Transfer, never recreate, to keep the address.
- **Supabase plan.** Free for now; her boss's call is to upgrade when
  needed. Watch log ingestion and egress on the Usage page.
- **Account ownership.** GitHub, Supabase and Vercel moved to
  academics@dbmci.one. The Google sheets and both Apps Script projects stay
  on her own account by her decision (cross-organisation ownership transfer
  isn't possible; copies would need new triggers, settings and a new sheet
  for Make).
- **Answers are in the site's code** and scores are reported by the browser.
  Making the server check every guess was offered and declined: it would
  slow every tap, and the leaderboard isn't tied to prizes.

## Things she corrected or turned down

- A crop of the osteoid osteoma image ("horrific"); use her images as given.
- Share copy written by Claude; use hers verbatim.
- Guess-fixes for the college picker; reproduce first.
- Full social-media posts; she wanted key points only.
- Generated documents (Notion, files); she wants paste-ready text.
- "WhatsApp on iPhone drops the share caption": not true in her testing.
- "The lead sync runs every 15 minutes": it was every minute (she checked).
- "PgBouncer is the main log cost": overstated; the game's own requests
  dominated on busy days.

## Numbers seen (for scale)

- 5 Oct 2026: 803 students had played, 1,405 rounds, 801 scorecards
  (~111 KB each), database 33 MB, egress 0.38 GB, log ingestion 0.69 GB of
  the free 1 GB, after ~900 plays in two days.
- Expected total: under 10,000 students.
