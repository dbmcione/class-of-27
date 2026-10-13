# Deploying and running Spot the Diagnosis

How the game is hosted, how changes go live, and where every moving part lives.
Maintained by Aishwarya Chulaki.

---

## Where everything lives

| Piece | Where | Owner |
| --- | --- | --- |
| Code | GitHub, `dbmcione/class-of-27`, branch `main` | academics@dbmci.one |
| Hosting | Vercel, project `class-of-27`, on the academics@ **Pro** team | academics@dbmci.one |
| Live address | https://class-of-27.vercel.app | — |
| Database, scorecard images | Supabase project `vekwrbraxdulapbjugwl` | academics@dbmci.one |
| Leads sync (every 5 min) | Apps Script attached to the "Spot The Diagnosis - Whatsapp Automation" sheet | Aishwarya |
| Sales sheet (daily, ~7am IST) | Standalone Apps Script "Spot The Diagnosis - Sales" on script.google.com | Aishwarya |
| WhatsApp messages | Make scenario watching the leads sheet | Marketing |

There is no custom domain. The address is the Vercel one, and every link
already sent out (WhatsApp answers links, campaign links, shared links) points
at it, so it must not change: if the project ever moves again, **transfer** it
in Vercel rather than recreating it.

---

## How a change goes live

1. Commit to `main` and push to GitHub.
2. Vercel builds and publishes it automatically, usually within a minute.
   Watch it under the project's **Deployments** tab.

Build settings are in `vercel.json`: `npm run build`, serve `dist`, and route
every address to the app, which is what makes `/a/<code>` answers links work.

**To undo a bad release:** Vercel → Deployments → pick the last good one →
**Promote to Production** (or Instant Rollback). Then fix the code and push.

---

## Environment variables

Set in Vercel → Settings → Environment Variables, and locally in `.env.local`
(copy `.env.example`; it is gitignored):

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://vekwrbraxdulapbjugwl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → the **anon / publishable** key |

The anon key ends up inside the public site by design; the database's
row-level security is what protects the data. **Never** put the
`service_role` / secret key here. It bypasses every rule.

Changing a variable in Vercel only takes effect on the next deploy
(Deployments → latest → Redeploy).

---

## Running it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # the same build Vercel runs; must pass before pushing
```

Without `.env.local` the app falls back to the browser's own storage, so it
runs but nothing reaches the database.

---

## Database changes

Database changes are SQL files in `supabase/`, run **by hand** in Supabase →
SQL Editor. Nothing runs them automatically.

### On the live database: only run the script you were asked to run

Check the project name at the top of the SQL Editor first. Then run **only
the new script** for the change at hand. Do not re-run older scripts on live
data. Several of them would damage it:

| Script | What re-running it on live data would do |
| --- | --- |
| `migration-full-names.sql` | **Deletes every student.** It ends with an erase. |
| `seed.sql` | Rewrites the college list, undoing corrections made by hand since (e.g. Manipal Malaysia, Lincoln/Uluberia). |
| `schema.sql` | Puts back the original sign-up function, which **breaks every sign-up**. |
| `migration-returning-players.sql` | Puts back an older sign-up function and removes duplicate players. |
| `migration-referrals.sql` | Puts back the sign-up function without campaign links. |
| `clear-test-players.sql`, `demo-leaderboard.sql` | Test helpers. Delete or overwrite players. |

### Building a fresh copy from nothing

Only for an empty project (a test copy, or a rebuild). Run in this order;
this sequence has been replayed end to end and works:

1. `schema.sql`
2. `seed.sql`
3. `migration-returning-players.sql`
4. `migration-full-names.sql` (its erase is harmless on an empty database)
5. `migration-play-links.sql`
6. `migration-leaderboard-rank.sql`
7. `migration-referrals.sql`
8. Create the Storage bucket `scorecards` (public, JPEG only, 2 MB limit), then `migration-scorecards.sql`
9. `migration-incremental-leads.sql`
10. `migration-first-round-cards.sql`
11. `migration-campaign-links.sql`
12. `migration-fewer-requests.sql`
13. `migration-course-clicks.sql`
14. `migration-sales-export.sql`

`lead-export.sql` is an older version of the lead view and is not needed.

---

## The Google side

Both scripts read Supabase with the **service_role** key, kept in each
script's **Script Properties**, never in a sheet, email or chat.

**Leads sync** (`sheets/refresh-leads.gs`), attached to the WhatsApp automation sheet.
- Properties: `SUPABASE_URL`, `SUPABASE_KEY`, `GAME_URL` (`https://class-of-27.vercel.app`).
- Trigger: `refreshLeads`, every 5 minutes. Only adds students who played
  since its last run; the `LEADS_SYNCED_UNTIL_MS` property is its bookmark.
- The sheet is append-only: Make treats each new row as "send a message".
  Never move or rewrite existing rows.
- Anyone who can edit this sheet can open its script and see the key, so
  keep editor access tight.

**Sales sheet** (`sheets/sales-sheet.gs`), a standalone project on
script.google.com so the sales team never sees the key.
- Properties: `SUPABASE_URL`, `SUPABASE_KEY`, `SALES_SHEET_ID`.
- Trigger: `refreshSalesSheet`, daily at about 7am (project time zone set to India).
- Rows are matched on phone, so the sales team's own columns and notes are kept.

To change either script: paste the new code from this repo, **save**, and
only re-run `installTrigger` if the schedule itself changed.

---

## After any deploy, check

- The live site loads and the college dropdowns fill (that proves Supabase is reachable).
- For database changes: play one round on a test number, check the score
  screen shows the college board, then delete the test number
  (`delete from players where phone = '…';` and its scorecard in Storage).

---

## Not used any more

The site was first hosted on GitHub Pages. That copy
(`dbmcione.github.io/class-of-27`) is out of date and not connected to the
current database. If it is still published, turn it off: GitHub → the repo →
Settings → Pages → Source: **None**.
