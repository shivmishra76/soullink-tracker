create table if not exists public.soul_runs (
  id text primary key,
  name text not null,
  game_id text not null default 'pokemon-black',
  player_names jsonb not null default '["Nayan", "Shivank", "Srikar"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.soul_runs
add column if not exists game_id text not null default 'pokemon-black';

alter table public.soul_runs
add column if not exists player_names jsonb not null default '["Nayan", "Shivank", "Srikar"]'::jsonb;

create table if not exists public.soul_links (
  id text primary key,
  run_id text not null default 'pokemon-black',
  link_number integer not null,
  area text not null,
  status text not null check (status in ('Alive', 'Dead', 'Boxed', 'Pending')),
  members jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, link_number)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_soul_runs_updated_at on public.soul_runs;
create trigger set_soul_runs_updated_at
before update on public.soul_runs
for each row
execute function public.set_updated_at();

drop trigger if exists set_soul_links_updated_at on public.soul_links;
create trigger set_soul_links_updated_at
before update on public.soul_links
for each row
execute function public.set_updated_at();

insert into public.soul_runs (id, name, game_id, player_names)
values ('pokemon-black', 'Pokemon Black', 'pokemon-black', '["Nayan", "Shivank", "Srikar"]'::jsonb)
on conflict (id) do update
set game_id = coalesce(public.soul_runs.game_id, excluded.game_id),
    player_names = coalesce(public.soul_runs.player_names, excluded.player_names);

alter table public.soul_runs enable row level security;
alter table public.soul_links enable row level security;

drop policy if exists "Anyone can read soul runs" on public.soul_runs;
create policy "Anyone can read soul runs"
on public.soul_runs for select
to anon
using (true);

drop policy if exists "Anyone can insert soul runs" on public.soul_runs;
create policy "Anyone can insert soul runs"
on public.soul_runs for insert
to anon
with check (true);

drop policy if exists "Anyone can update soul runs" on public.soul_runs;
create policy "Anyone can update soul runs"
on public.soul_runs for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can delete soul runs" on public.soul_runs;
create policy "Anyone can delete soul runs"
on public.soul_runs for delete
to anon
using (true);

drop policy if exists "Anyone can read soul links" on public.soul_links;
create policy "Anyone can read soul links"
on public.soul_links for select
to anon
using (true);

drop policy if exists "Anyone can insert soul links" on public.soul_links;
create policy "Anyone can insert soul links"
on public.soul_links for insert
to anon
with check (true);

drop policy if exists "Anyone can update soul links" on public.soul_links;
create policy "Anyone can update soul links"
on public.soul_links for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can delete soul links" on public.soul_links;
create policy "Anyone can delete soul links"
on public.soul_links for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'soul_links'
  ) then
    alter publication supabase_realtime add table public.soul_links;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'soul_runs'
  ) then
    alter publication supabase_realtime add table public.soul_runs;
  end if;
end;
$$;
