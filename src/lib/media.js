import { supabase } from './supabase';

export const BUCKET = 'boneyard-media';
export const MAX_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]);

export function isImage(mime)  { return mime?.startsWith('image/'); }
export function isVideo(mime)  { return mime?.startsWith('video/'); }

export function validateFile(file) {
  if (!ALLOWED_MIME.has(file.type)) {
    return `"${file.name}" isn't an allowed type (PNG, JPG, WebP, MP4, MOV).`;
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is over 50 MB.`;
  }
  return null;
}

// "Hello World!.png" -> "hello-world.png"
function slugify(name) {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext  = dot > 0 ? name.slice(dot) : '';
  const safeStem = stem.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
  return safeStem + ext.toLowerCase();
}

export function buildStoragePath(conceptId, file) {
  return `${conceptId}/${Date.now()}-${slugify(file.name)}`;
}

export async function listConceptMedia(conceptId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('concept_media')
    .select('*')
    .eq('concept_id', conceptId)
    .order('ordering', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function uploadMedia(conceptId, file) {
  if (!supabase) throw new Error('Supabase not configured');
  const err = validateFile(file);
  if (err) throw new Error(err);

  const path = buildStoragePath(conceptId, file);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('concept_media')
    .insert({
      concept_id:  conceptId,
      file_path:   path,
      file_type:   file.type,
      file_size:   file.size,
      uploaded_by: userData?.user?.id ?? null,
    })
    .select()
    .single();
  if (error) {
    // Roll back the storage write if the metadata row didn't land.
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  return data;
}

export async function deleteMedia(row) {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([row.file_path]).catch(() => {});
  const { error } = await supabase.from('concept_media').delete().eq('id', row.id);
  if (error) throw error;
}

// 1-hour signed URL — long enough for the modal to stay open, short
// enough that a leaked link doesn't outlive the session.
export async function signedUrl(path) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl || null;
}
