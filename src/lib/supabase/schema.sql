-- =============================================
-- TailorNow — Full Database Schema
-- Run this in Supabase SQL Editor (fresh project)
-- Built by Folub and Samuel Labs
-- =============================================

create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  email           text,
  phone           text,
  full_name       text not null default '',
  avatar_url      text,
  role            text not null default 'customer' check (role in ('customer','tailor','admin')),
  address         text,
  city            text,
  state           text,
  referral_code   text unique,
  referred_by     text,
  wallet_balance  numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view all profiles"     on public.profiles for select using (true);
create policy "Users can update own profile"    on public.profiles for update using (auth.uid() = id);
create policy "Service role can insert profile" on public.profiles for insert with check (true);

-- =============================================
-- MEASUREMENTS
-- =============================================
create table public.measurements (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null unique,
  chest         numeric,
  waist         numeric,
  hips          numeric,
  inseam        numeric,
  shoulder      numeric,
  sleeve_length numeric,
  neck          numeric,
  thigh         numeric,
  ankle         numeric,
  back_length   numeric,
  notes         text,
  updated_at    timestamptz default now()
);
alter table public.measurements enable row level security;
create policy "Users can manage own measurements" on public.measurements
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================
-- TAILOR PROFILES
-- =============================================
create table public.tailor_profiles (
  id                   uuid default uuid_generate_v4() primary key,
  user_id              uuid references public.profiles(id) on delete cascade not null unique,
  business_name        text not null,
  bio                  text,
  specialties          text[] default '{}',
  delivery_types       text[] default '{}',
  city                 text not null,
  state                text not null,
  address              text,
  latitude             numeric,
  longitude            numeric,
  is_verified          boolean default false,
  is_active            boolean default true,
  is_suspended         boolean default false,
  avg_rating           numeric default 0,
  total_reviews        integer default 0,
  total_orders         integer default 0,
  completion_rate      numeric default 0,
  response_time_hours  numeric,
  referral_count       integer default 0,
  created_at           timestamptz default now()
);
alter table public.tailor_profiles enable row level security;
create policy "Anyone can view active tailor profiles" on public.tailor_profiles for select using (true);
create policy "Tailors can update own profile" on public.tailor_profiles for update using (user_id = auth.uid());
create policy "Tailors can insert own profile" on public.tailor_profiles for insert with check (user_id = auth.uid());

-- =============================================
-- TAILOR SERVICES
-- =============================================
create table public.tailor_services (
  id               uuid default uuid_generate_v4() primary key,
  tailor_id        uuid references public.tailor_profiles(id) on delete cascade not null,
  service_type     text not null,
  title            text not null,
  description      text,
  base_price       numeric not null default 0,
  price_negotiable boolean default true,
  min_days         integer not null default 3,
  max_days         integer not null default 14,
  is_active        boolean default true
);
alter table public.tailor_services enable row level security;
create policy "Anyone can view tailor services" on public.tailor_services for select using (true);
create policy "Tailors can manage own services" on public.tailor_services
  using   (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()))
  with check (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()));

-- =============================================
-- PORTFOLIO
-- =============================================
create table public.portfolio_items (
  id           uuid default uuid_generate_v4() primary key,
  tailor_id    uuid references public.tailor_profiles(id) on delete cascade not null,
  image_url    text not null,
  title        text not null,
  description  text,
  service_type text,
  created_at   timestamptz default now()
);
alter table public.portfolio_items enable row level security;
create policy "Anyone can view portfolio" on public.portfolio_items for select using (true);
create policy "Tailors can manage own portfolio" on public.portfolio_items
  using   (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()))
  with check (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()));

-- =============================================
-- AVAILABILITY
-- =============================================
create table public.availability_slots (
  id            uuid default uuid_generate_v4() primary key,
  tailor_id     uuid references public.tailor_profiles(id) on delete cascade not null,
  date          date not null,
  is_available  boolean default true,
  note          text,
  unique(tailor_id, date)
);
alter table public.availability_slots enable row level security;
create policy "Anyone can view availability" on public.availability_slots for select using (true);
create policy "Tailors can manage own availability" on public.availability_slots
  using   (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()))
  with check (tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()));

