# SoulLink Tracker

A Next.js 14 tracker for a 3-player randomized Pokemon Black Soul Link Nuzlocke.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Shared Realtime Setup With Supabase

Without Supabase env vars, the app runs in local-only mode. To make edits sync for everyone:

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Paste and run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local`.
5. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SOULLINK_RUN_ID=pokemon-black
```

6. Restart the dev server:

```bash
npm run dev
```

The app supports multiple shared runs. Use **New Run** to seed a fresh Pokemon Black encounter template, **Clear Run** to remove the selected run's rows, and **Reset Template** to replace the selected run with the template again.

If you already deployed an older version, re-run `supabase/schema.sql` once so Supabase creates the `soul_runs` table and realtime policy. Existing `soul_links` data is preserved.

The SQL policies intentionally allow public read/write access for the shared no-login MVP. Use an unguessable run id or add authentication before sharing the app widely.
