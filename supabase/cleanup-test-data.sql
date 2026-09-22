-- Removes every row created while testing. All child tables cascade from
-- players, so this one delete clears their intake answers, seen puzzles,
-- results and leaderboard entries too.
--
-- Safe to re-run: it only ever matches the 90000000xx test numbers.
delete from public.players
 where phone in (
   '9000000001', '9000000002', '9000000003', '9000000009',
   '9000000011', '9000000022'
 );

-- Everything below should read 0 except colleges (1431).
select
  (select count(*) from public.colleges)            as colleges,
  (select count(*) from public.players)             as players,
  (select count(*) from public.player_answers)      as answers,
  (select count(*) from public.player_seen_puzzles) as seen,
  (select count(*) from public.round_scores)        as rounds,
  (select count(*) from public.puzzle_results)      as results;
