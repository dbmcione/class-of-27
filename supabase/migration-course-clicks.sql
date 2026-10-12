-- ---------------------------------------------------------------------------
-- Clicks on "Know more about Class of ’27", the course link at the foot of
-- both answers pages.
--
-- dbmci.one counts these visits too, through the link's UTM tags, but only as
-- totals. Recording them here ties each click to a student, so the sales
-- sheet can show who showed interest in the course.
--
-- One row per click. Two pages carry the button:
--   'answers'         the answers page straight after a round; the student
--                     is known, so the click carries their id.
--   'shared_answers'  /a/<code>, the answers link in the student's WhatsApp
--                     message; the click carries the round's code, and the
--                     student is worked out from it. That link is sent to
--                     the student themselves, so it is almost always them.
--
-- Run BEFORE re-running migration-sales-export.sql, whose view reads this
-- table. Safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists public.course_link_clicks (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players (id) on delete cascade,
  page       text not null check (page in ('answers', 'shared_answers')),
  play_code  text,
  clicked_at timestamptz not null default now()
);

create index if not exists course_link_clicks_player_idx
  on public.course_link_clicks (player_id);

-- Written only through record_course_click below; nobody reads it from the
-- browser.
alter table public.course_link_clicks enable row level security;
revoke all on public.course_link_clicks from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- record_course_click: called by the site on each tap, without waiting for
-- the answer, so the link opens as fast as it always has.
--
-- Takes a player id (after a round) or a round code (shared answers page).
-- Anything that does not resolve to a real student is quietly ignored rather
-- than raised: a click that cannot be attributed is not worth an error the
-- student would never see anyway.
-- ---------------------------------------------------------------------------
create or replace function public.record_course_click(
  p_page      text,
  p_player_id uuid default null,
  p_code      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  if p_page not in ('answers', 'shared_answers') then
    return;
  end if;

  if p_player_id is not null then
    select id into v_player_id from public.players where id = p_player_id;
  elsif p_code is not null then
    select player_id into v_player_id from public.round_scores where code = p_code;
  end if;

  if v_player_id is null then
    return;
  end if;

  insert into public.course_link_clicks (player_id, page, play_code)
  values (v_player_id, p_page, p_code);
end;
$$;

revoke all on function public.record_course_click(text, uuid, text) from public;
grant execute on function public.record_course_click(text, uuid, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- course_click_summary: the headline numbers.
--
--   select * from public.course_click_summary;
-- ---------------------------------------------------------------------------
create or replace view public.course_click_summary as
select
  count(*)                                                    as total_clicks,
  count(distinct player_id)                                   as students_who_clicked,
  count(*) filter (where page = 'answers')                    as clicks_after_a_round,
  count(*) filter (where page = 'shared_answers')             as clicks_from_whatsapp_link,
  min(clicked_at)                                             as first_click,
  max(clicked_at)                                             as latest_click
from public.course_link_clicks;

revoke all on public.course_click_summary from public, anon, authenticated;
grant select on public.course_click_summary to service_role;
