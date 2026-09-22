-- Removes every test player created while building this, including the one
-- that was mistakenly given a real person's name and showed up as a
-- duplicate on the K V G Medical College board.
--
-- Cascades to answers, seen puzzles, results and round scores.
-- Colleges and the puzzle bank are untouched.
delete from public.players
 where phone in (
   '9000000001', '9000000002', '9000000003', '9000000009',
   '9000000011', '9000000022', '9000000044', '9000000055',
   '9000000077', '9000000099', '9000000123', '9000000321'
 );

select
  (select count(*) from public.colleges) as colleges,
  (select count(*) from public.players)  as players_left;

-- If you would rather start completely fresh, run this instead of the above:
--   delete from public.players;
