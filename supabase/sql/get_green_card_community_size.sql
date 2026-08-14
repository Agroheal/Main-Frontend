drop function if exists public.get_green_card_community_size(uuid);

create or replace function public.get_green_card_community_size(leader_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select 1 + count(*)
  from profiles p
  join subscriptions s on s.user_id = p.id
  where p.referred_by = leader_id
    and s.plan = 'green_card'
    and s.status = 'active';
$$;

grant execute on function public.get_green_card_community_size(uuid) to authenticated;
