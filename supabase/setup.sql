-- WatchEase — full database setup
-- Run once: Supabase Dashboard → SQL Editor → New query → paste all → Run

-- ── Shared trigger helpers ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.reviews_on_update()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    new.edit_count = old.edit_count + 1;
    return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
    insert into public.profiles (id, name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ── profiles ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    name       text,
    created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- ── cart_items ───────────────────────────────────────────────────────────────

create table if not exists public.cart_items (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    product_id text not null,
    name       text not null,
    price      numeric(10, 2) not null,
    quantity   integer not null default 1 check (quantity >= 1),
    gender     text not null,
    created_at timestamptz default now(),

    constraint cart_items_user_product_key unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users manage own cart" on public.cart_items;

create policy "Users manage own cart"
    on public.cart_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── wishlist ─────────────────────────────────────────────────────────────────

create table if not exists public.wishlist (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    product_id text not null,
    gender     text not null default 'men',
    created_at timestamptz default now(),

    constraint wishlist_user_product_key unique (user_id, product_id)
);

alter table public.wishlist enable row level security;

drop policy if exists "Users manage own wishlist" on public.wishlist;

create policy "Users manage own wishlist"
    on public.wishlist for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── orders ───────────────────────────────────────────────────────────────────

create table if not exists public.orders (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    total_amount numeric(10, 2) not null,
    status       text not null default 'completed',
    created_at   timestamptz default now()
);

alter table public.orders enable row level security;

drop policy if exists "Users manage own orders" on public.orders;

create policy "Users manage own orders"
    on public.orders for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── order_items ──────────────────────────────────────────────────────────────

create table if not exists public.order_items (
    id         uuid primary key default gen_random_uuid(),
    order_id   uuid not null references public.orders(id) on delete cascade,
    product_id text not null,
    name       text not null,
    price      numeric(10, 2) not null,
    quantity   integer not null default 1 check (quantity >= 1),
    gender     text not null
);

alter table public.order_items enable row level security;

drop policy if exists "Users read own order items"   on public.order_items;
drop policy if exists "Users insert own order items" on public.order_items;

create policy "Users read own order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid()
        )
    );

create policy "Users insert own order items"
    on public.order_items for insert
    with check (
        exists (
            select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid()
        )
    );

-- ── addresses ────────────────────────────────────────────────────────────────

create table if not exists public.addresses (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    full_name     text,
    phone         text,
    address_line1 text,
    address_line2 text,
    city          text,
    state         text,
    pin_code      text,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now(),

    constraint addresses_user_id_key unique (user_id)
);

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at
    before update on public.addresses
    for each row execute function public.set_updated_at();

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

-- ── gift_orders ──────────────────────────────────────────────────────────────

create table if not exists public.gift_orders (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    product_id      text not null,
    product_name    text,
    recipient_name  text not null,
    recipient_email text,
    address_line1   text not null,
    address_line2   text,
    city            text not null,
    state           text not null,
    pin_code        text not null,
    note            text,
    send_teaser     boolean default false,
    created_at      timestamptz default now(),

    constraint gift_orders_user_product_key unique (user_id, product_id)
);

alter table public.gift_orders enable row level security;

drop policy if exists "Users can manage own gift orders" on public.gift_orders;

create policy "Users can manage own gift orders"
    on public.gift_orders for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── reviews ──────────────────────────────────────────────────────────────────

create table if not exists public.reviews (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    product_id    text not null,
    rating        smallint not null check (rating >= 1 and rating <= 5),
    comment       text not null,
    reviewer_name text,
    edit_count    smallint not null default 0,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now(),

    constraint reviews_user_product_key unique (user_id, product_id)
);

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
    before update on public.reviews
    for each row execute function public.reviews_on_update();

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews"     on public.reviews;
drop policy if exists "Users can insert own review" on public.reviews;
drop policy if exists "Users can update own review" on public.reviews;
drop policy if exists "Users can delete own review" on public.reviews;

create policy "Anyone can read reviews"
    on public.reviews for select
    using (true);

create policy "Users can insert own review"
    on public.reviews for insert
    with check (auth.uid() = user_id);

create policy "Users can update own review"
    on public.reviews for update
    using (auth.uid() = user_id);

create policy "Users can delete own review"
    on public.reviews for delete
    using (auth.uid() = user_id);
