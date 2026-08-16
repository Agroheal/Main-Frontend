drop function if exists public.get_green_card_community_members(uuid);

create or replace function public.get_green_card_community_members(leader_id uuid)
returns table (
  id uuid,
  full_name text,
  member_id text,
  joined_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.member_id, s.started_at as joined_at
  from profiles p
  join subscriptions s on s.user_id = p.id
  where p.referred_by = leader_id
    and s.plan = 'green_card'
    and s.status = 'active'
  order by s.started_at asc;
$$;

grant execute on function public.get_green_card_community_members(uuid) to authenticated;
