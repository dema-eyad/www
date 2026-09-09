-- =========================================
-- سكيما جدول الطلبات (orders)
-- شغّلي هاد الملف بعد ما تكوني شغّلتي schema.sql
-- Supabase Dashboard > SQL Editor > New query > الصقي الكود > Run
-- =========================================

create table if not exists orders (
    id               uuid primary key default gen_random_uuid(),
    created_at       timestamptz default now(),
    items            jsonb not null,        -- قائمة المنتجات: [{sku, name, price, qty, subtotal}, ...]
    total            numeric(10,2) not null default 0,
    customer_name    text not null,
    customer_phone   text not null,
    customer_address text default '',
    notes            text default '',
    status           text default 'pending' -- pending / confirmed / delivered / cancelled
);

create index if not exists idx_orders_created_at on orders (created_at desc);

-- تفعيل الحماية على مستوى الصفوف
alter table orders enable row level security;

-- أي زبون (حتى بدون تسجيل دخول) يقدر "يضيف" طلب بس، ما يقدر يشوف طلبات غيره
drop policy if exists "anyone can insert an order" on orders;
create policy "anyone can insert an order"
    on orders for insert
    to anon, authenticated
    with check (true);

-- بس المستخدم المسجّل دخول (يعني إنتِ من لوحة التحكم) يقدر يشوف كل الطلبات
drop policy if exists "authenticated can read orders" on orders;
create policy "authenticated can read orders"
    on orders for select
    to authenticated
    using (true);

-- بس المستخدم المسجّل دخول يقدر يعدّل حالة الطلب (مثلاً pending -> confirmed)
drop policy if exists "authenticated can update orders" on orders;
create policy "authenticated can update orders"
    on orders for update
    to authenticated
    using (true)
    with check (true);

-- بس المستخدم المسجّل دخول يقدر يحذف طلب
drop policy if exists "authenticated can delete orders" on orders;
create policy "authenticated can delete orders"
    on orders for delete
    to authenticated
    using (true);
