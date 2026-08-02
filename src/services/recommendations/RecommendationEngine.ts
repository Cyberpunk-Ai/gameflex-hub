// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { userPreferenceEngine } from "./UserPreferenceEngine";
import type { RecommendationCandidate, RecommendationFeedType } from "./RecommendationService";
import { cleanupExpiredStories } from "@/lib/story-cleanup";

export class RecommendationEngine {
  /**
   * Main entry point to rank and deliver personalized recommendations for any feed.
   */
  async getRankedRecommendations(
    feedType: RecommendationFeedType,
    userId?: string | null,
    limit = 20,
  ): Promise<RecommendationCandidate[]> {
    if (feedType === "stories" || feedType === "home") {
      void cleanupExpiredStories();
    }

    // 1. Fetch User's Followed User IDs for Social Graph Boosting
    let followedUserIds: Set<string> = new Set();
    if (userId) {
      try {
        const { data: follows } = await supabase
          .from("user_followers")
          .select("following_id")
          .eq("follower_id", userId);
        if (follows) {
          followedUserIds = new Set(follows.map((f: any) => f.following_id));
        }
      } catch {
        // best effort social graph lookup
      }
    }

    // 2. Route candidate fetching & scoring by feed type
    switch (feedType) {
      case "stories":
        return this.rankStories(userId, followedUserIds, limit);
      case "reels":
        return this.rankReels(userId, followedUserIds, limit);
      case "explore":
        return this.rankExplore(userId, followedUserIds, limit);
      case "friends":
        return this.rankFriends(userId, followedUserIds, limit);
      case "home":
      default:
        return this.rankHomeFeed(userId, followedUserIds, limit);
    }
  }

