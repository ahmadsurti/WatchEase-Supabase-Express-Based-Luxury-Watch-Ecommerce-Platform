-- ─────────────────────────────────────────────────────────────────────────
-- WatchEase — gift_orders table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.gift_orders (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references auth.users(id) on delete cascade,
    product_id       text not null,
    product_name     text,
    recipient_name   text not null,
    recipient_email  text,
    address_line1    text not null,
    address_line2    text,
    city             text not null,
    state            text not null,
    pin_code         text not null,
    note             text,
    send_teaser      boolean default false,
    created_at       timestamptz default now(),

    -- One gift entry per user per product at a time
    -- Cleaned up after checkout completes
    constraint gift_orders_user_product_key unique (user_id, product_id)
);

-- Row Level Security
alter table public.gift_orders enable row level security;

drop policy if exists "Users can manage own gift orders" on public.gift_orders;

create policy "Users can manage own gift orders"
    on public.gift_orders for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
