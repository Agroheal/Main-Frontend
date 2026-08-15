alter table profiles add column if not exists member_id text;
create sequence if not exists green_card_member_seq;

drop function if exists public.get_or_create_green_card_member_id(uuid, int);

create or replace function public.get_or_create_green_card_member_id(p_user_id uuid, p_join_year int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing text;
  seq_val bigint;
  new_id text;
begin
  select member_id into existing from profiles where id = p_user_id;
  if existing is not null then
    return existing;
  end if;

  seq_val := nextval('green_card_member_seq');
  new_id := 'AGC-' || lpad(seq_val::text, 5, '0') || '-' || p_join_year::text;

  update profiles set member_id = new_id where id = p_user_id;

  return new_id;
end;
$$;

grant execute on function public.get_or_create_green_card_member_id(uuid, int) to authenticated;
