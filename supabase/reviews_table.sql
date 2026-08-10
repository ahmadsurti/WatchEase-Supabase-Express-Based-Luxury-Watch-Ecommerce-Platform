-- ─────────────────────────────────────────────────────────────────────────
-- WatchEase — reviews table
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────

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

    -- One review per user per product
    constraint reviews_user_product_key unique (user_id, product_id)
);

-- Auto-update updated_at AND increment edit_count on every update
create or replace function public.reviews_on_update()
returns trigger language plpgsql as $$
begin
    new.updated_at  = now();
    new.edit_count  = old.edit_count + 1;
    return new;
end;
$$;

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
    before update on public.reviews
    for each row execute function public.reviews_on_update();

-- RLS
alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews"        on public.reviews;
drop policy if exists "Users can insert own review"    on public.reviews;
drop policy if exists "Users can update own review"    on public.reviews;
drop policy if exists "Users can delete own review"    on public.reviews;

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
