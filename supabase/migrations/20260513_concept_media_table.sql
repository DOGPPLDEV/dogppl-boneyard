-- Metadata table for media uploaded to the boneyard-media storage bucket.
-- The storage path (`file_path`) is the source of truth for the binary;
-- this row carries everything else the UI needs (type, size, ordering,
-- alt text) plus an audit trail of who uploaded it.

create table if not exists concept_media (
  id           uuid primary key default gen_random_uuid(),
  concept_id   text not null references concept_details(id) on delete cascade,
  file_path    text not null,
  file_type    text not null,
  file_size    integer not null,
  uploaded_by  uuid references auth.users(id) on delete set null,
  ordering     integer not null default 0,
  alt_text     text,
  created_at   timestamptz not null default now()
);

-- Fast lookup of all media for a concept, in display order.
create index if not exists concept_media_concept_idx
  on concept_media (concept_id, ordering, created_at);

-- One row per stored file. Catches accidental duplicate inserts if the
-- client retries an upload.
create unique index if not exists concept_media_path_uidx
  on concept_media (file_path);

alter table concept_media enable row level security;

drop policy if exists "concept_media read"   on concept_media;
drop policy if exists "concept_media insert" on concept_media;
drop policy if exists "concept_media delete" on concept_media;
drop policy if exists "concept_media update" on concept_media;

create policy "concept_media read"
  on concept_media for select
  to authenticated
  using (true);

create policy "concept_media insert"
  on concept_media for insert
  to authenticated
  with check (true);

create policy "concept_media delete"
  on concept_media for delete
  to authenticated
  using (true);

create policy "concept_media update"
  on concept_media for update
  to authenticated
  using (true)
  with check (true);
