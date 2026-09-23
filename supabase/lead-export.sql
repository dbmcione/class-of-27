-- ---------------------------------------------------------------------------
-- lead_export: one flat row per student, for Make to copy into Google Sheets.
--
-- The app's data is spread over five tables. Nothing downstream should have to
-- know that, so this view does the joining and the picking and hands over a
-- shape that maps one-to-one onto the sheet's columns.
--
-- Read by Make with the SERVICE ROLE key, never the anon key. The anon key
-- ships inside the browser bundle and is therefore public; this view carries
-- every student's name and phone number, so anon and authenticated are
-- explicitly revoked below.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

create or replace view public.lead_export as
with best_round as (
  -- Highest score, ties broken by the faster time. One row per player.
  select distinct on (rs.player_id)
    rs.player_id,
    rs.solved,
    rs.total,
    rs.total_seconds,
    rs.created_at
  from public.round_scores rs
  order by rs.player_id, rs.solved desc, rs.total_seconds asc, rs.created_at asc
),
last_round as (
  select distinct on (rs.player_id)
    rs.player_id,
    rs.solved,
    rs.total,
    rs.total_seconds,
    rs.created_at
  from public.round_scores rs
  order by rs.player_id, rs.created_at desc
),
round_counts as (
  select player_id, count(*)::int as rounds_played
  from public.round_scores
  group by player_id
)
select
  -- Key. Use this to match a sheet row rather than the phone, which a student
  -- could in principle re-register under a different name.
  p.id                                             as player_id,

  p.phone                                          as phone,
  '91' || p.phone                                  as phone_with_country_code,
  p.name                                           as full_name,
  -- First name only: "Hi Ayesha" reads better than the full name in a message.
  nullif(split_part(coalesce(p.name, ''), ' ', 1), '') as first_name,
  p.stage                                          as year_of_study,

  c.name                                           as college_name,
  c.state                                          as college_state,
  c.country                                        as college_country,

  -- A student who gave a phone number but never finished the Quick Intro has
  -- no name to address, so the automation should skip them.
  (p.name is not null)                             as completed_intake,
  (br.player_id is not null)                       as played_a_round,

  coalesce(rc.rounds_played, 0)                    as rounds_played,

  br.solved                                        as best_solved,
  br.total                                         as best_total,
  case when br.player_id is not null
       then br.solved || '/' || br.total end       as best_score,
  br.total_seconds                                 as best_time_seconds,

  lr.solved                                        as last_solved,
  lr.total                                         as last_total,
  case when lr.player_id is not null
       then lr.solved || '/' || lr.total end       as last_score,
  lr.total_seconds                                 as last_time_seconds,

  -- The three Quick Intro statements. 'Sounds like me' is the struggle signal
  -- on all three, so these can segment the message without further lookup.
  max(a.answer) filter (where a.question_key = 'timetable_slips')      as ans_timetable_slips,
  max(a.answer) filter (where a.question_key = 'recall_under_pressure') as ans_recall_under_pressure,
  max(a.answer) filter (where a.question_key = 'postpones_mcqs')        as ans_postpones_mcqs,

  p.created_at                                     as registered_at,
  lr.created_at                                    as last_played_at,
  -- What an incremental pull should filter on: it moves whenever anything
  -- about this student changes, including an intake finished without playing.
  greatest(p.updated_at, coalesce(lr.created_at, p.updated_at)) as last_activity_at

from public.players p
join public.colleges c            on c.id = p.college_id
left join best_round br           on br.player_id = p.id
left join last_round lr           on lr.player_id = p.id
left join round_counts rc         on rc.player_id = p.id
left join public.player_answers a on a.player_id = p.id
group by
  p.id, p.phone, p.name, p.stage, p.created_at, p.updated_at,
  c.name, c.state, c.country,
  br.player_id, br.solved, br.total, br.total_seconds,
  lr.player_id, lr.solved, lr.total, lr.total_seconds, lr.created_at,
  rc.rounds_played;

-- ---------------------------------------------------------------------------
-- Who may read it.
--
-- A view runs with its owner's rights, so it sees through the row level
-- security on players and player_answers. That is the point, and it is also
-- why the grants below matter more than usual: anon holds the key that is
-- printed in the browser bundle.
-- ---------------------------------------------------------------------------
revoke all on public.lead_export from public, anon, authenticated;
grant select on public.lead_export to service_role;
