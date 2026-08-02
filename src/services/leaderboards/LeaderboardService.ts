// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LeaderboardStats = Database["public"]["Tables"]["leaderboard_stats"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  rating: number;
  matches_played: number;
  matches_won: number;
  rank: number;
  game_id?: string;
}

export class LeaderboardService {
  async getGlobal(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("*, profiles!inner(username, avatar_url)")
        .order("rating", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data || []).map((row: any, i) => ({
        user_id: row.user_id,
        username: row.profiles?.username || "Unknown",
        avatar_url: row.profiles?.avatar_url,
        rating: row.rating,
        matches_played: row.matches_played,
        matches_won: row.matches_won,
        rank: offset + i + 1,
        game_id: row.game_id,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getByGame(game: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("*, profiles!inner(username, avatar_url)")
        .eq("game_id", game)
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any, i) => ({
        user_id: row.user_id,
        username: row.profiles?.username || "Unknown",
        avatar_url: row.profiles?.avatar_url,
        rating: row.rating,
        matches_played: row.matches_played,
        matches_won: row.matches_won,
        rank: i + 1,
        game_id: row.game_id,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getUserRank(userId: string): Promise<{ rank: number; stats: LeaderboardStats | null }> {
    try {
      // Basic implementation
      const { data: stats, error } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !stats) return { rank: 0, stats: null };

      // To get real rank, we need to count how many players have a higher rating
      const { count } = await supabase
        .from("leaderboard_stats")
        .select("*", { count: "exact", head: true })
        .gt("rating", stats.rating);

      return {
        rank: (count || 0) + 1,
        stats: stats as LeaderboardStats,
      };
    } catch (err) {
      return { rank: 0, stats: null };
    }
  }

  async updateStats(userId: string, stats: Partial<LeaderboardStats>): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase
        .from("leaderboard_stats")
        .update(stats as any)
        .eq("user_id", userId);

      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getTopPlayers(limit: number = 10): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("profiles!inner(*)")
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((d: any) => d.profiles) as Profile[];
    } catch (err) {
      return [];
    }
  }

  async getTournamentLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
    // Simplified stub since tournament leaderboards might depend on matches
    return [];
  }
}

export const leaderboardService = new LeaderboardService();
