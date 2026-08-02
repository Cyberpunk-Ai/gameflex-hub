import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { leaderboardService } from "@/services/leaderboards/LeaderboardService";

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.leaderboard.global, limit],
    queryFn: () => leaderboardService.getGlobal(limit),
    staleTime: 60 * 1000,
  });
}

export function useLeaderboardByGame(game: string, limit = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.leaderboard.byGame(game), limit],
    queryFn: () => leaderboardService.getByGame(game, limit),
    enabled: !!game,
  });
}

export function useUserRank(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.userRank(userId),
    queryFn: () => leaderboardService.getUserRank(userId),
    enabled: !!userId,
  });
}

export function useTopPlayers(limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", "top", limit],
    queryFn: () => leaderboardService.getTopPlayers(limit),
  });
}
