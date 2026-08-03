/**
 * Platform migration SQL, kept in the app so admins can copy, download, and
 * ship it with a backup. Mirrors supabase/migrations/*.sql exactly.
 *
 * Every statement is guarded, so running any of these against a database that
 * already has the objects is a no-op instead of an error, and nothing here
 * drops a table or deletes a row.
 */

export type PlatformMigration = {
  id: string;
  name: string;
  description: string;
  sql: string;
};

const SQUADS_AND_LOBBY_OVERFLOW = `-- ============================================================================
-- GameFlex platform migration — Squads (+ squad chat) & Lobby overflow
-- ----------------------------------------------------------------------------
-- Fully idempotent: every statement is guarded, so you can paste this into the
-- Supabase SQL editor as many times as you like without a single error.
-- Purely additive: it never drops a table, never deletes a row.
-- ============================================================================

-- ------------------------------------------------------------------ enums ----
do $guard$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'squad_role' and n.nspname = 'public'
  ) then
    create type public.squad_role as enum ('owner', 'captain', 'player', 'sub');
  end if;
end
$guard$;

-- ----------------------------------------------------------------- tables ----
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
  updated_at timestamptz not null default now()
);

create unique index if not exists squads_tag_key on public.squads (lower(tag));

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

create index if not exists squad_members_squad_idx on public.squad_members (squad_id);
create index if not exists squad_members_user_idx on public.squad_members (user_id);
create index if not exists squad_invites_user_idx on public.squad_invites (invited_user_id, status);
create index if not exists squad_messages_squad_idx on public.squad_messages (squad_id, created_at desc);

-- ----------------------------------------------------- Data API privileges ---
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

-- ------------------------------------------------------- helper functions ----
-- security definer so squad policies never recurse into squad_members RLS
create or replace function public.is_squad_member(_squad_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.squad_members
    where squad_id = _squad_id and user_id = _user_id
  )
$fn$;

create or replace function public.can_manage_squad(_squad_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.squad_members
    where squad_id = _squad_id
      and user_id = _user_id
      and role in ('owner', 'captain')
  )
$fn$;

grant execute on function public.is_squad_member(uuid, uuid) to authenticated, anon;
grant execute on function public.can_manage_squad(uuid, uuid) to authenticated;

-- --------------------------------------------------------------- policies ----
-- squads
drop policy if exists "Public squads are readable" on public.squads;
create policy "Public squads are readable" on public.squads
  for select using (is_public or public.is_squad_member(id, auth.uid()));

drop policy if exists "Users create their own squads" on public.squads;
create policy "Users create their own squads" on public.squads
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Owners and captains update squads" on public.squads;
create policy "Owners and captains update squads" on public.squads
  for update to authenticated using (public.can_manage_squad(id, auth.uid()));

drop policy if exists "Owners delete squads" on public.squads;
create policy "Owners delete squads" on public.squads
  for delete to authenticated using (auth.uid() = owner_id);

-- squad_members
drop policy if exists "Squad rosters are readable" on public.squad_members;
create policy "Squad rosters are readable" on public.squad_members
  for select using (true);

drop policy if exists "Join by accepting or as owner" on public.squad_members;
create policy "Join by accepting or as owner" on public.squad_members
  for insert to authenticated
  with check (auth.uid() = user_id or public.can_manage_squad(squad_id, auth.uid()));

drop policy if exists "Managers update roles" on public.squad_members;
create policy "Managers update roles" on public.squad_members
  for update to authenticated using (public.can_manage_squad(squad_id, auth.uid()));

drop policy if exists "Leave or be removed by a manager" on public.squad_members;
create policy "Leave or be removed by a manager" on public.squad_members
  for delete to authenticated
  using (auth.uid() = user_id or public.can_manage_squad(squad_id, auth.uid()));

-- squad_invites
drop policy if exists "See invites you sent or received" on public.squad_invites;
create policy "See invites you sent or received" on public.squad_invites
  for select to authenticated
  using (auth.uid() = invited_user_id or public.is_squad_member(squad_id, auth.uid()));

drop policy if exists "Managers send invites" on public.squad_invites;
create policy "Managers send invites" on public.squad_invites
  for insert to authenticated
  with check (auth.uid() = invited_by and public.can_manage_squad(squad_id, auth.uid()));

drop policy if exists "Respond to your invite or cancel as manager" on public.squad_invites;
create policy "Respond to your invite or cancel as manager" on public.squad_invites
  for update to authenticated
  using (auth.uid() = invited_user_id or public.can_manage_squad(squad_id, auth.uid()));

drop policy if exists "Managers delete invites" on public.squad_invites;
create policy "Managers delete invites" on public.squad_invites
  for delete to authenticated
  using (auth.uid() = invited_by or public.can_manage_squad(squad_id, auth.uid()));

-- squad_messages
drop policy if exists "Members read squad chat" on public.squad_messages;
create policy "Members read squad chat" on public.squad_messages
  for select to authenticated using (public.is_squad_member(squad_id, auth.uid()));

drop policy if exists "Members post to squad chat" on public.squad_messages;
create policy "Members post to squad chat" on public.squad_messages
  for insert to authenticated
  with check (auth.uid() = user_id and public.is_squad_member(squad_id, auth.uid()));

drop policy if exists "Authors delete their messages" on public.squad_messages;
create policy "Authors delete their messages" on public.squad_messages
  for delete to authenticated
  using (auth.uid() = user_id or public.can_manage_squad(squad_id, auth.uid()));

-- --------------------------------------------------------------- triggers ----
-- the creator is always seated as owner in the roster
create or replace function public.handle_new_squad()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.squad_members (squad_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (squad_id, user_id) do nothing;
  return new;
end
$fn$;

drop trigger if exists on_squad_created on public.squads;
create trigger on_squad_created
  after insert on public.squads
  for each row execute function public.handle_new_squad();

create or replace function public.touch_squad_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

drop trigger if exists on_squad_updated on public.squads;
create trigger on_squad_updated
  before update on public.squads
  for each row execute function public.touch_squad_updated_at();

-- --------------------------------------------------------------- realtime ----
do $guard$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'squad_messages'
    ) then
      alter publication supabase_realtime add table public.squad_messages;
    end if;
  end if;
end
$guard$;

alter table public.squad_messages replica identity full;

-- --------------------------------------------------------- lobby overflow ----
-- Numbered lobbies (#1, #2, #3 …) with automatic overflow once a lobby fills.
do $guard$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'game_rooms'
  ) then
    alter table public.game_rooms
      add column if not exists lobby_number integer not null default 1,
      add column if not exists capacity integer not null default 16,
      add column if not exists occupancy integer not null default 0;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'game_rooms'
        and column_name = 'tournament_id'
    ) then
      begin
        create unique index if not exists game_rooms_tournament_lobby_idx
          on public.game_rooms (tournament_id, lobby_number);
      exception when unique_violation then
        -- pre-existing lobbies share the default number 1; renumber them first
        with numbered as (
          select id, row_number() over (partition by tournament_id order by created_at, id) as rn
          from public.game_rooms
        )
        update public.game_rooms r
        set lobby_number = numbered.rn
        from numbered where numbered.id = r.id;

        create unique index if not exists game_rooms_tournament_lobby_idx
          on public.game_rooms (tournament_id, lobby_number);
      end;
    end if;
  end if;
end
$guard$;

-- Returns the lobby a joining player belongs in, creating the next numbered
-- overflow lobby (#2, #3, …) only when every existing lobby is full.
do $guard$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'game_rooms'
  ) then
    return;
  end if;

  execute $sql$
    create or replace function public.claim_lobby_seat(_tournament_id uuid)
    returns public.game_rooms
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      target public.game_rooms;
      next_number integer;
    begin
      select * into target
      from public.game_rooms
      where tournament_id = _tournament_id
        and occupancy < capacity
        and (expires_at is null or expires_at > now())
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
    end
    $fn$;
  $sql$;

  execute 'grant execute on function public.claim_lobby_seat(uuid) to authenticated';
end
$guard$;
`;

export const PLATFORM_MIGRATIONS: PlatformMigration[] = [
  {
    id: "20260101000000_squads_and_lobby_overflow",
    name: "Squads, squad chat & lobby overflow",
    description:
      "Creates squads, squad_members, squad_invites and squad_messages with RLS, " +
      "grants and realtime, then adds numbered lobbies (#1, #2, #3 …) with the " +
      "claim_lobby_seat overflow function.",
    sql: SQUADS_AND_LOBBY_OVERFLOW,
  },
];

/** One paste-ready script containing every platform migration, in order. */
export function buildPlatformSchemaSql(): string {
  return [
    "-- ============================================================",
    "-- GameFlex platform schema",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Idempotent and additive: safe to run on any GameFlex database.",
    "-- ============================================================",
    "",
    ...PLATFORM_MIGRATIONS.map((migration) =>
      [`-- >>> ${migration.id} — ${migration.name}`, migration.sql, ""].join("\n"),
    ),
  ].join("\n");
}
