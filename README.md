# Class of '27 — Campus Challenge

TypeScript rewrite of `class-of-27-game-mvp_5.html`. Vite + React + Supabase.

## Setup

See `SETUP.md` for the full step-by-step. Short version:

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

## Screen flow

The wireframe's screens, in order, driven by `src/flow/steps.ts`:

| # | Step         | Status      | Was in the wireframe as       |
| - | ------------ | ----------- | ----------------------------- |
| 1 | `landing`    | **built**   | landing + college/phone intake |
| 2 | `intake`     | placeholder | name, what you're studying     |
| 3 | `habits`     | placeholder | study-habit likerts            |
| 4 | `subjects`   | placeholder | strongest/weakest, prep status |
| 5 | `transition` | placeholder | "Let's start the game"         |
| 6 | `puzzle`     | placeholder | the word puzzle                |
| 7 | `result`     | placeholder | solved / not solved            |
| 8 | `reveal`     | placeholder | explanation + sample MCQ       |
| 9 | `score`      | placeholder | score + leaderboard            |

Everything collected along the way lands in one `Session` object
(`src/flow/session.ts`). Steps 1–4 show the progress dots.

## Layout

```
src/
  flow/
    steps.ts            screen order, next(), progress dots
    session.ts          the Session object every screen writes into
  components/
    CollegeSelect.tsx   searchable combobox
    StepDots.tsx        progress dots
  screens/
    LandingScreen.tsx   frame 1
    PlaceholderScreen.tsx
  lib/
    supabase.ts         client (null until env vars are set)
    database.types.ts   hand-mirrored schema types
    colleges.ts         college list + fetch
    players.ts          registerPlayer()
    phone.ts            +91 normalisation and validation
  styles/global.css
supabase/
  schema.sql            tables, RLS, register_player()
  seed.sql              college list
```

## Supabase

`colleges` is public-read. `players` has **no select policy**, so the browser's
anon key can insert and update but can never read the roster or anyone's phone
number back. `register_player()` is `security definer` — it validates the
college and phone server-side and returns only the caller's own id.

Until `.env.local` exists, `fetchColleges()` serves the bundled list in
`src/lib/colleges.ts` and `registerPlayer()` writes to localStorage, so the
whole flow can be built before the project is connected.

Keep `src/lib/colleges.ts` and `supabase/seed.sql` in sync.
