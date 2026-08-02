// @ts-nocheck
import {
  Trophy,
  Medal,
  Crown,
  Gamepad2,
  Shield,
  User,
  Users,
  Star,
  DollarSign,
  Gem,
  Lock,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  "gamepad-2": Gamepad2,
  shield: Shield,
  user: User,
  users: Users,
  star: Star,
  "dollar-sign": DollarSign,
  gem: Gem,
};

const categoryColors: Record<string, string> = {
  competition: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
  participation: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  profile: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  social: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  earnings: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
};

const categoryLabels: Record<string, string> = {
  competition: "Competition",
  participation: "Participation",
  profile: "Profile",
  social: "Social",
  earnings: "Earnings",
};

export default function Achievements({ userId }: { userId?: string } = {}) {
  const { user, isAuthenticated } = useAuth();
  const targetUserId = typeof userId === "string" ? userId : undefined;
  const activeUserId = targetUserId || user?.id;

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["user-achievements-full", activeUserId],
    queryFn: async () => {
      // Get all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .limit(200)
        .order("category", { ascending: true })
        .order("points", { ascending: true });

      if (!activeUserId) return allAchievements?.map((a) => ({ ...a, earned: false })) ?? [];

      // Get user's earned achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", activeUserId);

      const earnedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.earned_at]) ?? [],
      );

      return (allAchievements ?? []).map((a) => ({
        ...a,
        earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id),
      }));
    },
    enabled: !!activeUserId || !isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ["user-stats-for-achievements", activeUserId],
    queryFn: async () => {
      if (!activeUserId) return null;
      const { data } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", activeUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!activeUserId,
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-for-achievements", activeUserId],
    queryFn: async () => {
      if (!activeUserId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", activeUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!activeUserId,
  });

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["user-referrals-count", activeUserId],
    queryFn: async () => {
      if (!activeUserId) return 0;
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", activeUserId)
        .eq("status", "completed");
      return count ?? 0;
    },
    enabled: !!activeUserId,
  });

  const getProgress = (achievement: any): number => {
    if (achievement.earned) return 100;
    if (!stats && !profile) return 0;

    let current = 0;
    const required = achievement.requirement_value;

    switch (achievement.requirement_type) {
      case "wins":
        current = stats?.wins ?? 0;
        break;
      case "earnings":
        current = stats?.earnings ?? 0;
        break;
      case "tournaments":
        current = stats?.tournaments_played ?? 0;
        break;
      case "referrals":
        current = referralCount;
        break;
      case "profile_complete":
        current = profile?.username && profile?.bio && profile?.avatar_url ? 1 : 0;
        break;
      default:
        current = 0;
    }

    return Math.min(Math.round((current / required) * 100), 100);
  };

  const getCurrentValue = (achievement: any): string => {
    switch (achievement.requirement_type) {
      case "wins":
        return `${stats?.wins ?? 0}/${achievement.requirement_value}`;
      case "earnings":
        return `KES ${(stats?.earnings ?? 0).toLocaleString()}/${achievement.requirement_value.toLocaleString()}`;
      case "tournaments":
        return `${stats?.tournaments_played ?? 0}/${achievement.requirement_value}`;
      case "referrals":
        return `${referralCount}/${achievement.requirement_value}`;
      case "profile_complete":
        return profile?.username && profile?.bio && profile?.avatar_url ? "Complete" : "Incomplete";
      default:
        return `0/${achievement.requirement_value}`;
    }
  };

  // Group by category
  const groupedAchievements = achievements.reduce((acc: Record<string, any[]>, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalPoints = achievements.filter((a) => a.earned).reduce((sum, a) => sum + a.points, 0);

  if (!isAuthenticated && !activeUserId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold mb-4">Achievements</h1>
        <p className="text-muted-foreground mb-6">
          Login to track your achievements and earn badges!
        </p>
        <Button asChild>
          <Link to="/auth">Login to View</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={userId ? "py-2" : "container mx-auto px-4 py-8"}>
      {/* Header - hide top title if embedded in profile with userId */}
      {!userId && (
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">Earn badges by completing challenges and milestones</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-4 md:p-6">
          <Trophy className="h-6 md:h-8 w-6 md:w-8 text-primary mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            {earnedCount}/{achievements.length}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Earned</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 p-4 md:p-6">
          <Star className="h-6 md:h-8 w-6 md:w-8 text-yellow-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">{totalPoints}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Total Points</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 p-4 md:p-6">
          <Medal className="h-6 md:h-8 w-6 md:w-8 text-green-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">{stats?.wins ?? 0}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Wins</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 p-4 md:p-6">
          <Gamepad2 className="h-6 md:h-8 w-6 md:w-8 text-purple-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            {stats?.tournaments_played ?? 0}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Tournaments</div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      )}

      {/* Achievements by Category */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category} className="mb-10">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("px-3", categoryColors[category]?.split(" ")[2])}
            >
              {categoryLabels[category] || category}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((achievement: any) => {
              const IconComponent = iconMap[achievement.icon] || Trophy;
              const colorClass = categoryColors[achievement.category] || categoryColors.competition;
              const progress = getProgress(achievement);

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative p-5 rounded-xl bg-gradient-to-br border transition-all",
                    colorClass,
                    achievement.earned ? "opacity-100" : "opacity-60",
                  )}
                >
                  {achievement.earned && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {!achievement.earned && (
                    <div className="absolute top-3 right-3">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center shrink-0",
                        achievement.earned ? "bg-primary/20" : "bg-secondary",
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "h-7 w-7",
                          achievement.earned ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold mb-1">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">
                          {getCurrentValue(achievement)}
                        </span>
                        <Badge variant="secondary">{achievement.points} pts</Badge>
                      </div>
                      {!achievement.earned && <Progress value={progress} className="h-2" />}
                      {achievement.earned && achievement.earned_at && (
                        <p className="text-xs text-green-500">
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {achievements.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No achievements available yet</p>
        </div>
      )}
    </div>
  );
}
