# Spot the Diagnosis

A mobile-first NEET PG diagnosis game for DBMCI's Class of ’27 campaign.
Live at https://class-of-27.vercel.app.

Students solve five clinical clues hangman-style, see their score and college
leaderboard, then a sample NEET PG question for each diagnosis showing how the
exam now tests the same topic.

Built and maintained by Aishwarya Chulaki.

## Where to look

| File | What it covers |
| --- | --- |
| `CLAUDE.md` | Full project context: how the game works, data, integrations, working rules, open items. Start here. |
| `DEPLOY.md` | Hosting, environment variables, database changes (and which SQL must never be re-run), the Google scripts. |
| `docs/DECISIONS.md` | Why things are the way they are, and what was tried or turned down. |
| `src/flow/bank.ts` | The question bank. |
| `supabase/` | Database SQL, run by hand in Supabase's SQL Editor. |
| `sheets/` | Apps Script source for the leads sync and the sales sheet. |

## Run it locally

```bash
npm install
cp .env.example .env.local   # Supabase URL + anon key
npm run dev                  # http://localhost:5173
```

Pushing to `main` deploys to Vercel automatically.
