-- Deploy this in Supabase SQL Editor (EU region recommended)
-- Purpose: shared workspace storage for products/settings with RLS

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')) default 'editor',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.products (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_workspace_idx on public.products(workspace_id);
create index if not exists products_updated_idx on public.products(updated_at desc);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  payload jsonb not null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.products enable row level security;
alter table public.workspace_settings enable row level security;

-- Workspaces: member can read own workspace rows
create policy if not exists workspaces_select_member
on public.workspaces
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
  )
);

-- Memberships: user can read own membership rows
create policy if not exists workspace_members_select_self
on public.workspace_members
for select
using (user_id = auth.uid());

-- Products: members can CRUD inside own workspace
create policy if not exists products_select_member
on public.products
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = products.workspace_id
      and wm.user_id = auth.uid()
  )
);

create policy if not exists products_insert_member
on public.products
for insert
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = products.workspace_id
      and wm.user_id = auth.uid()
  )
  and created_by = auth.uid()
  and updated_by = auth.uid()
);

create policy if not exists products_update_member
on public.products
for update
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = products.workspace_id
      and wm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = products.workspace_id
      and wm.user_id = auth.uid()
  )
  and updated_by = auth.uid()
);

create policy if not exists products_delete_member
on public.products
for delete
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = products.workspace_id
      and wm.user_id = auth.uid()
  )
);

-- Workspace settings: members can read/update own workspace settings
create policy if not exists workspace_settings_select_member
on public.workspace_settings
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_settings.workspace_id
      and wm.user_id = auth.uid()
  )
);

create policy if not exists workspace_settings_insert_member
on public.workspace_settings
for insert
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_settings.workspace_id
      and wm.user_id = auth.uid()
  )
  and updated_by = auth.uid()
);

create policy if not exists workspace_settings_update_member
on public.workspace_settings
for update
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_settings.workspace_id
      and wm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_settings.workspace_id
      and wm.user_id = auth.uid()
  )
  and updated_by = auth.uid()
);

-- Optional helper function for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists workspace_settings_set_updated_at on public.workspace_settings;
create trigger workspace_settings_set_updated_at
before update on public.workspace_settings
for each row execute function public.set_updated_at();
