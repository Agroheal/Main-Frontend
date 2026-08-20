-- ==============================================================================
-- AGROHEAL ADMIN SCHEMA, ROLES & ROW LEVEL SECURITY POLICIES
-- ==============================================================================
-- Run this migration in the Supabase SQL Editor to enable role-based access
-- control (RBAC), system configurations, and admin permissions.

-- 1. Add role column to profiles table
alter table public.profiles add column if not exists role text default 'user';
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. Create helper function to check admin status
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated, anon;

-- 3. Create system_configs table for dynamic policies, agreements & settings
create table if not exists public.system_configs (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS on system_configs
alter table public.system_configs enable row level security;

-- Everyone can read system configs (e.g. Terms of Use)
drop policy if exists "Anyone can read system_configs" on public.system_configs;
create policy "Anyone can read system_configs"
  on public.system_configs for select
  using (true);

-- Only admins can insert or update system configs
drop policy if exists "Admins can modify system_configs" on public.system_configs;
create policy "Admins can modify system_configs"
  on public.system_configs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 4. Seed initial default legal terms if not present
insert into public.system_configs (key, value)
values (
  'legal_agreement',
  jsonb_build_object(
    'title', 'Agroheal Membership & Farm Terms of Service',
    'content', E'# Agroheal LEAP — Terms of Service & Membership Agreement\n\n### 1. Platform Membership\nBy subscribing to the Agroheal LEAP Green Card program, members gain access to organic farming education, training modules, and the right to lease community farm slots.\n\n### 2. Farm Slots & Management\nFarm slots (e.g. Mushroom Village, Sweet Potatoes, Ginger) are leased under community group farm agreements. All monthly operational and setup contributions are allocated to farm management, security, and organic harvest distribution.\n\n### 3. Acceptance of Terms\nRegistration on the platform constitutes legal acceptance of these terms, organic farming guidelines, and platform referral rules.',
    'require_on_signup', true,
    'version', '1.0'
  )
)
on conflict (key) do nothing;

-- 5. Add Admin RLS policies to existing tables

-- Profiles: Admins can view & update all profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin(auth.uid()));

-- Slot Subscriptions: Admins can manage all slot records
drop policy if exists "Admins can manage slot_subscriptions" on public.slot_subscriptions;
create policy "Admins can manage slot_subscriptions"
  on public.slot_subscriptions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Other Payments: Admins can manage all payment logs
drop policy if exists "Admins can manage other_payments" on public.other_payments;
create policy "Admins can manage other_payments"
  on public.other_payments for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Subscriptions: Admins can view and manage all subscriptions
drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ==============================================================================
-- Helper query to set an initial admin user (replace with actual email):
-- update public.profiles set role = 'admin' where id in (
--   select id from auth.users where email = 'your-email@example.com'
-- );
-- ==============================================================================
