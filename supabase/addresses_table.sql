-- ─────────────────────────────────────────────────────────────────────────
-- WatchEase — addresses table
-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.addresses (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users(id) on delete cascade,
    full_name      text,
    phone          text,
    address_line1  text,
    address_line2  text,
    city           text,
    state          text,
    pin_code       text,
    created_at     timestamptz default now(),
    updated_at     timestamptz default now(),

    -- One address per user (upsert target)
    constraint addresses_user_id_key unique (user_id)
);

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at
    before update on public.addresses
    for each row execute function public.set_updated_at();

-- Row Level Security — users can only read/write their own address
alter table public.addresses enable row level security;

drop policy if exists "Users can view own address"   on public.addresses;
drop policy if exists "Users can upsert own address" on public.addresses;

create policy "Users can view own address"
    on public.addresses for select
    using (auth.uid() = user_id);

create policy "Users can upsert own address"
    on public.addresses for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
