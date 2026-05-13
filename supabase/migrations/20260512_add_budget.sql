-- Add a per-concept budget (USD, whole dollars, nullable). Used by T1/T2
-- concepts; T3 concepts skip the field entirely. The Boneyard stats bar
-- sums budget across concepts whose deployments fell in the current
-- year/quarter to surface YTD and quarterly spend.

alter table concept_details
  add column if not exists budget integer;

comment on column concept_details.budget is
  'Concept budget in whole USD. Null = unset (treated as $0 in totals).';
