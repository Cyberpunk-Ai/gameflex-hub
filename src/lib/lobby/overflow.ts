/**
 * Lobby overflow: when a lobby fills up, players spill into the next numbered
 * lobby of the same tournament — #1, #2, #3 … — instead of being turned away.
 *
 * Pure functions only, so they can be unit-tested and reused by both the
 * player-facing rooms page and the admin lobby tools.
 */

export const DEFAULT_LOBBY_CAPACITY = 16;

export type LobbySource = {
  id: string;
  tournament_id?: string | null;
  created_at?: string | null;
  room_code?: string | null;
  capacity?: number | null;
  occupancy?: number | null;
  /** Persisted number, when the database already assigned one. */
  lobby_number?: number | null;
};

export type Lobby<T extends LobbySource = LobbySource> = T & {
  /** 1-based lobby index within its tournament. */
  lobbyNumber: number;
  /** Display tag, e.g. "#3". */
  lobbyTag: string;
  capacity: number;
  occupancy: number;
  seatsLeft: number;
  isFull: boolean;
  /** True when this lobby only exists because earlier lobbies filled up. */
  isOverflow: boolean;
  fillPercent: number;
};

export function formatLobbyTag(lobbyNumber: number): string {
  return `#${lobbyNumber}`;
}

function ordinalTime(value?: string | null): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

/**
 * Numbers lobbies per tournament in creation order. A persisted lobby_number is
 * always respected so tags stay stable across sessions; unnumbered lobbies fill
 * the lowest free numbers after those.
 */
export function assignLobbyNumbers<T extends LobbySource>(
  rooms: T[],
  options: { capacity?: number } = {},
): Lobby<T>[] {
  const fallbackCapacity = options.capacity ?? DEFAULT_LOBBY_CAPACITY;
  const groups = new Map<string, T[]>();

  for (const room of rooms) {
    const key = room.tournament_id ?? "__standalone__";
    const group = groups.get(key);
    if (group) group.push(room);
    else groups.set(key, [room]);
  }

  const output: Lobby<T>[] = [];

  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => ordinalTime(a.created_at) - ordinalTime(b.created_at));
    const taken = new Set<number>();

    for (const room of ordered) {
      if (typeof room.lobby_number === "number" && room.lobby_number > 0) {
        taken.add(room.lobby_number);
      }
    }

    let next = 1;
    const nextFreeNumber = () => {
      while (taken.has(next)) next += 1;
      taken.add(next);
      return next;
    };

    for (const room of ordered) {
      const lobbyNumber =
        typeof room.lobby_number === "number" && room.lobby_number > 0
          ? room.lobby_number
          : nextFreeNumber();

      const capacity = room.capacity && room.capacity > 0 ? room.capacity : fallbackCapacity;
      const occupancy = Math.max(0, Math.min(room.occupancy ?? 0, capacity));

      output.push({
        ...room,
        lobbyNumber,
        lobbyTag: formatLobbyTag(lobbyNumber),
        capacity,
        occupancy,
        seatsLeft: Math.max(0, capacity - occupancy),
        isFull: occupancy >= capacity,
        isOverflow: lobbyNumber > 1,
        fillPercent: capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0,
      });
    }
  }

  return output.sort((a, b) => {
    const tournament = String(a.tournament_id ?? "").localeCompare(String(b.tournament_id ?? ""));
    return tournament !== 0 ? tournament : a.lobbyNumber - b.lobbyNumber;
  });
}

/**
 * The lobby a joining player should land in: the lowest-numbered lobby of the
 * tournament that still has a seat.
 */
export function pickJoinableLobby<T extends LobbySource>(
  lobbies: Lobby<T>[],
  tournamentId?: string | null,
): Lobby<T> | null {
  const scoped = tournamentId
    ? lobbies.filter((lobby) => lobby.tournament_id === tournamentId)
    : lobbies;

  return (
    scoped
      .filter((lobby) => !lobby.isFull)
      .sort((a, b) => a.lobbyNumber - b.lobbyNumber)[0] ?? null
  );
}

/**
 * The number an overflow lobby should take when every existing lobby is full.
 * Returns null while a seat is still available, so callers never create an
 * unnecessary lobby.
 */
export function nextOverflowNumber<T extends LobbySource>(
  lobbies: Lobby<T>[],
  tournamentId?: string | null,
): number | null {
  const scoped = tournamentId
    ? lobbies.filter((lobby) => lobby.tournament_id === tournamentId)
    : lobbies;

  if (scoped.length === 0) return 1;
  if (scoped.some((lobby) => !lobby.isFull)) return null;
  return Math.max(...scoped.map((lobby) => lobby.lobbyNumber)) + 1;
}

export function summarizeLobbies<T extends LobbySource>(lobbies: Lobby<T>[]) {
  const capacity = lobbies.reduce((sum, lobby) => sum + lobby.capacity, 0);
  const occupancy = lobbies.reduce((sum, lobby) => sum + lobby.occupancy, 0);
  return {
    lobbies: lobbies.length,
    overflowLobbies: lobbies.filter((lobby) => lobby.isOverflow).length,
    full: lobbies.filter((lobby) => lobby.isFull).length,
    capacity,
    occupancy,
    seatsLeft: Math.max(0, capacity - occupancy),
  };
}
