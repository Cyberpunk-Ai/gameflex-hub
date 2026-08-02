// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ActivityItem = Database["public"]["Tables"]["activity_feed"]["Row"];
export type StatusItem = Database["public"]["Tables"]["user_statuses"]["Row"] & {
  profiles?: Profile;
  _count?: { likes: number; comments: number };
  liked?: boolean;
};

export class SocialService {
  async follow(followerId: string, followingId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getFollowers(userId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("profiles!user_follows_follower_id_fkey(*)")
        .eq("following_id", userId);
      if (error) return [];
      return (data || []).map((d: any) => d.profiles) as Profile[];
    } catch (err) {
      return [];
    }
  }

  async getFollowing(userId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("profiles!user_follows_following_id_fkey(*)")
        .eq("follower_id", userId);
      if (error) return [];
      return (data || []).map((d: any) => d.profiles) as Profile[];
    } catch (err) {
      return [];
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", followerId)
        .eq("following_id", followingId);
      return (count || 0) > 0;
    } catch {
      return false;
    }
  }

  async getActivityFeed(userId: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return data as ActivityItem[];
    } catch {
      return [];
    }
  }

  async createStatus(
    userId: string,
    content: string,
    imageUrl?: string,
  ): Promise<{ status: StatusItem | null; error?: Error }> {
    try {
      const { data, error } = await supabase
        .from("user_statuses")
        .insert({ user_id: userId, content, image_url: imageUrl })
        .select()
        .single();
      if (error) throw error;
      return { status: data as StatusItem };
    } catch (err: any) {
      return { status: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async deleteStatus(statusId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase.from("user_statuses").delete().eq("id", statusId);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async likeStatus(userId: string, statusId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase
        .from("status_likes")
        .insert({ user_id: userId, status_id: statusId });
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async unlikeStatus(userId: string, statusId: string): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase
        .from("status_likes")
        .delete()
        .eq("user_id", userId)
        .eq("status_id", statusId);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async commentOnStatus(
    userId: string,
    statusId: string,
    content: string,
  ): Promise<{ comment: any; error?: Error }> {
    try {
      const { data, error } = await supabase
        .from("status_comments")
        .insert({ user_id: userId, status_id: statusId, content })
        .select()
        .single();
      if (error) throw error;
      return { comment: data };
    } catch (err: any) {
      return { comment: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getStatusFeed(userId?: string, limit: number = 20): Promise<StatusItem[]> {
    try {
      let query = supabase
        .from("user_statuses")
        .select("*, profiles!inner(user_id, username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) return [];

      return (data ?? []) as unknown as StatusItem[];
    } catch {
      return [];
    }
  }

  /** Mutual follows = friends. */
  async getFriends(userId: string): Promise<Profile[]> {
    try {
      const [following, followers] = await Promise.all([
        this.getFollowing(userId),
        this.getFollowers(userId),
      ]);
      const followerIds = new Set(followers.filter(Boolean).map((p: any) => p.user_id ?? p.id));
      return following
        .filter(Boolean)
        .filter((p: any) => followerIds.has(p.user_id ?? p.id)) as Profile[];
    } catch {
      return [];
    }
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const friends = await this.getFriends(userId);
    return friends.map((p: any) => p.user_id ?? p.id).filter(Boolean);
  }

  /**
   * Posts authored by the user's friends (mutual follows). Falls back to the
   * people the user follows when there are no mutuals yet, so the tab is never
   * empty for someone who has only one-way follows.
   */
  async getFriendsFeed(
    userId: string,
    limit: number = 20,
  ): Promise<{ statuses: StatusItem[]; friendCount: number; usedFallback: boolean }> {
    try {
      let ids = await this.getFriendIds(userId);
      let usedFallback = false;

      if (ids.length === 0) {
        const following = await this.getFollowing(userId);
        ids = following.filter(Boolean).map((p: any) => p.user_id ?? p.id).filter(Boolean);
        usedFallback = ids.length > 0;
      }

      if (ids.length === 0) return { statuses: [], friendCount: 0, usedFallback: false };

      const { data, error } = await supabase
        .from("user_statuses")
        .select("*, profiles!inner(user_id, username, avatar_url)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return { statuses: [], friendCount: ids.length, usedFallback };

      const statuses = (data ?? []) as unknown as StatusItem[];
      const withCounts = await this.attachEngagement(statuses, userId);
      return { statuses: withCounts, friendCount: ids.length, usedFallback };
    } catch {
      return { statuses: [], friendCount: 0, usedFallback: false };
    }
  }

  /** Adds like/comment counts and the viewer's like state to a list of posts. */
  async attachEngagement(statuses: StatusItem[], viewerId?: string): Promise<StatusItem[]> {
    if (statuses.length === 0) return statuses;
    const ids = statuses.map((s) => s.id);

    try {
      const [likes, comments] = await Promise.all([
        supabase.from("status_likes").select("status_id, user_id").in("status_id", ids),
        supabase.from("status_comments").select("status_id").in("status_id", ids),
      ]);

      const likeRows = (likes.data ?? []) as { status_id: string; user_id: string }[];
      const commentRows = (comments.data ?? []) as { status_id: string }[];

      return statuses.map((status) => ({
        ...status,
        _count: {
          likes: likeRows.filter((l) => l.status_id === status.id).length,
          comments: commentRows.filter((c) => c.status_id === status.id).length,
        },
        liked: viewerId
          ? likeRows.some((l) => l.status_id === status.id && l.user_id === viewerId)
          : false,
      }));
    } catch {
      return statuses;
    }
  }
}

export const socialService = new SocialService();
