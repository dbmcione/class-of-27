-- ---------------------------------------------------------------------------
-- Scorecards in Storage.
--
-- The browser uploads the finished card to the `scorecards` bucket under the
-- play's own code, so the marketing message can attach the same image the
-- student saw. Nothing is stored about it here: the address is derivable from
-- the code, which the sheet already has.
--
-- Run this AFTER creating the bucket in the dashboard. It expects:
--   name            scorecards
--   public          on
--   file size limit 2 MB
--   MIME types      image/jpeg
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Does this code belong to a real play?
--
-- The anon key ships inside the browser bundle, so it is public, and an
-- insert policy that only checked the bucket would let anyone on the internet
-- fill the bucket with whatever they liked. This is the check that stops it:
-- an upload has to be named after a round that actually exists.
--
-- Security definer because anon cannot read round_scores, and must not be
-- able to. It answers yes or no about a code the caller already holds, so it
-- leaks nothing that guessing the code would not.
-- ---------------------------------------------------------------------------
create or replace function public.play_code_exists(p_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.round_scores where code = p_code);
$$;

revoke all on function public.play_code_exists(text) from public;
grant execute on function public.play_code_exists(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Insert only, and only a card named after a real play.
--
-- There is deliberately no update and no delete policy. A student's card
-- cannot be replaced or removed by anyone holding the anon key, and because
-- the client uploads with upsert off, a second attempt on a code that is
-- already there fails harmlessly rather than overwriting it.
--
-- No select policy either: a public bucket serves reads through
-- /storage/v1/object/public/ without consulting RLS, which is what lets
-- WhatsApp fetch the image with no credentials of its own.
-- ---------------------------------------------------------------------------
drop policy if exists "scorecards: insert a card for a real play" on storage.objects;

create policy "scorecards: insert a card for a real play"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'scorecards'
  -- One flat name, `<code>.jpg`. No folders, so no path to walk out of.
  and name ~ '^[A-Za-z0-9]{4,32}\.jpg$'
  and public.play_code_exists(split_part(name, '.', 1))
);
