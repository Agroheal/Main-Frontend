drop function if exists public.get_or_create_referral_code(uuid);

create or replace function public.get_or_create_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing text;
  new_code text;
begin
  select referral_code into existing from profiles where id = p_user_id;
  if existing is not null then
    return existing;
  end if;

  -- Same 6-character alphanumeric style already used when profiles are
  -- first created (see verify-payment's Math.random().toString(36) code).
  select string_agg(
    substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 36)::int + 1, 1),
    ''
  )
  into new_code
  from generate_series(1, 6);

  update profiles set referral_code = new_code where id = p_user_id;

  return new_code;
end;
$$;

grant execute on function public.get_or_create_referral_code(uuid) to authenticated;
