-- Private storage bucket for media attached to Boneyard concepts. Reads
-- require signed URLs; writes/deletes require an authenticated session.
-- 50 MB per file. Image + video MIME types only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'boneyard-media',
  'boneyard-media',
  false,
  52428800,
  array['image/png','image/jpeg','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies on storage.objects scoped to this bucket only.
drop policy if exists "boneyard-media read"   on storage.objects;
drop policy if exists "boneyard-media insert" on storage.objects;
drop policy if exists "boneyard-media delete" on storage.objects;

create policy "boneyard-media read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'boneyard-media');

create policy "boneyard-media insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'boneyard-media');

create policy "boneyard-media delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'boneyard-media');
