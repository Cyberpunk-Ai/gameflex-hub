// @ts-nocheck
import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Wallet,
  Trophy,
  TrendingUp,
  Gamepad2,
  Star,
  ArrowRight,
  Edit,
  Phone,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuickActions } from "@/components/quick-actions";
import { AchievementsDisplay } from "@/components/achievements-display";
import { ActivityFeed } from "@/components/activity-feed";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { getLocalRegistrations } from "@/utils/local-registrations";

export default function Dashboard() {
  const { user, profile, isAuthenticated } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { data: registrations = [] } = useQuery({
    queryKey: ["user-registrations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      let dbData: any[] = [];
      try {
        const { data } = await supabase
          .from("registrations")
          .select("*, tournaments(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        dbData = data ?? [];
      } catch (e) {
        console.warn("Fetch dashboard registrations error:", e);
      }

      const localRegs = getLocalRegistrations().filter((r) => r.user_id === user.id);
      const dbTourneyIds = new Set(dbData.map((d) => d.tournament_id));
      for (const lr of localRegs) {
        if (!dbTourneyIds.has(lr.tournament_id)) {
          dbData.push(lr);
        }
      }

      return dbData;
    },
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["user-rewards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("rewards").select("*").eq("user_id", user.id).limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .limit(200)
        .order("points", { ascending: true });

      // Get user's earned achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id);

      const earnedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.earned_at]) ?? [],
      );

      return (allAchievements ?? []).map((a) => ({
        ...a,
        earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id),
      }));
    },
    enabled: !!user,
  });

  const { data: upcomingMatches = [] } = useQuery({
    queryKey: ["user-upcoming-matches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("matches")
        .select("*, tournaments(title, game)")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true })
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please login</h1>
        <Link to="/auth" className="text-primary hover:underline">
          Login
        </Link>
      </div>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earned);
  const winRate =
    stats?.wins && stats?.losses ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Card Header */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-4 border-primary/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary/20 font-bold">
                {profile?.username?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                {profile?.username ?? "Gamer"}
              </h1>
              {profile?.is_verified && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-2">
              {(profile as any)?.bio || "No bio yet - tell others about yourself!"}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {profile?.game_handle && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {profile.game_handle}
                </span>
              )}
              {profile?.phone && (
                <a
                  href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <Button onClick={() => setShowEditProfile(true)} className="shrink-0">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-4 md:p-6">
          <Wallet className="h-6 md:h-8 w-6 md:w-8 text-primary mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            KES {(profile?.wallet_balance ?? 0).toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Wallet Balance</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 p-4 md:p-6">
          <Trophy className="h-6 md:h-8 w-6 md:w-8 text-yellow-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            {stats?.tournaments_played ?? 0}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Tournaments</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 p-4 md:p-6">
          <TrendingUp className="h-6 md:h-8 w-6 md:w-8 text-green-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            {stats?.wins ?? 0}W - {stats?.losses ?? 0}L
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">{winRate}% Win Rate</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 p-4 md:p-6">
          <Gamepad2 className="h-6 md:h-8 w-6 md:w-8 text-accent mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">{stats?.points ?? 0}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Points</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 p-4 md:p-6">
          <Star className="h-6 md:h-8 w-6 md:w-8 text-orange-500 mb-2 md:mb-3" />
          <div className="font-display text-xl md:text-2xl font-bold">
            {earnedAchievements.length}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Achievements</div>
        </div>
      </div>

      {/* Upcoming Matches Alert */}
      {upcomingMatches.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h3 className="font-display font-bold">Upcoming Match!</h3>
                <p className="text-sm text-muted-foreground">
                  You have {upcomingMatches.length} match{upcomingMatches.length > 1 ? "es" : ""}{" "}
                  scheduled
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/my-matches">View Matches</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Achievements */}
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">Achievements</h2>
              <Badge variant="secondary">
                {earnedAchievements.length}/{achievements.length}
              </Badge>
            </div>
            <AchievementsDisplay achievements={achievements.slice(0, 5)} />
          </div>

          {/* Active Tournaments */}
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">My Tournaments</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tournaments">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {registrations.length > 0 ? (
              <div className="space-y-3">
                {registrations.map(
                  (r: any) =>
                    r.tournaments && (
                      <Link
                        key={r.id}
                        to={`/tournaments/${r.tournaments.id}`}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div>
                          <div className="font-semibold">{r.tournaments.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {r.tournaments.game?.toUpperCase()}
                          </div>
                        </div>
                        <Badge
                          variant={r.tournaments.status === "live" ? "destructive" : "secondary"}
                        >
                          {r.tournaments.status?.replace("_", " ")}
                        </Badge>
                      </Link>
                    ),
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No tournaments yet</p>
                <Button asChild>
                  <Link to="/tournaments">Browse Tournaments</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">Recent Rewards</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/rewards">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {rewards.length > 0 ? (
              <div className="space-y-3">
                {rewards.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <div className="font-semibold">{r.description}</div>
                      <Badge variant={r.status === "claimed" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                    <div className="font-display font-bold text-primary">
                      KES {Number(r.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No rewards yet. Win tournaments to earn!
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <div className="rounded-xl bg-card border border-border/50 p-6 flex flex-col">
            <h3 className="font-display font-bold mb-4">Live Activity</h3>
            <div className="flex-1 min-h-0">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal open={showEditProfile} onOpenChange={setShowEditProfile} />
    </div>
  );
}
