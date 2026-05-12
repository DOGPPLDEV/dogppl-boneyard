# The Boneyard

DOG PPL's concept vault. Shares the Supabase backend with
[the calendar](https://calendar.dogppl.co) — same project, same
`concept_details` and `concept_deployments` tables.

Lives at https://boneyard.dogppl.co.

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# (use the same values the calendar uses)
npm run dev
```

## Stack

- Next.js 15 (App Router)
- React 18
- Tailwind 3
- @supabase/supabase-js

## Auth note

The Supabase client here uses default localStorage sessions, which are
per-origin. boneyard.dogppl.co and calendar.dogppl.co maintain separate
sessions even though they hit the same Supabase project — users sign in
once per subdomain. If we later want shared sessions, both apps move to
`@supabase/ssr` cookie auth scoped to `.dogppl.co`.
