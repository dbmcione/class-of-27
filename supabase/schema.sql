-- Class of '27 — Campus Challenge
-- Run in Supabase → SQL Editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Colleges: the dropdown on the landing frame reads from this table.
-- ---------------------------------------------------------------------------
create table if not exists public.colleges (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  city       text,
  is_active  boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists colleges_active_idx
  on public.colleges (is_active, sort_order, name);

-- ---------------------------------------------------------------------------
-- Players: one row per (college, phone). Re-entering the same number on the
-- same college updates the existing row instead of creating a duplicate.
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  college_id   uuid not null references public.colleges (id) on delete restrict,
  phone        text not null,
  name         text,
  stage        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint players_phone_is_10_digits check (phone ~ '^[6-9][0-9]{9}$'),
  constraint players_college_phone_unique unique (college_id, phone)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at
  before update on public.players
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Questionnaire answers: one row per (player, question). question_key matches
-- Question.key in src/flow/questions.ts.
-- ---------------------------------------------------------------------------
create table if not exists public.player_answers (
  player_id    uuid not null references public.players (id) on delete cascade,
  question_key text not null,
  answer       text not null,
  answered_at  timestamptz not null default now(),
  primary key (player_id, question_key)
);

create index if not exists player_answers_question_idx
  on public.player_answers (question_key, answer);

-- ---------------------------------------------------------------------------
-- Puzzles a player has already been served. Used to exclude them from later
-- attempts, so a student replaying gets fresh questions from the bank.
-- puzzle_id matches Puzzle.id in src/flow/bank.ts.
-- ---------------------------------------------------------------------------
create table if not exists public.player_seen_puzzles (
  player_id uuid not null references public.players (id) on delete cascade,
  puzzle_id text not null,
  seen_at   timestamptz not null default now(),
  primary key (player_id, puzzle_id)
);

-- ---------------------------------------------------------------------------
-- One row per puzzle attempted, for scoring and the leaderboard.
-- ---------------------------------------------------------------------------
create table if not exists public.puzzle_results (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.players (id) on delete cascade,
  puzzle_id     text not null,
  solved        boolean not null,
  seconds       integer not null check (seconds >= 0),
  wrong_guesses integer not null check (wrong_guesses between 0 and 5),
  created_at    timestamptz not null default now()
);

create index if not exists puzzle_results_player_idx
  on public.puzzle_results (player_id, created_at desc);

-- ---------------------------------------------------------------------------
-- One row per completed round, for the score screen and the leaderboard.
-- ---------------------------------------------------------------------------
create table if not exists public.round_scores (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.players (id) on delete cascade,
  college_id    uuid not null references public.colleges (id) on delete cascade,
  solved        integer not null check (solved >= 0),
  total         integer not null check (total > 0),
  total_seconds integer not null check (total_seconds >= 0),
  created_at    timestamptz not null default now(),
  constraint round_scores_solved_within_total check (solved <= total)
);

-- Serves the leaderboard ordering directly: most solved first, then fastest.
create index if not exists round_scores_leaderboard_idx
  on public.round_scores (college_id, solved desc, total_seconds asc);

-- ---------------------------------------------------------------------------
-- Table privileges.
-- RLS decides which ROWS are visible; these grants decide whether the role may
-- touch the table at all. Supabase normally sets these by default, but stating
-- them makes the schema self-contained and avoids a "permission denied" that
-- looks like an RLS bug and is not.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.colleges to anon, authenticated;
grant insert, update on public.players to anon, authenticated;
grant insert, update on public.player_answers to anon, authenticated;
grant select, insert, delete on public.player_seen_puzzles to anon, authenticated;
grant insert on public.puzzle_results to anon, authenticated;
grant insert on public.round_scores to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The app uses the anon key from the browser, so policies are the real
-- access control. Anyone may read the college list and register themselves;
-- nobody may read other players' phone numbers.
-- ---------------------------------------------------------------------------
alter table public.colleges       enable row level security;
alter table public.players        enable row level security;
alter table public.player_answers enable row level security;
alter table public.player_seen_puzzles enable row level security;
alter table public.puzzle_results     enable row level security;
alter table public.round_scores       enable row level security;

drop policy if exists "colleges are publicly readable" on public.colleges;
create policy "colleges are publicly readable"
  on public.colleges for select
  to anon, authenticated
  using (is_active);

drop policy if exists "anyone may register as a player" on public.players;
create policy "anyone may register as a player"
  on public.players for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone may update their own registration" on public.players;
create policy "anyone may update their own registration"
  on public.players for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "anyone may record their answers" on public.player_answers;
create policy "anyone may record their answers"
  on public.player_answers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone may revise their answers" on public.player_answers;
create policy "anyone may revise their answers"
  on public.player_answers for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "anyone may record puzzles served" on public.player_seen_puzzles;
create policy "anyone may record puzzles served"
  on public.player_seen_puzzles for insert
  to anon, authenticated
  with check (true);

-- Readable so a returning student's already-seen puzzles can be excluded.
drop policy if exists "seen puzzles are readable" on public.player_seen_puzzles;
create policy "seen puzzles are readable"
  on public.player_seen_puzzles for select
  to anon, authenticated
  using (true);

drop policy if exists "seen puzzles may be cleared" on public.player_seen_puzzles;
create policy "seen puzzles may be cleared"
  on public.player_seen_puzzles for delete
  to anon, authenticated
  using (true);

drop policy if exists "anyone may record a round score" on public.round_scores;
create policy "anyone may record a round score"
  on public.round_scores for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone may record a result" on public.puzzle_results;
create policy "anyone may record a result"
  on public.puzzle_results for insert
  to anon, authenticated
  with check (true);

-- No select policy on players or player_answers: the anon key cannot read the
-- roster, anyone's phone number, or anyone's answers back. player_seen_puzzles
-- is readable but holds no personal data beyond puzzle ids.
-- register_player() below is security definer, so it can still upsert and
-- return just the caller's own row.

-- ---------------------------------------------------------------------------
-- register_player: the single call the landing frame makes on "Start".
-- Upserts on (college_id, phone) and returns the player id.
-- ---------------------------------------------------------------------------
create or replace function public.register_player(
  p_college_id uuid,
  p_phone      text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  if not exists (
    select 1 from public.colleges
    where id = p_college_id and is_active
  ) then
    raise exception 'unknown_college' using errcode = 'P0002';
  end if;

  if p_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  insert into public.players (college_id, phone)
  values (p_college_id, p_phone)
  on conflict (college_id, phone)
    do update set updated_at = now()
  returning id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.register_player(uuid, text) from public;
grant execute on function public.register_player(uuid, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- college_leaderboard: the board shown on the score screen.
--
-- security definer so it can read players and round_scores, which the anon
-- key cannot select directly. It returns the player's name but never their
-- phone number.
--
-- NOTE: superseded by supabase/migration-full-names.sql, which switched this
-- from a first name to the full name at the product owner's request.
--
-- One row per player: their best round, ranked by most solved then fastest.
-- ---------------------------------------------------------------------------
create or replace function public.college_leaderboard(
  p_college_id uuid,
  p_limit      integer default 10
)
returns table (
  rank          bigint,
  player_id     uuid,
  display_name  text,
  solved        integer,
  total         integer,
  total_seconds integer
)
language sql
security definer
set search_path = public
as $$
  with best as (
    select distinct on (rs.player_id)
      rs.player_id,
      rs.solved,
      rs.total,
      rs.total_seconds
    from public.round_scores rs
    where rs.college_id = p_college_id
    order by rs.player_id, rs.solved desc, rs.total_seconds asc
  )
  select
    row_number() over (order by b.solved desc, b.total_seconds asc) as rank,
    b.player_id,
    coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Anonymous') as display_name,
    b.solved,
    b.total,
    b.total_seconds
  from best b
  join public.players p on p.id = b.player_id
  order by b.solved desc, b.total_seconds asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.college_leaderboard(uuid, integer) from public;
grant execute on function public.college_leaderboard(uuid, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- save_intake: writes the Quick Intro in one call.
--
-- Why an RPC rather than a client-side upsert: PostgREST's upsert becomes
-- INSERT ... ON CONFLICT, and Postgres requires a SELECT policy on the target
-- table to read the conflicting row. player_answers deliberately has no SELECT
-- policy — the anon key must never be able to read anyone's answers back.
-- Running the upsert inside a security definer function keeps the write
-- working while the table stays unreadable.
-- ---------------------------------------------------------------------------
create or replace function public.save_intake(
  p_player_id uuid,
  p_name      text,
  p_stage     text,
  p_answers   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.players where id = p_player_id) then
    raise exception 'unknown_player' using errcode = 'P0002';
  end if;

  update public.players
     set name  = nullif(btrim(p_name), ''),
         stage = nullif(btrim(p_stage), '')
   where id = p_player_id;

  if p_answers is not null and jsonb_typeof(p_answers) = 'object' then
    insert into public.player_answers (player_id, question_key, answer)
    select p_player_id, key, value
      from jsonb_each_text(p_answers)
    on conflict (player_id, question_key)
      do update set answer = excluded.answer, answered_at = now();
  end if;
end;
$$;

revoke all on function public.save_intake(uuid, text, text, jsonb) from public;
grant execute on function public.save_intake(uuid, text, text, jsonb) to anon, authenticated, service_role;

-- The client now goes through save_intake(), so anon needs no direct write
-- access to the answers table at all.
revoke insert, update on public.player_answers from anon, authenticated;
