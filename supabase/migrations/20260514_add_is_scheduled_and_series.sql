-- Two new fields on concept_details:
--
-- is_scheduled  true when the concept has at least one placement on the
--               calendar. Maintained by a trigger on calendar_state so it
--               stays in sync no matter which app makes the edit. Drives
--               the "Scheduled" badge in the Boneyard and the gate on the
--               "Send to Calendar" button.
--
-- series        soft grouping key shared by concepts that are instances
--               of the same recurring format ("Meet the Dog", "Rufferee
--               Canine Edu", "Dog Breed Origins", "Sofia & Margot"). When
--               present, audit / mix calculations should group by series
--               so duplicated concepts still aggregate into the workhorse
--               format they belong to.

alter table concept_details
  add column if not exists is_scheduled boolean not null default false;

alter table concept_details
  add column if not exists series text;

comment on column concept_details.is_scheduled is
  'True when this concept has at least one placement in calendar_state. Maintained by a trigger; do not write directly from app code.';

comment on column concept_details.series is
  'Optional grouping key for recurring formats. Duplicated instances inherit the parent series so audits can roll up by format identity rather than concept id.';
