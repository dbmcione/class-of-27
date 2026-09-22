-- Returning players: a phone number now identifies a student globally, and the
-- Quick Intro is answered once and only once.
--
-- Run this whole file in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Phone becomes the identity.
--
-- It was unique per (college, phone), which allowed the same number to
-- register again under a different college. Any such duplicates are collapsed
-- to the earliest row; their answers, rounds and results cascade away with
-- them. Only test data should be affected.
-- ---------------------------------------------------------------------------
delete from public.players a
 using public.players b
 where a.phone = b.phone
   and (a.created_at, a.id) > (b.created_at, b.id);

alter table public.players drop constraint if exists players_college_phone_unique;
alter table public.players drop constraint if exists players_phone_unique;
alter table public.players add  constraint players_phone_unique unique (phone);

-- ---------------------------------------------------------------------------
-- 2. register_player now conflicts on phone alone.
--
-- A returning student keeps the college they first registered with — passing a
-- different one does not move them, so the leaderboard they belong to is fixed
-- at first registration.
-- ---------------------------------------------------------------------------
create or replace function public.register_player(
  p_college_id uuid,
  p_phone      text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  if not exists (select 1 from public.colleges where id = p_college_id and is_active) then
    raise exception 'unknown_college' using errcode = 'P0002';
  end if;

  if p_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  insert into public.players (college_id, phone)
  values (p_college_id, p_phone)
  on conflict (phone) do update set updated_at = now()
  returning id into v_player_id;

  return v_player_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. lookup_player: does this number already belong to someone?
--
-- Returns a FIRST NAME and the college only — exactly what the leaderboard
-- already shows publicly, so this adds no new disclosure beyond confirming
-- that a number is registered.
-- ---------------------------------------------------------------------------
create or replace function public.lookup_player(p_phone text)
returns table (
  player_id       uuid,
  display_name    text,
  college_id      uuid,
  college_name    text,
  intake_complete boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Doctor-to-be'),
    p.college_id,
    c.name,
    (p.name is not null
       and p.stage is not null
       and exists (select 1 from public.player_answers a where a.player_id = p.id))
  from public.players p
  join public.colleges c on c.id = p.college_id
  where p.phone = p_phone
  limit 1;
$$;

revoke all on function public.lookup_player(text) from public;
grant execute on function public.lookup_player(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. save_intake becomes write-once.
--
-- Name, year and every questionnaire answer are set on the first pass and
-- never changed afterwards, so a student cannot revise their profile by
-- replaying. coalesce keeps whatever is already there; the insert does
-- nothing on conflict rather than overwriting.
-- ---------------------------------------------------------------------------
create or replace function public.save_intake(
  p_player_id uuid,
  p_name      text,
  p_stage     text,
  p_answers   jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.players where id = p_player_id) then
    raise exception 'unknown_player' using errcode = 'P0002';
  end if;

  update public.players
     set name  = coalesce(name,  nullif(btrim(p_name),  '')),
         stage = coalesce(stage, nullif(btrim(p_stage), ''))
   where id = p_player_id;

  if p_answers is not null and jsonb_typeof(p_answers) = 'object' then
    insert into public.player_answers (player_id, question_key, answer)
    select p_player_id, key, value
      from jsonb_each_text(p_answers)
    on conflict (player_id, question_key) do nothing;
  end if;
end;
$$;

select 'migration complete' as status,
       (select count(*) from public.players) as players;
