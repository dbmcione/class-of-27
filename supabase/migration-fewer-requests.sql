-- ---------------------------------------------------------------------------
-- Fewer requests per round.
--
-- Every request the site makes is logged by Supabase, twice in practice: the
-- browser sends an OPTIONS check before each one. The end of a round used to
-- be four requests (save the score, fetch the top five, fetch the student's
-- own place, ask whether it was their first round) and signing up was two
-- (register, then save the intro answers). Each pair of these always runs
-- back to back, so each becomes one call here.
--
-- Both are thin wrappers over the existing functions, so the rules live in
-- one place: save_round, college_leaderboard, college_rank,
-- play_code_is_first, register_player and save_intake are unchanged and
-- still callable, which is what a browser on an older copy of the page uses.
-- The app also falls back to them if these two are missing.
--
-- Run after migration-first-round-cards.sql and migration-campaign-links.sql.
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- save_round_and_board: saves the round and returns everything the score
-- screen needs, in one call.
--
--   code      the answers page code (as save_round returned)
--   is_first  whether this is the student's first finished round, i.e.
--             whether its scorecard should be uploaded
--   board     the top p_top of the college board
--   place     the student's own row with board_size, or null
--
-- The board is read after the save, in the same call, so it always includes
-- the round just played.
-- ---------------------------------------------------------------------------
create or replace function public.save_round_and_board(
  p_player_id     uuid,
  p_college_id    uuid,
  p_solved        integer,
  p_total         integer,
  p_total_seconds integer,
  p_results       jsonb   default '[]'::jsonb,
  p_top           integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  v_code := public.save_round(
    p_player_id, p_college_id, p_solved, p_total, p_total_seconds, p_results
  );

  return jsonb_build_object(
    'code',     v_code,
    'is_first', public.play_code_is_first(v_code),
    'board',    coalesce(
                  (select jsonb_agg(to_jsonb(b) order by b.rank)
                     from public.college_leaderboard(p_college_id, p_top) b),
                  '[]'::jsonb
                ),
    'place',    (select to_jsonb(r)
                   from public.college_rank(p_college_id, p_player_id) r
                  limit 1)
  );
end;
$$;

revoke all on function public.save_round_and_board(uuid, uuid, integer, integer, integer, jsonb, integer) from public;
grant execute on function public.save_round_and_board(uuid, uuid, integer, integer, integer, jsonb, integer)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- register_with_intake: register_player and save_intake in one call.
--
-- Registration is what matters; the intro answers are a bonus. So, as before
-- when they were two calls and the second was fire-and-forget, a failure
-- saving the answers does not undo the registration. The student still
-- plays, just without a name on file, exactly as an intake that failed to
-- land behaved before.
-- ---------------------------------------------------------------------------
create or replace function public.register_with_intake(
  p_college_id uuid,
  p_phone      text,
  p_ref        text,
  p_name       text,
  p_stage      text,
  p_answers    jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  v_player_id := public.register_player(p_college_id, p_phone, p_ref);

  begin
    perform public.save_intake(v_player_id, p_name, p_stage, p_answers);
  exception when others then
    -- Kept quiet on purpose; see above.
    null;
  end;

  return v_player_id;
end;
$$;

revoke all on function public.register_with_intake(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.register_with_intake(uuid, text, text, text, text, jsonb)
  to anon, authenticated, service_role;
