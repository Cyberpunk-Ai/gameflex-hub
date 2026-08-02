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
}

export const socialService = new SocialService();
