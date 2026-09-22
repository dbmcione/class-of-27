-- =========================================================================
-- ERASE ALL USER DATA
--
-- Deletes every player and everything attached to them:
--   players -> player_answers, player_seen_puzzles, puzzle_results,
--              round_scores   (all ON DELETE CASCADE)
--
-- NOT touched: colleges (1431 rows) and the puzzle bank, which lives in
-- code, not the database.
--
-- THERE IS NO UNDO. Run only if every existing player is a test run.
-- =========================================================================

-- Before.
select 'before' as when,
       (select count(*) from public.players)             as players,
       (select count(*) from public.player_answers)      as answers,
       (select count(*) from public.player_seen_puzzles) as seen,
       (select count(*) from public.round_scores)        as rounds,
       (select count(*) from public.puzzle_results)      as results,
       (select count(*) from public.colleges)            as colleges;

delete from public.players;

-- After: everything should be 0 except colleges, which stays 1431.
select 'after' as when,
       (select count(*) from public.players)             as players,
       (select count(*) from public.player_answers)      as answers,
       (select count(*) from public.player_seen_puzzles) as seen,
       (select count(*) from public.round_scores)        as rounds,
       (select count(*) from public.puzzle_results)      as results,
       (select count(*) from public.colleges)            as colleges;
