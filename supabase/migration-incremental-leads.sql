-- ---------------------------------------------------------------------------
-- lead_export_since: the lead sheet's sync, reading only what changed.
--
-- The Apps Script used to read the whole lead_export view on every run and
-- throw away everyone already in the sheet. Run every minute, that is every
-- student downloaded 1,440 times a day, which on the free plan uses up the
-- month's data transfer at around 1,500 students.
--
-- This returns only students who have saved a round since p_since. The
-- columns are lead_export's, in the same order, plus last_round_ms: the
-- script's bookmark for where to start next time. The script removes it
-- before writing, so the sheet's columns do not change.
--
-- "Saved a round since", not "first played since": a student already in the
-- sheet who plays again comes back too, and the script skips them on phone,
-- exactly as it always has. That is deliberate. It means no student can be
-- missed by being judged on the wrong timestamp, whatever order things land.
--
-- lead_export itself is left as it was, for anything else that reads it.
--
-- Read with the SERVICE ROLE key only, like lead_export.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- Both queries here, and lead_export, look up a player's best round. Without
-- this, each lookup reads the whole round_scores table.
create index if not exists round_scores_player_best_idx
  on public.round_scores (player_id, solved desc, total_seconds asc);

-- Finds the rounds saved since the bookmark without reading the rest.
create index if not exists round_scores_created_at_idx
  on public.round_scores (created_at);

create or replace function public.lead_export_since(p_since timestamptz)
returns table (
  phone         text,
  name          text,
  score         text,
  answers_code  text,
  last_round_ms bigint
)
language sql
stable
set search_path = public
as $$
  with recent as (
    select player_id, max(created_at) as last_round_at
    from public.round_scores
    where created_at > p_since
    group by player_id
  )
  select
    p.phone,
    p.name,
    -- Their best round, the same one the college leaderboard shows them.
    rs.solved || '/' || rs.total as score,
    rs.code                      as answers_code,
    -- Milliseconds, so the script can do arithmetic on it without parsing a
    -- timestamp string.
    floor(extract(epoch from r.last_round_at) * 1000)::bigint as last_round_ms
  from recent r
  join public.players p on p.id = r.player_id
  join lateral (
    select solved, total, code
    from public.round_scores
    where player_id = p.id
    order by solved desc, total_seconds asc
    limit 1
  ) rs on true
  where p.name is not null;
$$;

revoke all on function public.lead_export_since(timestamptz) from public, anon, authenticated;
grant execute on function public.lead_export_since(timestamptz) to service_role;
