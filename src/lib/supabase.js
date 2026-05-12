import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Single browser-side Supabase client shared across the app.
//
// Auth: default localStorage sessions, per-origin. boneyard.dogppl.co and
// calendar.dogppl.co each maintain their own session against the same
// Supabase project. If we want shared sessions later, both apps move to
// @supabase/ssr cookie auth scoped to .dogppl.co.
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
