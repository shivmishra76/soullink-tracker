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

drop trigger if exists set_soul_links_updated_at on public.soul_links;
create trigger set_soul_links_updated_at
before update on public.soul_links
for each row
execute function public.set_updated_at();

alter table public.soul_links enable row level security;

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
end;
$$;
