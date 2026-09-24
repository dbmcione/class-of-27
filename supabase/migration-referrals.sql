-- ---------------------------------------------------------------------------
-- Where each student came from.
--
-- Two doors lead into the game: the address marketing publishes, and a link a
-- student who has already played sent to a friend. The friend's link carries
-- ?ref=<play code>, so the two can be told apart.
--
-- Recorded on the student, once, at signup. Nothing is written to the sheet;
-- this is for analysis, and it is read from here.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- 'direct' or 'share'. Officially published links are one bucket by choice:
-- the question being answered is word-of-mouth versus not.
alter table public.players add column if not exists source text;

-- The sharer's round. A code rather than a player id: it is what the link
-- carries, and it says which scorecard was forwarded, not just by whom.
alter table public.players add column if not exists referred_by_code text;

create index if not exists players_referred_by_code_idx
  on public.players (referred_by_code)
  where referred_by_code is not null;

-- ---------------------------------------------------------------------------
-- register_player, now recording where the student arrived from.
--
-- WRITTEN ONCE. This function upserts on every visit, so without the coalesce
-- below a returning student's origin would be rewritten each time they
-- played: arrive from marketing in week one, click a friend's link in week
-- two, and the record would say they came from the friend. Attribution
-- belongs to first contact, so an existing value is never replaced.
-- ---------------------------------------------------------------------------
create or replace function public.register_player(
  p_college_id uuid,
  p_phone      text,
  p_ref        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_ref       text;
  v_source    text;
begin
  if not exists (
    select 1 from public.colleges
    where id = p_college_id and is_active
  ) then
    raise exception 'unknown_college' using errcode = 'P0002';
  end if;

  if p_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  -- A ref is only believed if it names a round that exists. Anything else --
  -- a typo, a truncated paste, someone trying it on -- counts as direct
  -- rather than as a referral from nobody.
  v_ref := nullif(trim(coalesce(p_ref, '')), '');
  if v_ref is not null
     and not exists (select 1 from public.round_scores where code = v_ref) then
    v_ref := null;
  end if;

  v_source := case when v_ref is null then 'direct' else 'share' end;

  insert into public.players (college_id, phone, source, referred_by_code)
  values (p_college_id, p_phone, v_source, v_ref)
  on conflict (college_id, phone) do update
    set updated_at       = now(),
        -- Only ever fills a blank. See the note above.
        source           = coalesce(public.players.source, excluded.source),
        referred_by_code = coalesce(public.players.referred_by_code,
                                    excluded.referred_by_code)
  returning id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.register_player(uuid, text, text) from public;
grant execute on function public.register_player(uuid, text, text)
  to anon, authenticated, service_role;

-- The old two-argument version has to go, and not for tidiness: with both on
-- the table a two-argument call matches each of them equally and PostgREST
-- refuses to choose, failing every registration with "could not choose the
-- best candidate function".
--
-- Dropping it costs nothing. p_ref defaults to null, so a browser still
-- running the previous bundle calls this one with two arguments and registers
-- exactly as before, just without a referral.
drop function if exists public.register_player(uuid, text);

-- ---------------------------------------------------------------------------
-- referral_summary: the headline number.
--
--   select * from public.referral_summary;
-- ---------------------------------------------------------------------------
create or replace view public.referral_summary as
select
  coalesce(source, 'direct') as source,
  count(*)                   as students,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1) as percent
from public.players
where name is not null
group by 1
order by 2 desc;

revoke all on public.referral_summary from public, anon, authenticated;
grant select on public.referral_summary to service_role;

-- ---------------------------------------------------------------------------
-- top_sharers: whose links actually brought people in.
--
--   select * from public.top_sharers limit 20;
--
-- Counts the students a sharer's links produced, resolved from the round back
-- to the person who played it. A student who shared several rounds is counted
-- once, with all of their referrals added up.
-- ---------------------------------------------------------------------------
create or replace view public.top_sharers as
select
  sharer.name                     as sharer_name,
  sharer.phone                    as sharer_phone,
  c.name                          as college,
  count(distinct joined.id)       as students_brought_in
from public.players joined
join public.round_scores rs on rs.code = joined.referred_by_code
join public.players sharer   on sharer.id = rs.player_id
join public.colleges c       on c.id = sharer.college_id
where joined.referred_by_code is not null
  and joined.name is not null
group by sharer.id, sharer.name, sharer.phone, c.name
order by students_brought_in desc;

revoke all on public.top_sharers from public, anon, authenticated;
grant select on public.top_sharers to service_role;
