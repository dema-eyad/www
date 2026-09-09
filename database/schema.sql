-- =========================================
-- سكيما قاعدة بيانات منتجات سيفيرا
-- شغّلي هاد الملف كامل مرة وحدة بـ Supabase:
-- Supabase Dashboard > SQL Editor > New query > الصقي الكود > Run
-- =========================================

create extension if not exists "pgcrypto";

create table if not exists products (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    price         numeric(10,2) not null default 0,
    image         text not null,
    category_page text not null,      -- مثلاً: bags / dresses / shoes / featured
    category_tag  text default '',    -- مثلاً: backpack / shoulder (تستخدم بفلاتر السريعة)
    colors_count  integer default 1,  -- شيلي = 1 لو ما في ألوان إضافية، أو حطي عدد الألوان
    sort_order    integer default 0,
    in_stock      boolean default true,
    created_at    timestamptz default now()
);

-- فهرس بيسرّع الاستعلامات حسب الصنف
create index if not exists idx_products_category_page on products (category_page);

-- تفعيل الحماية على مستوى الصفوف (Row Level Security)
alter table products enable row level security;

-- سياسة القراءة: أي حد (حتى الزوار) يقدر يقرأ المنتجات (لأن الموقع عام)
drop policy if exists "public can read products" on products;
create policy "public can read products"
    on products for select
    using (true);

-- سياسة الإضافة/التعديل/الحذف: بس المستخدم المسجّل دخول (يعني إنتِ من لوحة التحكم)
drop policy if exists "authenticated can insert products" on products;
create policy "authenticated can insert products"
    on products for insert
    to authenticated
    with check (true);

drop policy if exists "authenticated can update products" on products;
create policy "authenticated can update products"
    on products for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "authenticated can delete products" on products;
create policy "authenticated can delete products"
    on products for delete
    to authenticated
    using (true);
