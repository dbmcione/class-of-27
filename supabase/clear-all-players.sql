-- OPTIONAL. Wipes every player and everything attached to them, so the
-- leaderboards start empty for launch. Colleges and the puzzle bank are
-- untouched.
--
-- There is no undo. Only run this if the existing players are your own
-- test runs and you want a clean slate.
delete from public.players;

select
  (select count(*) from public.colleges)            as colleges,
  (select count(*) from public.players)             as players,
  (select count(*) from public.round_scores)        as rounds;
