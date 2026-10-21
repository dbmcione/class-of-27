# Spot the Diagnosis — project context

Read this first. It is everything a new session needs to pick the project up
where it was left. Longer history and the reasons behind decisions are in
`docs/DECISIONS.md`; hosting and database operations are in `DEPLOY.md`.

## What it is

A mobile-first NEET PG hangman game for DBMCI's **Class of ’27** campaign.
Students guess a diagnosis letter by letter from a clinical clue, five per
round, then see their score, their college leaderboard, and a sample NEET PG
question per diagnosis showing how the exam now tests the same topic.
It collects leads (phone, name, college, year, three study-habit answers).

- Live: https://class-of-27.vercel.app
- Built and maintained by **Aishwarya Chulaki** (a PM, not an engineer; she
  built it end to end with Claude Code and owns every decision).
- Code: GitHub `dbmcione/class-of-27`, branch `main`. Hosting: Vercel.
  Database and files: Supabase project `vekwrbraxdulapbjugwl`. Both accounts
  are owned by academics@dbmci.one.

## How to work with Aishwarya

These are standing rules she has set. Follow them without being asked.

- **Copy needs approval.** Never write or change student-facing text without
  drafting it first and getting her OK. Never invent share or message copy:
  reuse her wording exactly ("please do not … create your own").
- **"Class of ’27"** with a curly apostrophe. Brand in the share caption is
  "DBMCI One".
- **Reproduce before fixing.** No guess-fixes. Guessing at the college
  dropdown bug made it worse three times; reproducing it found the cause.
- **Test thoroughly, then say exactly what was and wasn't verified.**
- **Don't touch her images** (no crops or edits); use the files she supplies.
- **Don't create real database records without asking.** The site's public
  key cannot read student data anyway, by design.
- **She runs all SQL herself** in Supabase's SQL Editor, and pastes Apps
  Script changes herself. Tell her which file, in what order, and remind her
  to check she is in the game's Supabase project (she once ran SQL in the
  wrong one).
- **Explain plainly**, with numbered steps for anything in a dashboard.
- **When she asks for text to paste** (forms, Slack, email, docs), give plain
  text in the reply; don't generate documents or files unless asked.
- **Commit and push to `main` after each change**; Vercel deploys it.
  Never stage `supabase/migration-referrals.sql` (her local edit),
  `tsconfig.tsbuildinfo` or `.claude/`.

## Stack and layout

React 18 + TypeScript + Vite 5, plain CSS (`src/styles/global.css`), Fredoka
font bundled. Supabase (Postgres, row-level security, Storage) via
`@supabase/supabase-js`. Google Apps Script + Sheets for exports; Make sends
WhatsApp messages.

```
src/
  App.tsx              screen state machine, auto-login, round drawing/resume
  flow/
    bank.ts            THE QUESTION BANK (24 puzzles), QUESTIONS_PER_ROUND=5, MAX_WRONG=5
    round.ts           round selection: no repeats until all seen; first round pins
                       'primary-hyperaldosteronism' at a random position
    puzzle.ts          hangman rules (first letter of each word given; digits shown)
    questions.ts       the 3 Quick Intro statements + study stages
    branding.ts, steps.ts, session.ts
  screens/             Landing, Intake (Quick Intro), Transition, Puzzle, Score,
                       Reveal (answers after a round), PlayAnswers (/a/<code>)
  components/          SelectField (tap-only dropdown), Keyboard, Leaderboard(+Modal),
                       RevealCard, CourseNote (Class of ’27 link), QuestionMatrix
  lib/                 supabase client, players (lookup/register), scores (save +
                       board), seen, cards (scorecard upload), share, scorecard
                       (canvas image), referral (?ref=), courseClicks, colleges,
                       lastPhone + activeRound (browser storage), phone
supabase/              SQL files, run by hand (see DEPLOY.md before running ANY)
sheets/                refresh-leads.gs, sales-sheet.gs (Apps Script source)
```

## How the game behaves

- **Landing:** phone number (10-digit Indian mobile, 6–9 first). A
  remembered number skips straight in.
- **Quick Intro (first visit):** college via three tap-only dropdowns
  (India/International → state → college; international sorted by country),
  name, year of study, three "Sounds like me / Not really" statements.
- **Round:** 5 puzzles, 5 wrong letters each, one clock for the round,
  progress saved in the browser so a closed tab resumes mid-round.
- **Score screen:** score, college board (each student's best round; most
  solved, then fastest), top 5 plus own row, full board in a popup,
  scorecard image, "Challenge a friend" share, then "View Sample MCQs".
- **Answers page:** per puzzle: definition, sample NEET PG MCQ (image where
  there is one, correct option marked), "What made it tough", then the
  Class of ’27 note and the tracked course link.
- **Shared answers link** `/a/<code>`: first name and score only.

## Data (Supabase)

Everything hangs off `players` (one row per phone; deleting a player cascades
to all their data). Tables: `colleges`, `players`, `player_answers`,
`player_seen_puzzles`, `round_scores` (one per finished round, with its
answers code), `puzzle_results`, `campaign_links`, `course_link_clicks`.
Storage bucket `scorecards`: one image per student (first round only).

