// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlocked_at?: string;
}

export class AchievementsService {
  async getAll(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .limit(200)
        .order("points", { ascending: false });
      if (error) throw error;
      return data as Achievement[];
    } catch (err) {
      console.error("[AchievementsService] getAll:", err);
      return [];
    }
  }

  async getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
    try {
      const [allRes, userRes] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("*").eq("user_id", userId),
      ]);

      const all: Achievement[] = allRes.data ?? [];
      const unlocked: UserAchievement[] = userRes.data ?? [];
      const unlockedIds = new Set(unlocked.map((u) => u.achievement_id));

      return all.map((a) => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlocked_at: unlocked.find((u) => u.achievement_id === a.id)?.unlocked_at,
      }));
    } catch (err) {
      console.error("[AchievementsService] getUserAchievements:", err);
      return [];
    }
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, achievement_id: achievementId } as any);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  async getUserPoints(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievements!inner(points)")
        .eq("user_id", userId);
      return (data || []).reduce(
        (sum: number, row: any) => sum + (row.achievements?.points ?? 0),
        0,
      );
    } catch {
      return 0;
    }
  }

  async checkAndUnlock(
    userId: string,
    requirementType: string,
    value: number,
  ): Promise<Achievement[]> {
    try {
      const { data: candidates } = await supabase
        .from("achievements")
        .select("*")
        .eq("requirement_type", requirementType)
        .lte("requirement_value", value);

      if (!candidates?.length) return [];

      const { data: already } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);

      const alreadyIds = new Set((already || []).map((r: any) => r.achievement_id));
      const toUnlock = candidates.filter((a) => !alreadyIds.has(a.id));

      if (toUnlock.length) {
        await supabase
          .from("user_achievements")
          .insert(toUnlock.map((a) => ({ user_id: userId, achievement_id: a.id })) as any);
      }

      return toUnlock as Achievement[];
    } catch {
      return [];
    }
  }
}

export const achievementsService = new AchievementsService();
