-- ---------------------------------------------------------------------------
-- Campaign links: named ?ref= codes for the people promoting the game.
--
-- Until now a ref only counted if it was a student's round code, so a link
-- made up for the marketing team or a faculty member's Instagram would have
-- been recorded as 'direct' and the promotion would have been invisible.
--
-- Each campaign gets a code in campaign_links. A link carrying one:
--
--   https://class-of-27.vercel.app/?ref=dmnth2
--
-- records the student as source = 'campaign', referred_by_code = 'dmnth2'.
-- The codes are random on purpose: a link reading ?ref=faculty tells anyone
-- who sees it exactly what is being tracked. The label says who each is.
-- Round codes still record as 'share' exactly as before, and anything else
-- still counts as 'direct'.
--
-- To add another campaign later, add a row to campaign_links in the Table
-- Editor. No code change, no deploy. The code has to be letters and digits,
-- 4 to 32 long, and not exactly 8 long: round codes are always 8, and the
-- check below keeps the two from ever colliding.
--
-- Run after migration-referrals.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_links (
  code       text primary key
             check (code ~ '^[A-Za-z0-9]{4,32}$' and length(code) <> 8),
  label      text not null,
  created_at timestamptz not null default now()
);

-- Nobody reads this from the browser. The only reader is register_player,
-- which runs as its owner.
alter table public.campaign_links enable row level security;
revoke all on public.campaign_links from public, anon, authenticated;

insert into public.campaign_links (code, label) values
  ('nhp674', 'Marketing team'),
  ('dmnth2', 'Faculty Instagram')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- register_player, now telling campaign codes apart from round codes.
--
-- Same as migration-referrals.sql apart from the campaign check and the
-- referred_by_code fix in the update below. Still
-- WRITTEN ONCE: a returning student keeps the source they first arrived with,
-- so a student who played from a friend's link and later taps the faculty's
-- stays credited to the friend.
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

  -- A ref is only believed if it names a campaign or a round that exists.
  -- Anything else -- a typo, a truncated paste, someone trying it on --
  -- counts as direct rather than as a referral from nobody.
  v_ref := nullif(trim(coalesce(p_ref, '')), '');
  if v_ref is null then
    v_source := 'direct';
  elsif exists (select 1 from public.campaign_links where code = v_ref) then
    v_source := 'campaign';
  elsif exists (select 1 from public.round_scores where code = v_ref) then
    v_source := 'share';
  else
    v_ref := null;
    v_source := 'direct';
  end if;

  -- The conflict target is PHONE ALONE, matching players_phone_unique as
  -- migration-returning-players.sql left it. college_id is deliberately
  -- absent from the update: a returning student keeps the college they first
  -- registered with.
  insert into public.players (college_id, phone, source, referred_by_code)
  values (p_college_id, p_phone, v_source, v_ref)
  on conflict (phone) do update
    set updated_at       = now(),
        -- Only ever fills a blank. See the note above.
        source           = coalesce(players.source, excluded.source),
        -- Filled only alongside source, never on its own. It used to be
        -- filled whenever it was blank, so a student who arrived direct and
        -- later tapped someone's link ended up 'direct' with a referral
        -- code, counted by one view and not the other.
        referred_by_code = case when players.source is null
                                then excluded.referred_by_code
                                else players.referred_by_code end
  returning id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.register_player(uuid, text, text) from public;
grant execute on function public.register_player(uuid, text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- campaign_summary: how many students each campaign link brought in.
--
--   select * from public.campaign_summary;
--
-- Counts students who finished the intro (name is set), the same rule the
-- lead sheet and referral_summary use. A campaign with no students yet still
-- shows, with 0.
-- ---------------------------------------------------------------------------
create or replace view public.campaign_summary as
select
  c.code,
  c.label,
  count(p.id) as students
from public.campaign_links c
left join public.players p
  on p.referred_by_code = c.code
 and p.source = 'campaign'
 and p.name is not null
group by c.code, c.label
order by students desc, c.code;

revoke all on public.campaign_summary from public, anon, authenticated;
grant select on public.campaign_summary to service_role;
