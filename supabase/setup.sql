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
