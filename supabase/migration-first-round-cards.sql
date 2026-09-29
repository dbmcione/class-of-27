-- ---------------------------------------------------------------------------
-- One scorecard per student: their first round's.
--
-- The card is stored for one reason, the WhatsApp message, and each student
-- is messaged once. Every round used to upload its own card, so a student who
-- played five times left five images in the bucket and only one was ever
-- sent. On the free plan's 1 GB that capped the game at about 10,000 rounds
-- rather than 10,000 students.
--
-- Three parts, which have to agree with each other:
--   1. play_code_is_first: is this code the player's first finished round?
--   2. The bucket's insert policy only accepts that round's card.
--   3. lead_export_since hands the sheet that same round, so the card_url the
--      sheet builds always points at a card that was allowed to exist.
--
-- The app asks (1) before uploading, so a replay does not send an image just
-- to have it refused. The policy is what actually enforces it, including for
-- anyone still on an older copy of the page.
--
-- Run after migration-scorecards.sql and migration-incremental-leads.sql.
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Is this code the first round its player finished?
--
-- Security definer because anon cannot read round_scores. Like
-- play_code_exists, it answers yes or no about a code the caller already
-- holds, so it leaks nothing that guessing the code would not.
-- ---------------------------------------------------------------------------
create or replace function public.play_code_is_first(p_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select first.code = p_code
      from public.round_scores this
      join lateral (
        select code
        from public.round_scores
        where player_id = this.player_id
        order by created_at asc, id asc
        limit 1
      ) first on true
      where this.code = p_code
    ),
    false
  );
$$;

revoke all on function public.play_code_is_first(text) from public;
grant execute on function public.play_code_is_first(text) to anon, authenticated, service_role;

-- Finds a player's first round without reading all of their rounds.
create index if not exists round_scores_player_first_idx
  on public.round_scores (player_id, created_at asc, id asc);

-- ---------------------------------------------------------------------------
-- 2. The bucket takes only a first round's card.
--
-- Same rules as before otherwise: insert only, one flat `<code>.jpg` name,
-- no update or delete policy.
-- ---------------------------------------------------------------------------
drop policy if exists "scorecards: insert a card for a real play" on storage.objects;
drop policy if exists "scorecards: insert a card for a first round" on storage.objects;

create policy "scorecards: insert a card for a first round"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'scorecards'
  and name ~ '^[A-Za-z0-9]{4,32}\.jpg$'
  and public.play_code_is_first(split_part(name, '.', 1))
);

-- ---------------------------------------------------------------------------
-- 3. The sheet gets the first round too.
--
-- Was the best round. With the sync running every minute a student is added
-- within a minute of finishing their first round, so the two were already
-- the same round in practice; this makes it certain, which is what keeps the
-- score, the answers link and the card in the message all about one round.
--
-- Same columns as before, so the Apps Script needs no change.
-- ---------------------------------------------------------------------------
create or replace function public.lead_export_since(p_since timestamptz)
returns table (
  phone         text,
  name          text,
  score         text,
  answers_code  text,
  last_round_ms bigint
)
language sql
stable
set search_path = public
as $$
  with recent as (
    select player_id, max(created_at) as last_round_at
    from public.round_scores
    where created_at > p_since
    group by player_id
  )
  select
    p.phone,
    p.name,
    -- Their first round: the one whose card is in the bucket.
    rs.solved || '/' || rs.total as score,
    rs.code                      as answers_code,
    floor(extract(epoch from r.last_round_at) * 1000)::bigint as last_round_ms
  from recent r
  join public.players p on p.id = r.player_id
  join lateral (
    select solved, total, code
    from public.round_scores
    where player_id = p.id
    order by created_at asc, id asc
    limit 1
  ) rs on true
  where p.name is not null;
$$;

revoke all on function public.lead_export_since(timestamptz) from public, anon, authenticated;
grant execute on function public.lead_export_since(timestamptz) to service_role;
