-- Backfill the `series` grouping key for the four workhorse recurring
-- formats so audits / format-mix aggregations can roll up duplicated
-- concepts under their parent identity.
--
-- Each statement only touches rows where series is still null, so re-
-- running this migration is a no-op and any series tag set by hand
-- (via the UI or a later migration) is preserved.

-- Meet the Dog — any concept whose title starts with "Meet ".
-- Matches "Meet [dog] Reel", "Meet Josie", "Meet Bowie 2", etc.
update concept_details
set series = 'Meet the Dog'
where series is null
  and title ~* '^\s*meet\s+';

-- Rufferee Canine Edu — the recurring Rufferee tip / series.
update concept_details
set series = 'Rufferee Canine Edu'
where series is null
  and title ilike '%rufferee%'
  and title ilike '%edu%';

-- Dog Breed Origins — the per-breed origin-story carousel format.
update concept_details
set series = 'Dog Breed Origins'
where series is null
  and (title ilike '%breed origin%' or title ilike '%breed origins%');

-- Sofia & Margot — the member-quote recurring Reel format.
update concept_details
set series = 'Sofia & Margot'
where series is null
  and title ilike '%sofia%margot%';
