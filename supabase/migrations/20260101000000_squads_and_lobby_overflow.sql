-- GameFlex: Squads (with squad chat) + lobby overflow numbering
-- Safe to run once on the existing GameFlex database. Purely additive.

-- ---------------------------------------------------------------- squads ----
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  description text,
  avatar_url text,
  banner_url text,
  game text,
  region text,
  is_public boolean not null default true,
  max_members integer not null default 12,
  owner_id uuid not null references auth.users(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tag)
);

create type public.squad_role as enum ('owner', 'captain', 'player', 'sub');

create table if not exists public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.squad_role not null default 'player',
  joined_at timestamptz not null default now(),
  unique (squad_id, user_id)
);

create table if not exists public.squad_invites (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (squad_id, invited_user_id)
);

create table if not exists public.squad_messages (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachment_url text,
  kind text not null default 'text' check (kind in ('text','image','system')),
  created_at timestamptz not null default now()
);

create index if not exists squad_members_squad_idx on public.squad_members(squad_id);
create index if not exists squad_members_user_idx on public.squad_members(user_id);
create index if not exists squad_invites_user_idx on public.squad_invites(invited_user_id, status);
create index if not exists squad_messages_squad_idx on public.squad_messages(squad_id, created_at desc);

-- Data API grants (required; RLS alone is not enough)
grant select on public.squads to anon;
grant select, insert, update, delete on public.squads to authenticated;
grant all on public.squads to service_role;

grant select on public.squad_members to anon;
grant select, insert, update, delete on public.squad_members to authenticated;
grant all on public.squad_members to service_role;

grant select, insert, update, delete on public.squad_invites to authenticated;
grant all on public.squad_invites to service_role;

grant select, insert, update, delete on public.squad_messages to authenticated;
grant all on public.squad_messages to service_role;

alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_invites enable row level security;
alter table public.squad_messages enable row level security;

-- Membership helper (security definer avoids recursive RLS)
create or replace function public.is_squad_member(_squad_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.squad_members
    where squad_id = _squad_id and user_id = _user_id
  )
$$;

create or replace function public.can_manage_squad(_squad_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.squad_members
    where squad_id = _squad_id
      and user_id = _user_id
      and role in ('owner', 'captain')
  )
$$;

-- squads
create policy "Public squads are readable" on public.squads
  for select using (is_public or public.is_squad_member(id, auth.uid()));
create policy "Users create their own squads" on public.squads
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners and captains update squads" on public.squads
  for update to authenticated using (public.can_manage_squad(id, auth.uid()));
create policy "Owners delete squads" on public.squads
  for delete to authenticated using (auth.uid() = owner_id);

-- squad_members
create policy "Squad rosters are readable" on public.squad_members
  for select using (true);
create policy "Join by accepting or as owner" on public.squad_members
  for insert to authenticated
  with check (
    auth.uid() = user_id
    or public.can_manage_squad(squad_id, auth.uid())
  );
create policy "Managers update roles" on public.squad_members
  for update to authenticated using (public.can_manage_squad(squad_id, auth.uid()));
create policy "Leave or be removed by a manager" on public.squad_members
  for delete to authenticated
  using (auth.uid() = user_id or public.can_manage_squad(squad_id, auth.uid()));

-- squad_invites
create policy "See invites you sent or received" on public.squad_invites
  for select to authenticated
  using (auth.uid() = invited_user_id or public.is_squad_member(squad_id, auth.uid()));
create policy "Managers send invites" on public.squad_invites
  for insert to authenticated
  with check (auth.uid() = invited_by and public.can_manage_squad(squad_id, auth.uid()));
create policy "Respond to your invite or cancel as manager" on public.squad_invites
  for update to authenticated
  using (auth.uid() = invited_user_id or public.can_manage_squad(squad_id, auth.uid()));
create policy "Managers delete invites" on public.squad_invites
  for delete to authenticated
  using (auth.uid() = invited_by or public.can_manage_squad(squad_id, auth.uid()));

-- squad_messages
create policy "Members read squad chat" on public.squad_messages
  for select to authenticated using (public.is_squad_member(squad_id, auth.uid()));
create policy "Members post to squad chat" on public.squad_messages
  for insert to authenticated
  with check (auth.uid() = user_id and public.is_squad_member(squad_id, auth.uid()));
create policy "Authors delete their messages" on public.squad_messages
  for delete to authenticated
  using (auth.uid() = user_id or public.can_manage_squad(squad_id, auth.uid()));

-- Creator automatically becomes the owner in the roster
create or replace function public.handle_new_squad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.squad_members (squad_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (squad_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_squad_created on public.squads;
create trigger on_squad_created
  after insert on public.squads
  for each row execute function public.handle_new_squad();

alter publication supabase_realtime add table public.squad_messages;

-- -------------------------------------------------------- lobby overflow ----
alter table public.game_rooms
  add column if not exists lobby_number integer not null default 1,
  add column if not exists capacity integer not null default 16,
  add column if not exists occupancy integer not null default 0;

create unique index if not exists game_rooms_tournament_lobby_idx
  on public.game_rooms(tournament_id, lobby_number);

-- Returns the lobby a joining player belongs in, creating the next numbered
-- overflow lobby (#2, #3, …) only when every existing lobby is full.
create or replace function public.claim_lobby_seat(_tournament_id uuid)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.game_rooms;
  next_number integer;
begin
  select * into target
  from public.game_rooms
  where tournament_id = _tournament_id
    and occupancy < capacity
    and expires_at > now()
  order by lobby_number
  limit 1
  for update;

  if target.id is null then
    select coalesce(max(lobby_number), 0) + 1 into next_number
    from public.game_rooms
    where tournament_id = _tournament_id;

    insert into public.game_rooms (tournament_id, room_code, expires_at, lobby_number, occupancy)
    values (
      _tournament_id,
      'GF-' || upper(substr(md5(random()::text), 1, 6)),
      now() + interval '6 hours',
      next_number,
      0
    )
    returning * into target;
  end if;

  update public.game_rooms
  set occupancy = occupancy + 1
  where id = target.id
  returning * into target;

  return target;
end;
$$;

grant execute on function public.claim_lobby_seat(uuid) to authenticated;
