-- Three new editorial fields on the shared concept_details table:
--
-- caption    Long-form post copy (what runs on the feed).
-- mentions   Comma-separated @handles credited in the post.
-- source     Free-text attribution for the idea/content origin.
--
-- The Calendar app already added concept_details.epigram_type, so we
-- intentionally do not redefine it here. The Boneyard now reads/writes
-- that column alongside Calendar.

alter table concept_details
  add column if not exists caption text;

alter table concept_details
  add column if not exists mentions text;

alter table concept_details
  add column if not exists source text;

comment on column concept_details.caption is
  'Post copy as it will appear on the feed. Shared between Boneyard and Calendar.';

comment on column concept_details.mentions is
  '@-handles credited in the post (e.g. "@dogppl, @collaborator"). Shared between Boneyard and Calendar.';

comment on column concept_details.source is
  'Free-text attribution for where the idea/content came from. Shared between Boneyard and Calendar.';
