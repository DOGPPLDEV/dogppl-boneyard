-- Keep concept_details.is_scheduled in sync with calendar_state.placements.
--
-- Source of truth is calendar_state.placements (the single id=1 row, a
-- jsonb map of day-YYYY-M-D -> array of concept ids). Whenever that row
-- changes we recompute which concept ids appear anywhere in the map and
-- write the result back to concept_details. We only touch rows whose
-- value actually flips so the boneyard's realtime channel doesn't churn
-- on no-op updates.
--
-- The trigger runs `security definer` because the calendar app saves
-- placements as the authenticated user, and we want the cascading
-- update to bypass the RLS policies on concept_details (which restrict
-- writes by ownership) for this maintenance step. The function only
-- modifies the is_scheduled boolean — no other fields are touched.

create or replace function sync_concept_is_scheduled() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with placed as (
    select distinct jsonb_array_elements_text(value) as id
    from jsonb_each(coalesce(new.placements, '{}'::jsonb))
  ),
  desired as (
    select cd.id,
           (cd.id in (select id from placed)) as should_be
    from concept_details cd
  )
  update concept_details cd
  set is_scheduled = d.should_be
  from desired d
  where cd.id = d.id
    and cd.is_scheduled is distinct from d.should_be;
  return new;
end;
$$;

drop trigger if exists trg_sync_concept_is_scheduled on calendar_state;

create trigger trg_sync_concept_is_scheduled
after insert or update of placements on calendar_state
for each row execute function sync_concept_is_scheduled();

-- One-time backfill so existing placements get reflected immediately;
-- after this the trigger keeps things current.
update concept_details
set is_scheduled = true
where id in (
  select distinct jsonb_array_elements_text(value)
  from calendar_state cs, jsonb_each(coalesce(cs.placements, '{}'::jsonb))
  where cs.id = 1
)
and is_scheduled is distinct from true;
