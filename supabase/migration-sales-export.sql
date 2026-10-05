-- ---------------------------------------------------------------------------
-- sales_export: the Quick Intro and scores, one row per student, for the
-- sales team's sheet (sheets/sales-sheet.gs refreshes it once a day).
--
-- Every student who finished the Quick Intro (name set), whether or not they
-- have finished a round yet: someone who signed up and dropped out is still
-- a lead. Their score columns are blank until they finish one.
--
-- Read with the SERVICE ROLE key only. It carries names and phone numbers,
-- so the browser's public key is explicitly shut out below.
--
-- The three intro statements are named here by their keys from
-- src/flow/questions.ts. If a statement is added there, add a column here.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

drop view if exists public.sales_export;

create view public.sales_export as
with country_names (code, name) as (
  -- Mirrors COUNTRY_NAMES in src/lib/colleges.ts, so the sheet says
  -- "Malaysia" where the app does. An unlisted code shows as itself.
  values
    ('AE', 'UAE'),
    ('AF', 'Afghanistan'),
    ('AG', 'Antigua'),
    ('AM', 'Armenia'),
    ('AN', 'Netherlands Antilles'),
    ('AR', 'Argentina'),
    ('AT', 'Austria'),
    ('AU', 'Australia'),
    ('AW', 'Aruba'),
    ('AZ', 'Azerbaijan'),
    ('BA', 'Bosnia and Herzegovina'),
    ('BB', 'Barbados'),
    ('BD', 'Bangladesh'),
    ('BG', 'Bulgaria'),
    ('BH', 'Bahrain'),
    ('BY', 'Belarus'),
    ('BZ', 'Belize'),
    ('CA', 'Canada'),
    ('CN', 'China'),
    ('CU', 'Cuba'),
    ('CZ', 'Czechia'),
    ('DE', 'Germany'),
    ('DM', 'Dominica'),
    ('DO', 'Dominican Republic'),
    ('EG', 'Egypt'),
    ('ET', 'Ethiopia'),
    ('FR', 'France'),
    ('GD', 'Grenada'),
    ('GE', 'Georgia'),
    ('GY', 'Guyana'),
    ('HR', 'Croatia'),
    ('HU', 'Hungary'),
    ('ID', 'Indonesia'),
    ('IE', 'Ireland'),
    ('IN', 'India'),
    ('IR', 'Iran'),
    ('IT', 'Italy'),
    ('JM', 'Jamaica'),
    ('KE', 'Kenya'),
    ('KG', 'Kyrgyzstan'),
    ('KH', 'Cambodia'),
    ('KN', 'Saint Kitts and Nevis'),
    ('KZ', 'Kazakhstan'),
    ('LC', 'Saint Lucia'),
    ('LK', 'Sri Lanka'),
    ('LT', 'Lithuania'),
    ('LV', 'Latvia'),
    ('MD', 'Moldova'),
    ('MN', 'Mongolia'),
    ('MT', 'Malta'),
    ('MU', 'Mauritius'),
    ('MW', 'Malawi'),
    ('MY', 'Malaysia'),
    ('NG', 'Nigeria'),
    ('NP', 'Nepal'),
    ('NZ', 'New Zealand'),
    ('OM', 'Oman'),
    ('PA', 'Panama'),
    ('PH', 'Philippines'),
    ('PK', 'Pakistan'),
    ('PL', 'Poland'),
    ('RO', 'Romania'),
    ('RU', 'Russia'),
    ('SA', 'Saudi Arabia'),
    ('SC', 'Seychelles'),
    ('SD', 'Sudan'),
    ('SG', 'Singapore'),
    ('SK', 'Slovakia'),
    ('TJ', 'Tajikistan'),
    ('TZ', 'Tanzania'),
    ('UA', 'Ukraine'),
    ('UG', 'Uganda'),
    ('UK', 'United Kingdom'),
    ('US', 'United States'),
    ('UZ', 'Uzbekistan'),
    ('VC', 'Saint Vincent'),
    ('WS', 'Samoa'),
    ('YE', 'Yemen'),
    ('ZM', 'Zambia')
),
best as (
  select distinct on (player_id)
    player_id, solved, total, total_seconds
  from public.round_scores
  order by player_id, solved desc, total_seconds asc
),
rounds as (
  select player_id,
         count(*)        as played,
         min(created_at) as first_played_at,
         max(created_at) as last_played_at
  from public.round_scores
  group by player_id
),
answers as (
  select
    player_id,
    max(answer) filter (where question_key = 'timetable_slips')       as timetable_slips,
    max(answer) filter (where question_key = 'recall_under_pressure') as recall_under_pressure,
    max(answer) filter (where question_key = 'postpones_mcqs')        as postpones_mcqs
  from public.player_answers
  group by player_id
)
select
  p.phone,
  p.name,
  c.name                                         as college,
  coalesce(c.state, '')                          as state,
  coalesce(cn.name, c.country, '')               as country,
  coalesce(p.stage, '')                          as stage,
  coalesce(a.timetable_slips, '')                as timetable_slips,
  coalesce(a.recall_under_pressure, '')          as recall_under_pressure,
  coalesce(a.postpones_mcqs, '')                 as postpones_mcqs,
  coalesce(b.solved || '/' || b.total, '')       as best_score,
  coalesce(
    (b.total_seconds / 60) || 'm ' || lpad((b.total_seconds % 60)::text, 2, '0') || 's',
    ''
  )                                              as best_time,
  coalesce(r.played, 0)                          as rounds_played,
  -- Milliseconds, null until they finish a round. The sheet is sorted on it,
  -- so it is a number rather than a formatted date; the script formats it.
  floor(extract(epoch from r.first_played_at) * 1000)::bigint as first_played_ms,
  to_char(p.created_at at time zone 'Asia/Kolkata', 'DD Mon YYYY')       as signed_up,
  coalesce(
    to_char(r.last_played_at at time zone 'Asia/Kolkata', 'DD Mon YYYY'),
    ''
  )                                              as last_played,
  case p.source
    when 'share'    then 'Friend''s link'
    when 'campaign' then coalesce('Campaign: ' || cl.label, 'Campaign')
    else 'Direct'
  end                                            as found_via
from public.players p
join public.colleges c          on c.id = p.college_id
left join country_names cn      on cn.code = c.country
left join best b                on b.player_id = p.id
left join rounds r              on r.player_id = p.id
left join answers a             on a.player_id = p.id
left join public.campaign_links cl
       on p.source = 'campaign' and cl.code = p.referred_by_code
where p.name is not null;

revoke all on public.sales_export from public, anon, authenticated;
grant select on public.sales_export to service_role;
