// @ts-nocheck
import { RecommendationEvent } from "./RecommendationEventService";

export interface UserVector {
  authorAffinities: Record<string, number>;
  topicAffinities: Record<string, number>;
  mediaTypeAffinities: Record<string, number>;
  seenEntities: Record<string, number>; // entityId -> timestamp
  hiddenEntities: Record<string, boolean>;
  mutedAuthors: Record<string, boolean>;
  watchTimeSeconds: Record<string, number>; // entityId -> seconds
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = "gameflex_rec_vector_";

function getStorageKey(userId?: string | null): string {
  return `${STORAGE_KEY_PREFIX}${userId || "anon"}`;
}

export class UserPreferenceEngine {
  private memoryCache: Map<string, UserVector> = new Map();

  private getInitialVector(): UserVector {
    return {
      authorAffinities: {},
      topicAffinities: {},
      mediaTypeAffinities: {},
      seenEntities: {},
      hiddenEntities: {},
      mutedAuthors: {},
      watchTimeSeconds: {},
      updatedAt: Date.now(),
    };
  }

  public getUserVector(userId?: string | null): UserVector {
    const key = getStorageKey(userId);
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: UserVector = JSON.parse(stored);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Fallback on corrupt storage
    }

    const initial = this.getInitialVector();
    this.memoryCache.set(key, initial);
    return initial;
  }

  private saveUserVector(userId: string | null | undefined, vector: UserVector) {
    const key = getStorageKey(userId);
    vector.updatedAt = Date.now();
    this.memoryCache.set(key, vector);
    try {
      localStorage.setItem(key, JSON.stringify(vector));
    } catch {
      // Storage quota or browser constraint
    }
  }

  public recordEvent(event: RecommendationEvent) {
    const { userId, entityId, action, metadata } = event;
    const vector = this.getUserVector(userId);

    const authorId = metadata?.authorId || metadata?.user_id || metadata?.author_id;
    const mediaType = metadata?.mediaType || metadata?.media_type || metadata?.type;
    const contentText = metadata?.content || metadata?.text || metadata?.caption || "";
    const watchSeconds = typeof metadata?.duration === "number" ? metadata.duration : 0;

    // 1. Record Seen & Hidden
    vector.seenEntities[entityId] = Date.now();

    if (action === "hide" || action === "report") {
      vector.hiddenEntities[entityId] = true;
      if (authorId) {
        vector.authorAffinities[authorId] = (vector.authorAffinities[authorId] || 0) - 5;
      }
    }

    if (action === "unfollow") {
      if (authorId) {
        vector.authorAffinities[authorId] = (vector.authorAffinities[authorId] || 0) - 4;
      }
    }

    // 2. Update Author Affinity
    if (authorId && action !== "hide" && action !== "report") {
      let authorDelta = 0;
      switch (action) {
        case "like":
          authorDelta = 1.2;
          break;
        case "unlike":
          authorDelta = -0.8;
          break;
        case "comment":
          authorDelta = 2.0;
          break;
        case "share":
          authorDelta = 2.5;
          break;
        case "save":
          authorDelta = 2.2;
          break;
        case "follow":
          authorDelta = 3.5;
          break;
        case "view":
        case "story_view":
        case "reel_view":
          authorDelta = 0.3;
          break;
      }
      if (authorDelta !== 0) {
        const current = vector.authorAffinities[authorId] || 0;
        vector.authorAffinities[authorId] = Math.max(-10, Math.min(20, current + authorDelta));
      }
    }

    // 3. Update Media Type Affinity
    if (mediaType) {
      const typeKey = String(mediaType).toLowerCase().startsWith("video") ? "video" : String(mediaType).toLowerCase();
      let typeDelta = 0;
      if (["like", "comment", "share", "save"].includes(action)) {
        typeDelta = 0.5;
      } else if (["view", "story_view", "reel_view"].includes(action)) {
        typeDelta = 0.1;
      }
      if (typeDelta !== 0) {
        const current = vector.mediaTypeAffinities[typeKey] || 0;
        vector.mediaTypeAffinities[typeKey] = Math.max(-5, Math.min(10, current + typeDelta));
      }
    }

    // 4. Update Topic/Hashtag Affinity
    if (contentText && typeof contentText === "string") {
      const hashtags = contentText.match(/#[a-zA-Z0-9_]+/g) || [];
      if (hashtags.length > 0) {
        let tagDelta = 0;
        if (["like", "comment", "share", "save"].includes(action)) tagDelta = 0.8;
        else if (action === "view") tagDelta = 0.15;

        hashtags.forEach((tag) => {
          const cleanTag = tag.toLowerCase();
          const current = vector.topicAffinities[cleanTag] || 0;
          vector.topicAffinities[cleanTag] = Math.max(-5, Math.min(15, current + tagDelta));
        });
      }
    }

    // 5. Update Watch Duration Metrics
    if (watchSeconds > 0) {
      vector.watchTimeSeconds[entityId] = (vector.watchTimeSeconds[entityId] || 0) + watchSeconds;
      if (watchSeconds > 5 && authorId) {
        const current = vector.authorAffinities[authorId] || 0;
        vector.authorAffinities[authorId] = Math.min(20, current + 0.4);
      }
    }

    // Prune old seen items if count > 500 to save memory
    const keys = Object.keys(vector.seenEntities);
    if (keys.length > 500) {
      const sortedKeys = keys.sort((a, b) => vector.seenEntities[a] - vector.seenEntities[b]);
      sortedKeys.slice(0, 150).forEach((k) => {
        delete vector.seenEntities[k];
      });
    }

    this.saveUserVector(userId, vector);
  }

  public isEntityHidden(entityId: string, userId?: string | null): boolean {
    const vector = this.getUserVector(userId);
    return !!vector.hiddenEntities[entityId];
  }

  public isEntitySeen(entityId: string, userId?: string | null): boolean {
    const vector = this.getUserVector(userId);
    return !!vector.seenEntities[entityId];
  }
}

export const userPreferenceEngine = new UserPreferenceEngine();
