# Connecting Supabase

Node and the app are already running. This is the remaining piece.

---

## 1. Create the project

1. **https://supabase.com** → sign in with GitHub
2. **New project**
   - Name: `class-of-27`
   - Database password: generate one and **save it in your password manager**
   - Region: **South Asia (Mumbai)** — closest to your students
3. Wait ~2 minutes for provisioning

---

## 2. Create the tables

Left sidebar → **SQL Editor** → **New query**.

1. Open `~/class-of-27/supabase/schema.sql`, copy **all** of it, paste, **Run**
2. New query. Open `~/class-of-27/supabase/seed.sql`, copy all, paste, **Run**

**Check:** left sidebar → **Table Editor**. You should see six tables:

| table | should contain |
| --- | --- |
| `colleges` | 12 rows |
| `players` | empty |
| `player_answers` | empty |
| `player_seen_puzzles` | empty |
| `puzzle_results` | empty |
| `round_scores` | empty |

If the SQL errors, paste the error to me verbatim — this schema has never been run against a real database.

---

## 3. Connect the app

Left sidebar → **Project Settings** → **API**. Copy two values:

- **Project URL** — `https://xxxxx.supabase.co`
- **Project API keys → `anon` `public`** — a long string starting `eyJ`

> Take the **`anon`** key, not `service_role`. The `service_role` key bypasses
> every security policy in the schema. It must never go in this file, never
> reach a browser, and never be pasted into a chat.

Create the env file:

```bash
cp ~/class-of-27/.env.example ~/class-of-27/.env.local && open -e ~/class-of-27/.env.local
```

Fill it in so it reads:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Save, then **restart the dev server** — Ctrl-C, then `npm run dev`. Vite only
reads env files at startup.

---

## 4. Check it worked

Play one full round, then in Supabase → **Table Editor**:

- `players` — one row, your phone, name and year
- `player_answers` — 7 rows
- `player_seen_puzzles` — 5 rows
- `round_scores` — 1 row
- `puzzle_results` — 5 rows

If any table is empty, open the browser console (Cmd-Option-J) and send me
the red errors.

---

## Notes

- The `anon` key is **meant** to be public — it ships inside the JavaScript
  bundle. The security is the RLS policies in `schema.sql`, not key secrecy.
- `.env.local` is gitignored. Keep it that way.
- Until `.env.local` exists the app runs on localStorage, so everything works
  but nothing is shared between devices.