Leads and leaderboards are computed, not stored: `lead_export_since(...)`
(sheet sync), `sales_export` (sales sheet), `college_leaderboard`,
`college_rank`, `save_round_and_board`, `register_with_intake`. Summaries:
`referral_summary`, `top_sharers`, `campaign_summary`, `course_click_summary`.

The browser only ever uses the public anon key; all writes go through
security-definer functions; lead/sales data needs the service-role key,
which lives only in the Apps Script projects' Script Properties.

## Content rules

- Source of truth: her "Spot The Diagnosis - Questions" spreadsheet plus an
  image folder named by diagnosis. Correct option = green cell fill.
- Copy fields verbatim; only fix obvious paste slips (stray "D) ", text
  pasted twice) and tell her each one. Flag anything doubtful (e.g. a hint
  copied from another row) rather than guessing.
- Puzzle ids are permanent: renaming or removing one breaks seen-history,
  old answers links and in-progress rounds. Add, don't rename.
- Only A–Z are guessable; other characters show automatically.

## Integrations

- **Leads sheet** "Spot The Diagnosis - Whatsapp Automation", script
  "Spot The Diagnosis - Student Data" (`sheets/refresh-leads.gs`), every
  5 minutes, append-only, bookmark-based incremental sync. Make (owned by
  marketing) watches it and sends the WhatsApp; writes "Sent" back.
- **Sales sheet**, standalone script "Spot The Diagnosis - Sales"
  (`sheets/sales-sheet.gs`), daily ~7am IST. Students tab (rows matched on
  phone, sorted by first play, sales team's own columns preserved),
  Dashboard tab (script styles it only on creation; she restyled it), and
  "Currently subscribed?" / "Ever subscribed?" from two read-only sources:
  the payments sheet (Live 360 rows not refunded; payment date + months) and
  the "F2F Coupon Master" tab (activated coupons; activation date + months).
  Sources are a list at `SUBSCRIPTION_SOURCES`.
- **Campaign links:** `?ref=<code>`; codes are random on purpose and listed
  in the `campaign_links` table (marketing team, faculty Instagram). Add
  more there, no deploy needed. Codes must not be 8 characters long
  (that is the length of round codes).
- **Course link** (CourseNote): dbmci.one/class-of-27 with UTM tags
  (`std_game` / `explore_button` / `live27`); taps also recorded per
  student in `course_link_clicks`.
- No web analytics on the site.

## Testing that works here

- Site: `npm run build` must pass; preview with the `class-of-27-dev` launch
  config (port 5173). The browser pane can't see Supabase-js requests in its
  network log; spy on `supabase.rpc` instead.
- SQL: replay `supabase/` files in the order listed in DEPLOY.md on PGlite
  (`@electric-sql/pglite`, installed in a scratch folder, not the project),
  stripping the `create extension pgcrypto` line, with stub
  `anon/authenticated/service_role` roles and a stub `storage.objects` table.
- Apps Script: run the `.gs` file in Node's `vm` with mocked
  SpreadsheetApp / UrlFetchApp / PropertiesService. Create Date values
  inside the vm context, or `instanceof Date` fails.

## Open items (as of 21 Oct 2026)

Check the state of each before acting; some may be done.

1. **Course-click SQL:** `migration-course-clicks.sql` then re-run
   `migration-sales-export.sql`. As of 16 Oct the table did not exist; check
   (`course_link_clicks` should exist; `course_click_summary` should count).
2. **Privacy hardening of returning-player sign-in, approved but on hold.**
   Her chosen design: on a device the game doesn't recognise, a returning
   student confirms their college before continuing, and the sign-in lookup
   stops returning profile details. Also offered, not yet approved:
   server-side sanity checks when a round is saved. Ask her before building.
3. **Vercel move:** she bought Pro on academics@; confirm the project was
   transferred (not recreated), GitHub is connected in the new team, env vars
   are present, and a push deploys. Then remove the old login from the team.
4. **Supabase plan:** still Free. Upgrade (on the academics@ org) when any
   limit nears 70–80%; log ingestion was closest.
5. **Leads script** is attached to its sheet, so sheet editors can read its
   key; consider moving it to a standalone project like the sales script.
6. **Offered, not requested:** retry once on transient Google errors in the
   leads script; sort not-yet-played students by sign-up date in the sales
   sheet; Make webhook instead of polling; Vercel Web Analytics; logging
   "Challenge a friend" taps.
7. **Content:** the questions sheet still has two Follicular Lymphoma paste
   slips (fixed in the game); faculty to check the AML item (image looks like
   APL, key says NPM1).
8. **Data:** Lincoln University & Sanjiban Hospital, Uluberia should be
   India / West Bengal (SQL given to her; check it was run).
9. **Old GitHub Pages copy:** unpublish if still live.
10. **Repo visibility:** the GitHub repo is public; she was advised to make
    it private.
