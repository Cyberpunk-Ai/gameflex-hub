import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { tournamentService } from "@/services/tournaments/TournamentService";

export function useTournaments(filters?: { status?: string; game?: string; search?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.tournaments.all, filters],
    queryFn: () => tournamentService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tournaments.detail(id),
    queryFn: () => tournamentService.getById(id),
    enabled: !!id,
  });
}

export function useTournamentRegistrations(tournamentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tournaments.registrations(tournamentId),
    queryFn: () => tournamentService.getRegistrations(tournamentId),
    enabled: !!tournamentId,
  });
}

export function useTournamentMatches(tournamentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tournaments.matches(tournamentId),
    queryFn: () => tournamentService.getMatches(tournamentId),
    enabled: !!tournamentId,
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tournamentId,
      userId,
      gameHandle,
      paymentId,
    }: {
      tournamentId: string;
      userId: string;
      gameHandle: string;
      paymentId?: string;
    }) => tournamentService.joinTournament(tournamentId, userId, gameHandle, paymentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tournaments.registrations(vars.tournamentId),
      });
    },
  });
}

export function useUserRegistrations(userId: string) {
  return useQuery({
    queryKey: ["registrations", "user", userId],
    queryFn: () => tournamentService.getUserRegistrations(userId),
    enabled: !!userId,
  });
}