  /**
   * Home Feed: Balanced personalization of followed users, active discussions, high engagement, fresh items.
   */
  private async rankHomeFeed(
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    limit: number,
  ): Promise<RecommendationCandidate[]> {
    const userVector = userPreferenceEngine.getUserVector(userId);

    // Fetch candidate posts (excluding expired stories)
    const { data: rawCandidates } = await supabase
      .from("user_statuses")
      .select("*")
      .is("expires_at", null)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 4, 100));

    if (!rawCandidates || rawCandidates.length === 0) {
      return [];
    }

    const candidates = rawCandidates.filter((item: any) => !userVector.hiddenEntities[item.id]);

    const scored = candidates.map((item: any) => {
      const score = this.calculatePostScore(item, userId, followedUserIds, userVector, {
        halfLifeHours: 36,
        followedBoost: 1.85,
        unseenBoost: 1.25,
      });

      return {
        id: item.id,
        type: "post",
        score,
        payload: item,
      };
    });

    // Sort descending by calculated score
    scored.sort((a, b) => b.score - a.score);

    // Apply Author Spacing Diversity (Instagram-style: don't show 5 posts in a row from same user)
    return this.applyAuthorSpacing(scored, limit);
  }

  /**
   * Reels Feed: Short video recommendation optimizing for video engagement, duration retention, and creator affinity.
   */
  private async rankReels(
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    limit: number,
  ): Promise<RecommendationCandidate[]> {
    const userVector = userPreferenceEngine.getUserVector(userId);

    const { data: rawCandidates } = await supabase
      .from("user_statuses")
      .select("*")
      .is("expires_at", null)
      .eq("media_type", "video")
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, 80));

    if (!rawCandidates || rawCandidates.length === 0) {
      return [];
    }

    const candidates = rawCandidates.filter((item: any) => !userVector.hiddenEntities[item.id]);

    const scored = candidates.map((item: any) => {
      let score = this.calculatePostScore(item, userId, followedUserIds, userVector, {
        halfLifeHours: 72, // Video clips stay relevant longer
        followedBoost: 1.4,
        unseenBoost: 1.35,
      });

      // Video watch history bonus
      const totalWatchSec = userVector.watchTimeSeconds[item.id] || 0;
      if (totalWatchSec > 5) {
        score *= 1.3;
      }

      return {
        id: item.id,
        type: "post",
        score,
        payload: item,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return this.applyAuthorSpacing(scored, limit);
  }

  /**
   * Stories Feed: Active stories ranking close connections first, unviewed stories, sorting by completion rate.
   */
  private async rankStories(
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    limit: number,
  ): Promise<RecommendationCandidate[]> {
    const userVector = userPreferenceEngine.getUserVector(userId);
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: rawCandidates } = await supabase
      .from("user_statuses")
      .select("*")
      .not("expires_at", "is", null)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, 60));

    if (!rawCandidates || rawCandidates.length === 0) {
      return [];
    }

    const candidates = rawCandidates.filter((item: any) => !userVector.hiddenEntities[item.id]);

    const scored = candidates.map((item: any) => {
      const isSeen = !!userVector.seenEntities[item.id];
      const isOwnStory = userId && item.user_id === userId;
      const isFollowed = followedUserIds.has(item.user_id);
      const authorAffinity = userVector.authorAffinities[item.user_id] || 0;

      // Base story score starts with recency
      const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
      let score = Math.exp(-ageHours / 12); // 12h half life

      // Unseen stories get huge priority bump (Instagram rail keeps unseen first)
      if (isOwnStory) {
        score += 100; // Own story always first
      } else if (!isSeen) {
        score *= 3.0;
      } else {
        score *= 0.3; // Seen stories pushed back
      }

      if (isFollowed) score *= 1.8;
      score *= 1.0 + Math.max(-0.5, authorAffinity * 0.15);

      return {
        id: item.id,
        type: "post",
        score,
        payload: item,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Explore Feed: Content similarity vector matching, viral posts, recommended media across categories, 80/20 discovery blend.
   */
  private async rankExplore(
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    limit: number,
  ): Promise<RecommendationCandidate[]> {
    const userVector = userPreferenceEngine.getUserVector(userId);

    const { data: rawCandidates } = await supabase
      .from("user_statuses")
      .select("*")
      .is("expires_at", null)
      .not("media_url", "is", null)
      .order("likes_count", { ascending: false })
      .limit(Math.max(limit * 3, 90));

    if (!rawCandidates || rawCandidates.length === 0) {
      return [];
    }

    const candidates = rawCandidates.filter((item: any) => !userVector.hiddenEntities[item.id]);

    const scored = candidates.map((item: any) => {
      // Explore favors high engagement and discovery over pure follow graph
      const isFollowed = followedUserIds.has(item.user_id);
      let score = this.calculatePostScore(item, userId, followedUserIds, userVector, {
        halfLifeHours: 168, // 7 days decay for explore grid
        followedBoost: 1.0, // Neutral boost on followed creators so user discovers new creators
        unseenBoost: 1.4,
      });

      // Mild penalty for already followed creators in Explore (to encourage new discovery)
      if (isFollowed) {
        score *= 0.85;
      }

      return {
        id: item.id,
        type: "post",
        score,
        payload: item,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return this.applyAuthorSpacing(scored, limit);
  }

  /**
   * Friends / Creators Recommendation Feed: Suggested profiles based on mutual follows, activity, shared interests.
   */
  private async rankFriends(
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    limit: number,
  ): Promise<RecommendationCandidate[]> {
    const userVector = userPreferenceEngine.getUserVector(userId);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .limit(100);

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Exclude self and already followed users
    const candidates = profiles.filter((p: any) => {
      if (userId && p.user_id === userId) return false;
      if (followedUserIds.has(p.user_id)) return false;
      return true;
    });

    const scored = candidates.map((p: any) => {
      const authorAffinity = userVector.authorAffinities[p.user_id] || 0;
      let score = 1.0;

      // Profile completeness bonus
      if (p.avatar_url) score += 0.5;
      if (p.bio) score += 0.3;
      if (p.is_verified) score += 1.0;

      // Affinity score from past interactions (e.g. liked their posts, viewed profile)
      score += Math.max(0, authorAffinity * 1.2);

      return {
        id: p.user_id,
        type: "user",
        score,
        payload: p,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Helper multi-factor candidate scoring model.
   */
  private calculatePostScore(
    item: any,
    userId: string | null | undefined,
    followedUserIds: Set<string>,
    userVector: any,
    options: { halfLifeHours: number; followedBoost: number; unseenBoost: number },
  ): number {
    const { halfLifeHours, followedBoost, unseenBoost } = options;

    const likes = item.likes_count || 0;
    const comments = item.comments_count || 0;
    const views = item.views_count || 0;
    const shares = item.shares_count || 0;

    // 1. Base Engagement Score (Logarithmic dampening to prevent mega viral posts from overwhelming everything)
    const rawEngagement = likes * 2.0 + comments * 3.5 + views * 0.15 + shares * 4.0;
    const baseScore = Math.log10(1 + rawEngagement) + 1.0;

    // 2. Exponential Time Decay Curve
    const createdAt = new Date(item.created_at || Date.now()).getTime();
    const ageHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
    const timeDecay = Math.exp(-ageHours / halfLifeHours);

    // 3. Follow Graph / Social Proof Boost
    const isFollowed = followedUserIds.has(item.user_id);
    const socialMultiplier = isFollowed ? followedBoost : 1.0;

    // 4. Personal User Affinities
    const authorAffinity = userVector.authorAffinities[item.user_id] || 0;
    const authorMultiplier = 1.0 + Math.max(-0.5, authorAffinity * 0.2);

    const mediaTypeKey = String(item.media_type || "text").toLowerCase().startsWith("video")
      ? "video"
      : String(item.media_type || "text").toLowerCase();
    const mediaTypeAffinity = userVector.mediaTypeAffinities[mediaTypeKey] || 0;
    const mediaMultiplier = 1.0 + Math.max(-0.4, mediaTypeAffinity * 0.15);

    // Topic / Hashtag Affinity matching
    let topicMultiplier = 1.0;
    const contentText = item.content || "";
    if (contentText) {
      const hashtags = contentText.match(/#[a-zA-Z0-9_]+/g) || [];
      hashtags.forEach((tag: string) => {
        const tagAff = userVector.topicAffinities[tag.toLowerCase()] || 0;
        if (tagAff !== 0) {
          topicMultiplier += Math.max(-0.3, tagAff * 0.1);
        }
      });
    }

    // 5. Freshness / Unseen Boost
    const isSeen = !!userVector.seenEntities[item.id];
    const freshnessMultiplier = isSeen ? 0.85 : unseenBoost;

    // Combined Score Formula
    const totalScore =
      baseScore *
      timeDecay *
      socialMultiplier *
      authorMultiplier *
      mediaMultiplier *
      topicMultiplier *
      freshnessMultiplier;

    // Ensure non-negative score
    return Math.max(0.001, totalScore);
  }

  /**
   * Diversity Filter: Penalizes consecutive posts from the same author to ensure feed variety.
   */
  private applyAuthorSpacing(
    scoredItems: RecommendationCandidate[],
    limit: number,
  ): RecommendationCandidate[] {
    const authorCounts: Record<string, number> = {};
    const reRanked: RecommendationCandidate[] = [];

    const remaining = [...scoredItems];

    while (remaining.length > 0 && reRanked.length < limit) {
      let bestIndex = 0;
      let bestAdjustedScore = -1;

      for (let i = 0; i < Math.min(remaining.length, 25); i++) {
        const candidate = remaining[i];
        const authorId = candidate.payload?.user_id || candidate.id;
        const count = authorCounts[authorId] || 0;

        // Apply progressive author penalty factor: 0.6^count
        const adjustedScore = candidate.score * Math.pow(0.55, count);

        if (adjustedScore > bestAdjustedScore) {
          bestAdjustedScore = adjustedScore;
          bestIndex = i;
        }
      }

      const selected = remaining.splice(bestIndex, 1)[0];
      const authorId = selected.payload?.user_id || selected.id;
      authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
      reRanked.push(selected);
    }

    return reRanked;
  }
}

export const recommendationEngine = new RecommendationEngine();