-- =============================================
-- ORDERS
-- =============================================
create table public.orders (
  id                    uuid default uuid_generate_v4() primary key,
  customer_id           uuid references public.profiles(id) not null,
  tailor_id             uuid references public.tailor_profiles(id) not null,
  service_id            uuid references public.tailor_services(id),
  service_type          text not null,
  title                 text not null,
  description           text not null,
  delivery_type         text not null default 'pickup_delivery',
  pickup_address        text,
  delivery_address      text,
  status                text not null default 'pending' check (
    status in ('pending','accepted','measuring','in_progress','ready','out_for_delivery','delivered','completed','cancelled','disputed')
  ),
  agreed_price          numeric,
  deposit_amount        numeric,
  balance_amount        numeric,
  deposit_paid          boolean default false,
  balance_paid          boolean default false,
  paystack_ref          text,
  deadline              date,
  actual_delivery       timestamptz,
  style_reference_urls  text[] default '{}',
  notes                 text,
  is_group_order        boolean default false,
  group_size            integer,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Customers and tailors can view own orders" on public.orders for select
  using (
    customer_id = auth.uid() or
    tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Customers can create orders"  on public.orders for insert with check (customer_id = auth.uid());

-- Deferred measurement policy (requires orders table)
create policy "Tailors can view customer measurements for their orders" on public.measurements
  for select using (
    exists (
      select 1 from public.orders
      where orders.customer_id = measurements.user_id
        and orders.tailor_id in (
          select id from public.tailor_profiles where user_id = auth.uid()
        )
    )
  );
create policy "Order parties can update"     on public.orders for update
  using (
    customer_id = auth.uid() or
    tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================
-- DISPUTES
-- =============================================
create table public.disputes (
  id            uuid default uuid_generate_v4() primary key,
  order_id      uuid references public.orders(id) on delete cascade not null unique,
  raised_by     uuid references public.profiles(id) not null,
  reason        text not null,
  description   text not null,
  status        text not null default 'open' check (status in ('open','under_review','resolved_customer','resolved_tailor','refunded')),
  admin_notes   text,
  resolved_by   uuid references public.profiles(id),
  resolved_at   timestamptz,
  created_at    timestamptz default now()
);
alter table public.disputes enable row level security;
create policy "Parties can view own disputes" on public.disputes for select
  using (
    raised_by = auth.uid() or
    order_id in (
      select id from public.orders
      where customer_id = auth.uid()
         or tailor_id in (select id from public.tailor_profiles where user_id = auth.uid())
    ) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Users can raise disputes" on public.disputes for insert with check (raised_by = auth.uid());
create policy "Admin can update disputes"  on public.disputes for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- =============================================
-- RATINGS
-- =============================================
create table public.ratings (
  id            uuid default uuid_generate_v4() primary key,
  order_id      uuid references public.orders(id) on delete cascade not null,
  reviewer_id   uuid references public.profiles(id) not null,
  reviewee_id   uuid references public.profiles(id) not null,
  reviewer_role text not null check (reviewer_role in ('customer','tailor')),
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now(),
  unique(order_id, reviewer_id)
);
alter table public.ratings enable row level security;
create policy "Anyone can view ratings"       on public.ratings for select using (true);
create policy "Users can create own ratings"  on public.ratings for insert with check (reviewer_id = auth.uid());

-- =============================================
-- CHAT ROOMS
-- =============================================
create table public.chat_rooms (
  id              uuid default uuid_generate_v4() primary key,
  order_id        uuid references public.orders(id),
  customer_id     uuid references public.profiles(id) not null,
  tailor_id       uuid references public.profiles(id) not null,
  last_message    text,
  last_message_at timestamptz,
  unique(customer_id, tailor_id)
);
alter table public.chat_rooms enable row level security;
create policy "Room members can view rooms" on public.chat_rooms for select
  using (customer_id = auth.uid() or tailor_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Customers can create rooms"  on public.chat_rooms for insert with check (customer_id = auth.uid());
create policy "Members can update rooms"    on public.chat_rooms for update
  using (customer_id = auth.uid() or tailor_id = auth.uid());

-- =============================================
-- CHAT MESSAGES
-- =============================================
create table public.chat_messages (
  id            uuid default uuid_generate_v4() primary key,
  room_id       uuid references public.chat_rooms(id) on delete cascade not null,
  sender_id     uuid references public.profiles(id) not null,
  content       text not null,
  message_type  text default 'text' check (message_type in ('text','image','contact')),
  flagged       boolean default false,
  read          boolean default false,
  created_at    timestamptz default now()
);
alter table public.chat_messages enable row level security;
create policy "Room members can view messages" on public.chat_messages for select
  using (
    room_id in (
      select id from public.chat_rooms
      where customer_id = auth.uid() or tailor_id = auth.uid()
    )
  );
create policy "Room members can send messages" on public.chat_messages for insert
  with check (
    sender_id = auth.uid() and
    room_id in (
      select id from public.chat_rooms
      where customer_id = auth.uid() or tailor_id = auth.uid()
    )
  );
create policy "Senders can update own messages" on public.chat_messages for update
  using (sender_id = auth.uid());

-- =============================================
-- PAYOUTS
-- =============================================
create table public.payouts (
  id                uuid default uuid_generate_v4() primary key,
  tailor_id         uuid references public.tailor_profiles(id) not null,
  order_id          uuid references public.orders(id) not null unique,
  gross_amount      numeric not null,
  commission_rate   numeric not null default 0.10,
  commission_amount numeric not null,
  net_amount        numeric not null,
  status            text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  bank_name         text,
  account_number    text,
  account_name      text,
  paid_at           timestamptz,
  created_at        timestamptz default now()
);
alter table public.payouts enable row level security;
create policy "Tailors can view own payouts" on public.payouts for select
  using (
    tailor_id in (select id from public.tailor_profiles where user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin can update payouts" on public.payouts for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- =============================================
-- REFERRALS
-- =============================================
create table public.referrals (
  id              uuid default uuid_generate_v4() primary key,
  referrer_id     uuid references public.profiles(id) not null,
  referred_id     uuid references public.profiles(id) not null unique,
  referral_code   text not null,
  status          text not null default 'pending' check (status in ('pending','qualified','rewarded')),
  orders_completed integer default 0,
  bonus_paid      boolean default false,
  created_at      timestamptz default now()
);
alter table public.referrals enable row level security;
create policy "Users can view own referrals" on public.referrals for select
  using (referrer_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "System can insert referrals" on public.referrals for insert with check (true);
create policy "System can update referrals" on public.referrals for update with check (true);

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, full_name, role, referred_by)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'ref'
  );
  -- Track referral if code was passed
  if new.raw_user_meta_data->>'ref' is not null then
    insert into public.referrals (referrer_id, referred_id, referral_code)
    select p.id, new.id, new.raw_user_meta_data->>'ref'
    from public.profiles p
    where p.referral_code = new.raw_user_meta_data->>'ref'
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- TRIGGER: update tailor avg_rating on new rating
-- =============================================
create or replace function public.update_tailor_rating()
returns trigger as $$
begin
  update public.tailor_profiles
  set
    avg_rating = (
      select round(avg(r.rating)::numeric, 1)
      from public.ratings r
      join public.orders o on r.order_id = o.id
      where o.tailor_id = tailor_profiles.id
        and r.reviewer_role = 'customer'
    ),
    total_reviews = (
      select count(*)
      from public.ratings r
      join public.orders o on r.order_id = o.id
      where o.tailor_id = tailor_profiles.id
        and r.reviewer_role = 'customer'
    )
  where id in (select tailor_id from public.orders where id = new.order_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute procedure public.update_tailor_rating();

-- =============================================
-- TRIGGER: increment referral order count
-- =============================================
create or replace function public.track_referral_orders()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.referrals
    set orders_completed = orders_completed + 1,
        status = case when orders_completed + 1 >= 3 then 'qualified' else status end
    where referred_id in (
      select tp.user_id from public.tailor_profiles tp where tp.id = new.tailor_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_completed
  after update on public.orders
  for each row execute procedure public.track_referral_orders();
