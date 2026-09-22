-- =========================================================================
-- 1. Show full names on the leaderboard
--
-- Both functions returned a first name only. That also meant a returning
-- player's scorecard showed "Aishwarya" while a new player's showed
-- "Aishwarya Chulaki" — the same student, two different names. Returning the
-- stored name from both makes them consistent.
--
-- The app still shortens to a first name where a greeting reads better
-- ("Ready, Aishwarya?"); that is now a display choice, not a data limit.
-- =========================================================================

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
    coalesce(nullif(btrim(p.name), ''), 'Anonymous') as display_name,
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

create or replace function public.lookup_player(p_phone text)
returns table (
  player_id       uuid,
  display_name    text,
  college_id      uuid,
  college_name    text,
  intake_complete boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(nullif(btrim(p.name), ''), 'Doctor-to-be'),
    p.college_id,
    c.name,
    (p.name is not null
       and p.stage is not null
       and exists (select 1 from public.player_answers a where a.player_id = p.id))
  from public.players p
  join public.colleges c on c.id = p.college_id
  where p.phone = p_phone
  limit 1;
$$;

revoke all on function public.lookup_player(text) from public;
grant execute on function public.lookup_player(text) to anon, authenticated, service_role;

-- =========================================================================
-- 2. Erase every player, for a clean start
--
-- Cascades to player_answers, player_seen_puzzles, puzzle_results and
-- round_scores. Colleges and the puzzle bank are untouched.
--
-- THERE IS NO UNDO.
-- =========================================================================

select 'before' as stage,
       (select count(*) from public.players)             as players,
       (select count(*) from public.player_answers)      as answers,
       (select count(*) from public.player_seen_puzzles) as seen,
       (select count(*) from public.round_scores)        as rounds,
       (select count(*) from public.puzzle_results)      as results,
       (select count(*) from public.colleges)            as colleges;

delete from public.players;

select 'after' as stage,
       (select count(*) from public.players)             as players,
       (select count(*) from public.player_answers)      as answers,
       (select count(*) from public.player_seen_puzzles) as seen,
       (select count(*) from public.round_scores)        as rounds,
       (select count(*) from public.puzzle_results)      as results,
       (select count(*) from public.colleges)            as colleges;
