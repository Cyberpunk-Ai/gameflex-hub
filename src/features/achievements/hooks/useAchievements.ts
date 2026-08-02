import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { achievementsService } from "@/services/achievements/AchievementsService";

export function useAllAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements.list,
    queryFn: () => achievementsService.getAll(),
    staleTime: 10 * 60 * 1000, // achievements rarely change
  });
}

export function useAchievements(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.achievements.userAchievements(userId),
    queryFn: () => achievementsService.getUserAchievements(userId),
    enabled: !!userId,
  });
}

export function useUserPoints(userId: string) {
  return useQuery({
    queryKey: ["achievements", "points", userId],
    queryFn: () => achievementsService.getUserPoints(userId),
    enabled: !!userId,
  });
}
