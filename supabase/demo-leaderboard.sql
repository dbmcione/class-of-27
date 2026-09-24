-- ---------------------------------------------------------------------------
-- DEMO DATA. Twenty-eight invented students on the K V G Medical College
-- board, so the top five plus "you are 29th" can be seen working.
--
-- ⚠️ THESE ARE NOT REAL PEOPLE AND THEY WILL REACH THE GOOGLE SHEET.
-- They have names and scores, which is all lead_export asks for, so the
-- automation would message twenty-eight numbers that do not exist. Run the
-- cleanup at the bottom before the campaign goes anywhere near live.
--
-- Every phone is in 9000001001 to 9000001028, a block used for nothing else,
-- so the cleanup cannot take a real student with it.
--
-- All twenty-eight score 5/5 between 21 and 48 seconds, which puts them
-- above any realistic human round and makes your own place the interesting
-- part of the screen.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

do $$
declare
  v_college uuid;
  v_player  uuid;
  v_names   text[] := array[
    'Aarav Deshpande', 'Sneha Ramakrishnan', 'Rohan Iyer', 'Meera Nair',
    'Kabir Shah', 'Ananya Venkatesh', 'Vikram Reddy', 'Priya Balasubramanian',
    'Arjun Menon', 'Divya Krishnan', 'Nikhil Joshi', 'Shreya Pillai',
    'Aditya Rao', 'Kavya Subramanian', 'Manish Gowda', 'Tanvi Hegde',
    'Siddharth Bhat', 'Pooja Kulkarni', 'Harsha Shetty', 'Neha Acharya',
    'Varun Prabhu', 'Ishita Kamath', 'Rahul Nayak', 'Lakshmi Bhandary',
    'Gaurav Shenoy', 'Ritika Pai', 'Suhas Kotian', 'Amrita Ballal'
  ];
  i integer;
begin
  select id into v_college
    from public.colleges
   where name = 'K V G Medical College, Sullia';

  if v_college is null then
    raise exception 'K V G Medical College, Sullia not found in colleges';
  end if;

  for i in 1..array_length(v_names, 1) loop
    insert into public.players (college_id, phone, name, stage)
    values (v_college, '900000' || lpad((1000 + i)::text, 4, '0'),
            v_names[i], '4th Year')
    on conflict (phone) do update set name = excluded.name
    returning id into v_player;

    -- Wipe any earlier demo round for this player so re-running does not
    -- stack duplicate scores on the board.
    delete from public.round_scores where player_id = v_player;

    perform public.save_round(
      v_player, v_college, 5, 5, 20 + i, '[]'::jsonb
    );
  end loop;
end $$;

-- What the board looks like now.
select rank, display_name, solved || '/' || total as score, total_seconds
  from public.college_leaderboard(
         (select id from public.colleges where name = 'K V G Medical College, Sullia'),
         40
       );

-- ---------------------------------------------------------------------------
-- CLEANUP. Run this before the campaign goes live.
-- ---------------------------------------------------------------------------
--   delete from public.players
--    where phone between '9000001001' and '9000001028';
