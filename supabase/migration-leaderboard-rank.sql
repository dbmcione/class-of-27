-- ---------------------------------------------------------------------------
-- Top five, plus the student's own place however far down it is.
--
-- Two changes:
--   1. college_leaderboard can return more than 50, so the full board in the
--      popup is the actual board rather than the first fifty of it.
--   2. college_rank answers "where did I come" on its own. Working it out by
--      searching the fetched list only works while the student is inside the
--      window fetched, which is exactly the case this feature exists for.
--
-- Safe to re-run.
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
    coalesce(nullif(btrim(p.name), ''), 'Anonymous') as display_name,
    b.solved,
    b.total,
    b.total_seconds
  from best b
  join public.players p on p.id = b.player_id
  order by b.solved desc, b.total_seconds asc
  -- Was 50. A board of 400 students that stopped at 50 would quietly tell
  -- everyone below it that they were not on the board at all.
  limit greatest(1, least(coalesce(p_limit, 10), 1000));
$$;

revoke all on function public.college_leaderboard(uuid, integer) from public;
grant execute on function public.college_leaderboard(uuid, integer)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- college_rank: one student's place, counted over the whole college.
--
-- Returns no row for a student who has not finished a round, which is the
-- honest answer: they have no place yet.
-- ---------------------------------------------------------------------------
create or replace function public.college_rank(
  p_college_id uuid,
  p_player_id  uuid
)
returns table (
  rank          bigint,
  player_id     uuid,
  display_name  text,
  solved        integer,
  total         integer,
  total_seconds integer,
  board_size    bigint
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
  ),
  ranked as (
    select
      row_number() over (order by b.solved desc, b.total_seconds asc) as rank,
      count(*) over () as board_size,
      b.*
    from best b
  )
  select
    r.rank,
    r.player_id,
    coalesce(nullif(btrim(p.name), ''), 'Anonymous') as display_name,
    r.solved,
    r.total,
    r.total_seconds,
    r.board_size
  from ranked r
  join public.players p on p.id = r.player_id
  where r.player_id = p_player_id;
$$;

revoke all on function public.college_rank(uuid, uuid) from public;
grant execute on function public.college_rank(uuid, uuid)
  to anon, authenticated, service_role;
