// @ts-nocheck
import { recommendationEngine } from "./RecommendationEngine";

export type RecommendationFeedType = "home" | "stories" | "reels" | "friends" | "explore";

export interface RecommendationCandidate<T = any> {
  id: string;
  type: string;
  score: number;
  payload: T;
}

export interface RecommendationResponse<T = any> {
  items: RecommendationCandidate<T>[];
}

export class RecommendationService {
  private readonly baseUrl = "/api/recommendations";

  async fetchRecommendations(
    feedType: RecommendationFeedType,
    userId?: string,
    limit = 20,
  ): Promise<RecommendationResponse> {
    const params = new URLSearchParams({
      feedType,
      limit: String(limit),
    });
    if (userId) params.set("userId", userId);

    // 1. Attempt optional server-side backend recommendation API
    try {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as RecommendationResponse;
        if (json?.items && json.items.length > 0) {
          return json;
        }
      }
    } catch {
      // Backend route unavailable or error, fall through to client engine
    }

    // 2. High-performance multi-signal Recommendation Engine
    try {
      const rankedItems = await recommendationEngine.getRankedRecommendations(
        feedType,
        userId,
        limit,
      );
      return { items: rankedItems };
    } catch (err) {
      console.error("[RecommendationService] Ranking error fallback:", err);
      return { items: [] };
    }
  }
}

export const recommendationService = new RecommendationService();

