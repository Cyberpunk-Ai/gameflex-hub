// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import {
  recommendationService,
  type RecommendationFeedType,
} from "@/services/recommendations/RecommendationService";

export function useRecommendations(feedType: RecommendationFeedType, userId?: string, limit = 20) {
  return useQuery({
    queryKey: ["recommendations", feedType, userId ?? "anon", limit],
    queryFn: () => recommendationService.fetchRecommendations(feedType, userId, limit),
    staleTime: 60_000,
    cacheTime: 120_000,
    enabled: !!feedType,
  });
}
