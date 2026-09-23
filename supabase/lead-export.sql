-- ---------------------------------------------------------------------------
-- lead_export: what Make copies into the Google Sheet.
--
-- Three columns: phone, name, score. Phone is unique on players, so it is
-- also the key Make should match a sheet row on.
--
-- Read with the SERVICE ROLE key, never the anon key. The anon key ships
-- inside the browser bundle and is therefore public; this view carries every
-- student's name and phone number, so anon is explicitly revoked below.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- A replace cannot drop columns, so an earlier wider version has to go first.
drop view if exists public.lead_export;

create view public.lead_export as
select
  p.phone,
  p.name,
  -- Their best round, the same one the college leaderboard shows them.
  rs.solved || '/' || rs.total as score
from public.players p
join lateral (
  select solved, total
  from public.round_scores
  where player_id = p.id
  order by solved desc, total_seconds asc
  limit 1
) rs on true
where p.name is not null;

revoke all on public.lead_export from public, anon, authenticated;
grant select on public.lead_export to service_role;
