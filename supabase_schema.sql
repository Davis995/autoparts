-- Enable UUID generation (usually already enabled in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================================
-- AUTH HELPER VIEW (REMOVED FOR SECURITY)
-- ============================================================================

-- NOTE:
-- A public.users view over auth.users can expose auth.users data to the
-- anon/authenticated roles via PostgREST. To avoid that, we drop it here.
-- If you need a helper view, create it in a private schema and/or expose
-- only non-sensitive fields with explicit GRANTs.

drop view if exists public.users;

-- ============================================================================
-- USER PROFILES
-- ============================================================================

create table if not exists public.user_profiles (
  id uuid primary key
    references auth.users (id) on delete cascade,

  email text not null unique,

  "firstName" text,
  "lastName" text,
  "emailVerified" boolean not null default false,
  "role" text not null default 'USER'
    check ("role" in ('USER', 'ADMIN')),

  phone text,
  "avatarUrl" text,
  "isAdmin" boolean not null default false,

  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- CATEGORIES
-- ============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  description text,
  image_url text,

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  "name" text not null,
  "slug" text unique,

  "description" text,
  "shortDescription" text,

  "price" numeric(10,2) not null,
  "comparePrice" numeric(10,2),
  "costPrice" numeric(10,2),

  "sku" text,
  "barcode" text,

  "trackInventory" boolean not null default true,
  -- App mostly uses "stock"
  "stock" integer not null default 0,
  "lowStockThreshold" integer not null default 0,

  "weight" numeric(10,2),
  "dimensions" jsonb,

  "categoryId" uuid
    references public.categories (id) on delete set null,

  "brand" text,
  "tags" text[] not null default '{}'::text[],
  "images" text[] not null default '{}'::text[],

  "isActive" boolean not null default true,
  "isFeatured" boolean not null default false,
  "isBestSelling" boolean not null default false,
  "isTopSelling" boolean not null default false,
  "newArrival" boolean not null default false,
  "onSale" boolean not null default false,

  "rating" numeric(3,2) not null default 0,
  "reviewCount" integer not null default 0,
  "soldCount" integer not null default 0,

  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_categoryId
  on public.products ("categoryId");

-- ============================================================================
-- PROMOTIONS
-- ============================================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),

  "title" text not null,
  "description" text,
  "image" text,
  "bannerText" text,
  "discount" numeric(10,2),

  "isActive" boolean not null default true,

  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

-- ==========================================================================
-- CART & CART ITEMS (DEPRECATED)
-- ==========================================================================

-- Cart is now handled entirely on the client via localStorage.
-- These tables are kept commented out so new environments don't create them,
-- but existing databases may still have them; drop manually if desired.

-- create table if not exists public.cart (
--   id uuid primary key default gen_random_uuid(),

--   "userId" uuid not null
--     references auth.users (id) on delete cascade,

--   created_at timestamptz not null default timezone('utc', now()),
--   updated_at timestamptz not null default timezone('utc', now()),

--   constraint cart_user_unique unique ("userId")
-- );

-- create table if not exists public.cart_items (
--   id uuid primary key default gen_random_uuid(),

--   "cartId" uuid not null
--     references public.cart (id) on delete cascade,

--   "productId" uuid not null
--     references public.products (id) on delete restrict,

--   quantity integer not null default 1,
--   price numeric(10,2) not null default 0,

--   created_at timestamptz not null default timezone('utc', now()),
--   updated_at timestamptz not null default timezone('utc', now())
-- );

-- create index if not exists idx_cart_items_cartId
--   on public.cart_items ("cartId");

-- create index if not exists idx_cart_items_productId
--   on public.cart_items ("productId");

-- ============================================================================
-- ORDERS & ORDER ITEMS
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  user_id uuid
    references auth.users (id) on delete set null,

  email text,
  phone text,
  location_name text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  distance_km numeric(10,2),
  transport_fee numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_method text not null default 'COD',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CASH_ON_DELIVERY', 'PAID', 'OUT_FOR_DELIVERY', 'DELIVERED')),

  -- legacy fields kept for compatibility
  total numeric(10,2) not null default 0,
  address text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_user_id
  on public.orders (user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders (id) on delete cascade,

  product_id uuid not null
    references public.products (id) on delete restrict,

  quantity integer not null default 1,
  price numeric(10,2) not null default 0,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id);

-- ============================================================================
-- STORAGE BUCKET (PRODUCT IMAGES)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ============================================================================
-- OPTIONAL: SIMPLE UPDATED-AT TRIGGER
-- ============================================================================

create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new."updatedAt" = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Attach to camelCase tables that use "updatedAt"
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_user_profiles_updated_at'
  ) then
    create trigger set_user_profiles_updated_at
    before update on public.user_profiles
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_products_updated_at'
  ) then
    create trigger set_products_updated_at
    before update on public.products
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_promotions_updated_at'
  ) then
    create trigger set_promotions_updated_at
    before update on public.promotions
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end $$;



-- allow upload of images to "product-images" bucket
CREATE POLICY "Product images upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() = owner
);

-- ==========================================================================
-- FAVORITES (SAVED ITEMS)
-- ==========================================================================

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),

  "userId" uuid not null
    references auth.users (id) on delete cascade,

  "productId" uuid not null
    references public.products (id) on delete cascade,

  "createdAt" timestamptz not null default timezone('utc', now()),

  constraint favorites_user_product_unique unique ("userId", "productId")
);

create index if not exists idx_favorites_userId
  on public.favorites ("userId");

create index if not exists idx_favorites_productId
  on public.favorites ("productId");
