-- ---------------------------------------------------------------------------
-- Shareable answer pages, one per play.
--
-- Adds a short code to every finished round and an endpoint that reads one
-- back by that code, so a student can be sent a link to their own answers.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

alter table public.round_scores add column if not exists code   text;
alter table public.round_scores add column if not exists detail jsonb;

create unique index if not exists round_scores_code_key
  on public.round_scores (code);

-- ---------------------------------------------------------------------------
-- The code that goes in the URL.
--
-- Eight characters from an alphabet with the shapes people confuse removed:
-- no l, I, 1, O or 0. That is 57^8, about 111 trillion, which is not worth
-- anyone's time to guess. What a successful guess would buy is a stranger's
-- first name and their score, so the stakes are low either way.
-- ---------------------------------------------------------------------------
create or replace function public.gen_play_code()
returns text
language sql
volatile
as $$
  select string_agg(
           substr(
             'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
             (floor(random() * 57) + 1)::int,
             1
           ),
           ''
         )
    from generate_series(1, 8);
$$;

-- ---------------------------------------------------------------------------
-- save_round: writes the score and the per-puzzle detail, returns the code.
--
-- One call rather than two inserts, because the client needs the code back
-- and the two writes should not be able to half-succeed. Also retries on the
-- vanishingly unlikely code collision rather than failing the save.
-- ---------------------------------------------------------------------------
create or replace function public.save_round(
  p_player_id     uuid,
  p_college_id    uuid,
  p_solved        integer,
  p_total         integer,
  p_total_seconds integer,
  p_results       jsonb default '[]'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_try  integer := 0;
begin
  if not exists (select 1 from public.players where id = p_player_id) then
    raise exception 'unknown_player' using errcode = 'P0002';
  end if;

  loop
    v_try  := v_try + 1;
    v_code := public.gen_play_code();

    begin
      insert into public.round_scores
        (player_id, college_id, solved, total, total_seconds, code, detail)
      values
        (p_player_id, p_college_id, p_solved, p_total, p_total_seconds,
         v_code, coalesce(p_results, '[]'::jsonb));
      exit;
    exception when unique_violation then
      if v_try >= 5 then raise; end if;
    end;
  end loop;

  -- Kept alongside the jsonb: this table is what any later analysis of which
  -- puzzles are hardest will read, and it is indexed for that.
  if jsonb_typeof(p_results) = 'array' then
    insert into public.puzzle_results
      (player_id, puzzle_id, solved, seconds, wrong_guesses)
    select
      p_player_id,
      r->>'puzzleId',
      (r->>'solved')::boolean,
      coalesce((r->>'seconds')::integer, 0),
      coalesce((r->>'wrongGuesses')::integer, 0)
    from jsonb_array_elements(p_results) r
    where r ? 'puzzleId';
  end if;

  return v_code;
end;
$$;

revoke all on function public.save_round(uuid, uuid, integer, integer, integer, jsonb) from public;
grant execute on function public.save_round(uuid, uuid, integer, integer, integer, jsonb)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_play: the answers page, read by anyone holding the link.
--
-- First name only, and no phone number. The link travels through WhatsApp and
-- will be forwarded, so it must not carry anything the student would mind a
-- stranger seeing.
-- ---------------------------------------------------------------------------
create or replace function public.get_play(p_code text)
returns table (
  first_name    text,
  solved        integer,
  total         integer,
  total_seconds integer,
  detail        jsonb,
  played_at     timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    nullif(split_part(coalesce(p.name, ''), ' ', 1), ''),
    rs.solved,
    rs.total,
    rs.total_seconds,
    coalesce(rs.detail, '[]'::jsonb),
    rs.created_at
  from public.round_scores rs
  join public.players p on p.id = rs.player_id
  where rs.code = p_code
  limit 1;
$$;

revoke all on function public.get_play(text) from public;
grant execute on function public.get_play(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The sheet gains the code for the same round its score comes from.
--
-- The code rather than a full URL: the app's address belongs in one place,
-- and that place is not a database column that would need a migration to
-- change when the domain does.
-- ---------------------------------------------------------------------------
drop view if exists public.lead_export;

create view public.lead_export as
select
  p.phone,
  p.name,
  rs.solved || '/' || rs.total as score,
  rs.code                      as answers_code
from public.players p
join lateral (
  select solved, total, code
  from public.round_scores
  where player_id = p.id
  order by solved desc, total_seconds asc
  limit 1
) rs on true
where p.name is not null;

revoke all on public.lead_export from public, anon, authenticated;
grant select on public.lead_export to service_role;
