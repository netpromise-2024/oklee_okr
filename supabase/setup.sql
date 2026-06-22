create table if not exists public.family_okr_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.family_okr_state enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_family_okr_state_updated_at on public.family_okr_state;

create trigger set_family_okr_state_updated_at
before update on public.family_okr_state
for each row
execute function public.set_updated_at();

drop policy if exists "family okr read" on public.family_okr_state;
drop policy if exists "family okr insert" on public.family_okr_state;
drop policy if exists "family okr update" on public.family_okr_state;

create policy "family okr read"
on public.family_okr_state
for select
to anon
using (id = 'oklee-family-okr');

create policy "family okr insert"
on public.family_okr_state
for insert
to anon
with check (id = 'oklee-family-okr');

create policy "family okr update"
on public.family_okr_state
for update
to anon
using (id = 'oklee-family-okr')
with check (id = 'oklee-family-okr');

insert into public.family_okr_state (id, data)
values ('oklee-family-okr', '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.family_okr_cycles (
  id text primary key,
  cycle_name text not null,
  cycle_start_date date,
  data jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_okr_cycles enable row level security;

drop trigger if exists set_family_okr_cycles_updated_at on public.family_okr_cycles;

create trigger set_family_okr_cycles_updated_at
before update on public.family_okr_cycles
for each row
execute function public.set_updated_at();

drop policy if exists "family okr cycles read" on public.family_okr_cycles;
drop policy if exists "family okr cycles insert" on public.family_okr_cycles;
drop policy if exists "family okr cycles update" on public.family_okr_cycles;

create policy "family okr cycles read"
on public.family_okr_cycles
for select
to anon
using (true);

create policy "family okr cycles insert"
on public.family_okr_cycles
for insert
to anon
with check (true);

create policy "family okr cycles update"
on public.family_okr_cycles
for update
to anon
using (true)
with check (true);

create table if not exists public.family_okr_history (
  id text primary key,
  cycle_id text not null,
  member_id text,
  action text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.family_okr_history enable row level security;

drop policy if exists "family okr history read" on public.family_okr_history;
drop policy if exists "family okr history insert" on public.family_okr_history;

create policy "family okr history read"
on public.family_okr_history
for select
to anon
using (true);

create policy "family okr history insert"
on public.family_okr_history
for insert
to anon
with check (true);

create table if not exists public.family_relationship_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.family_relationship_state enable row level security;

drop trigger if exists set_family_relationship_state_updated_at on public.family_relationship_state;

create trigger set_family_relationship_state_updated_at
before update on public.family_relationship_state
for each row
execute function public.set_updated_at();

drop policy if exists "family relationship read" on public.family_relationship_state;
drop policy if exists "family relationship insert" on public.family_relationship_state;
drop policy if exists "family relationship update" on public.family_relationship_state;

create policy "family relationship read"
on public.family_relationship_state
for select
to anon
using (id = 'oklee-family-relationship');

create policy "family relationship insert"
on public.family_relationship_state
for insert
to anon
with check (id = 'oklee-family-relationship');

create policy "family relationship update"
on public.family_relationship_state
for update
to anon
using (id = 'oklee-family-relationship')
with check (id = 'oklee-family-relationship');

insert into public.family_relationship_state (id, data)
values ('oklee-family-relationship', '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.family_relationship_cycles (
  id text primary key,
  cycle_name text not null,
  cycle_start_date date,
  data jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_relationship_cycles enable row level security;

drop trigger if exists set_family_relationship_cycles_updated_at on public.family_relationship_cycles;

create trigger set_family_relationship_cycles_updated_at
before update on public.family_relationship_cycles
for each row
execute function public.set_updated_at();

drop policy if exists "family relationship cycles read" on public.family_relationship_cycles;
drop policy if exists "family relationship cycles insert" on public.family_relationship_cycles;
drop policy if exists "family relationship cycles update" on public.family_relationship_cycles;

create policy "family relationship cycles read"
on public.family_relationship_cycles
for select
to anon
using (true);

create policy "family relationship cycles insert"
on public.family_relationship_cycles
for insert
to anon
with check (true);

create policy "family relationship cycles update"
on public.family_relationship_cycles
for update
to anon
using (true)
with check (true);
