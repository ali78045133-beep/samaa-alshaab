# سماء الشعب - نظام إدارة البقالة

نظام ويب متكامل لإدارة البقالات الصغيرة والمتوسطة.

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Supabase
- اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
- احفظ **Project URL** و **Anon Key**

### 2. إنشاء الجداول
افتح SQL Editor في Supabase ونفذ الكود التالي:

```sql
-- المستخدمون
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  role text default 'employee',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- التصنيفات
create table categories (
  id serial primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- المنتجات
create table products (
  id serial primary key,
  name text not null,
  barcode text,
  category_id integer references categories(id),
  purchase_price decimal(10,2) default 0,
  sale_price decimal(10,2) default 0,
  quantity integer default 0,
  min_stock integer default 5,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- الموردين
create table suppliers (
  id serial primary key,
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- العملاء
create table customers (
  id serial primary key,
  name text not null,
  phone text,
  balance decimal(10,2) default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- المبيعات
create table sales (
  id serial primary key,
  customer_id integer references customers(id),
  total_amount decimal(10,2) default 0,
  discount decimal(10,2) default 0,
  paid_amount decimal(10,2) default 0,
  profit decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- عناصر المبيعات
create table sale_items (
  id serial primary key,
  sale_id integer references sales(id),
  product_id integer references products(id),
  quantity integer default 1,
  price decimal(10,2) default 0
);

-- المشتريات
create table purchases (
  id serial primary key,
  supplier_id integer references suppliers(id),
  total_amount decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- عناصر المشتريات
create table purchase_items (
  id serial primary key,
  purchase_id integer references purchases(id),
  product_id integer references products(id),
  quantity integer default 1,
  price decimal(10,2) default 0
);

-- حركة المخزون
create table stock_movements (
  id serial primary key,
  product_id integer references products(id),
  type text check (type in ('in', 'out')),
  quantity integer default 0,
  reference_type text,
  reference_id integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- الإعدادات
create table settings (
  id integer primary key default 1,
  store_name text default 'سماء الشعب',
  currency text default 'ر.س',
  tax_rate decimal(5,2) default 15,
  logo_url text
);

-- تفعيل RLS
alter table users enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table stock_movements enable row level security;
alter table settings enable row level security;

create policy "Enable all" on users for all using (true) with check (true);
create policy "Enable all" on products for all using (true) with check (true);
create policy "Enable all" on categories for all using (true) with check (true);
create policy "Enable all" on suppliers for all using (true) with check (true);
create policy "Enable all" on customers for all using (true) with check (true);
create policy "Enable all" on sales for all using (true) with check (true);
create policy "Enable all" on sale_items for all using (true) with check (true);
create policy "Enable all" on purchases for all using (true) with check (true);
create policy "Enable all" on purchase_items for all using (true) with check (true);
create policy "Enable all" on stock_movements for all using (true) with check (true);
create policy "Enable all" on settings for all using (true) with check (true);
```

### 3. ملف البيئة
```bash
cp .env.example .env
```
ثم عدل القيم في `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. التثبيت والتشغيل المحلي
```bash
npm install
npm run dev
```

### 5. النشر على Netlify
```bash
npm run build
```
- ارفع مجلد `dist` مباشرة إلى Netlify
- أو استخدم Git Integration مع ملف `netlify.toml` المرفق

## ✅ المميزات
- واجهة عربية RTL بالكامل
- الوضع الليلي / النهاري
- إدارة المنتجات مع دعم الباركود
- نقطة بيع سريعة (كاشير)
- إدارة الموردين والعملاء
- فواتير الشراء والمبيعات
- إدارة المخزون مع تنبيهات النفاد
- تقارير وإحصائيات تفاعلية
- تصدير CSV
- صلاحيات المستخدمين (مدير / موظف)
- تصميم Responsive

## 📄 الترخيص
جميع الحقوق محفوظة - سماء الشعب 2024
