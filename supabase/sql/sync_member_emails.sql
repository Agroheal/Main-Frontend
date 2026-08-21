-- ==============================================================================
-- AGROHEAL MEMBER EMAILS MIGRATION & REAL-TIME SYNC
-- ==============================================================================
-- This migration ensures:
-- 1. `public.profiles` has an `email` column.
-- 2. All existing members are backfilled with their real email from `auth.users`.
-- 3. New signups automatically populate `email` in `public.profiles`.
-- 4. Email changes in `auth.users` automatically propagate to `public.profiles`.
-- 5. An admin-accessible RPC `get_admin_members()` safely returns profiles with
--    emails directly joined from `auth.users`.
-- ==============================================================================

-- 1. Ensure required columns exist in profiles table
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists member_id text;

create index if not exists idx_profiles_email on public.profiles(lower(email));
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. Backfill existing profile rows with their actual emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

-- 3. Update handle_new_user() trigger to save email on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  referrer_id uuid;
  incoming_ref text;
begin
  select string_agg(
    substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 36)::int + 1, 1),
    ''
  )
  into new_code
  from generate_series(1, 6);

  incoming_ref := new.raw_user_meta_data->>'referral_code';

  if incoming_ref is not null then
    select id into referrer_id
    from public.profiles
    where referral_code = incoming_ref;
  end if;

  insert into public.profiles (id, email, full_name, referral_code, referred_by, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    new_code,
    referrer_id,
    now()
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = case when public.profiles.full_name is null or public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Trigger to sync email changes from auth.users to profiles
create or replace function public.handle_update_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute function public.handle_update_user_email();

-- 5. RPC function to fetch members with real emails joined from auth.users
create or replace function public.get_admin_members()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  member_id text,
  referral_code text,
  referred_by uuid,
  role text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    p.id,
    coalesce(nullif(p.email, ''), u.email, '') as email,
    p.full_name,
    coalesce(p.phone, '') as phone,
    p.member_id,
    p.referral_code,
    p.referred_by,
    coalesce(p.role, 'user') as role,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at desc;
$$;

grant execute on function public.get_admin_members() to authenticated;

-- 6. RPC function for Admins to manually activate Green Card for a member (e.g. offline payment)
create or replace function public.admin_activate_green_card(
  p_user_id uuid,
  p_credit_referrer boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_member_id text;
  v_expires_at timestamptz;
  v_referrer_id uuid;
  v_is_first_activation boolean;
  v_tx_ref text;
begin
  -- Check if already has a subscription
  select not exists (
    select 1 from public.subscriptions where user_id = p_user_id and plan = 'green_card'
  ) into v_is_first_activation;

  -- Calculate 1 year expiry from now
  v_expires_at := now() + interval '1 year';

  -- Upsert active Green Card subscription
  delete from public.subscriptions where user_id = p_user_id and plan = 'green_card';
  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (p_user_id, 'green_card', 'active', now(), v_expires_at);

  -- Assign / Retrieve Member ID
  v_member_id := public.get_or_create_green_card_member_id(p_user_id, extract(year from now())::int);

  -- Record payment in other_payments log
  v_tx_ref := 'ADMIN_GC_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 4);
  insert into public.other_payments (
    user_id,
    payment_type,
    amount,
    slots,
    project_category,
    status,
    transaction_ref,
    created_at
  )
  values (
    p_user_id,
    'green_card_offline',
    1000,
    0,
    'Green Card Membership (Admin Offline Activation)',
    'success',
    v_tx_ref,
    now()
  );

  -- Credit referral earnings if first activation
  if p_credit_referrer and v_is_first_activation then
    select referred_by into v_referrer_id from public.profiles where id = p_user_id;
    if v_referrer_id is not null then
      begin
        perform public.increment_referral_earnings(v_referrer_id, 500);
      exception when others then
        null;
      end;
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'expires_at', v_expires_at
  );
end;
$$;

grant execute on function public.admin_activate_green_card(uuid, boolean) to authenticated;

