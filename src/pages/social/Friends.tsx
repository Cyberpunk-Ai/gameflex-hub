import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getGamerAvatar } from "@/constants/avatars";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/social/follow-button";
import { SquadSuggestions } from "@/components/social/squad-suggestions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Gamepad2,
  Trophy,
  UserPlus,
  MessageCircle,
  Check,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Heart,
} from "lucide-react";

interface GamerProfile {
  user_id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  game_handle?: string | null;
  is_verified?: boolean | null;
  total_wins?: number | null;
  bio?: string | null;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mutual" | "following" | "followers" | "suggested">("mutual");
  const [searchQuery, setSearchQuery] = useState("");
  const [invitedSquads, setInvitedSquads] = useState<Record<string, boolean>>({});

  const { data: socialGraph = { mutual: [], following: [], followers: [] }, isLoading } = useQuery({
    queryKey: ["gameflex-social-graph", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { mutual: [], following: [], followers: [] };

      // 1. Fetch user follows (following and followers)
      const [{ data: followingRes }, { data: followersRes }] = await Promise.all([
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
        supabase.from("user_follows").select("follower_id").eq("following_id", user.id),
      ]);

      const followingSet = new Set((followingRes ?? []).map((f: any) => f.following_id));
      const followerSet = new Set((followersRes ?? []).map((f: any) => f.follower_id));

      const allIds = Array.from(new Set([...followingSet, ...followerSet]));

      if (allIds.length === 0) {
        return { mutual: [], following: [], followers: [] };
      }

      // 2. Fetch full profiles for all connected user IDs
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", allIds);

      const profileMap = new Map<string, GamerProfile>(
        (profiles ?? []).map((p: any) => [p.user_id, p as GamerProfile])
      );

      const mutualList: GamerProfile[] = [];
      const followingList: GamerProfile[] = [];
      const followersList: GamerProfile[] = [];

      allIds.forEach((id) => {
        const prof = profileMap.get(id);
        if (!prof) return;

        const isFollowing = followingSet.has(id);
        const isFollower = followerSet.has(id);

        if (isFollowing && isFollower) {
          mutualList.push(prof);
        }
        if (isFollowing) {
          followingList.push(prof);
        }
        if (isFollower) {
          followersList.push(prof);
        }
      });

      return {
        mutual: mutualList,
        following: followingList,
        followers: followersList,
      };
    },
  });

  const handleInviteSquad = (username: string, userId: string) => {
    setInvitedSquads((prev) => ({ ...prev, [userId]: true }));
    toast({
      title: "Squad Invitation Sent! 🎮",
      description: `Invited @${username} to join your competitive gaming squad.`,
    });
  };

  if (!user) {
    return (
      <SocialLayout title="Friends & Squads" subtitle="Connect with competitive gamers">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold font-display">Sign In Required</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to view your friends list, manage followers, and squad up for tournaments.
          </p>
          <Button asChild className="rounded-xl px-6">
            <Link to="/auth">Sign In to GameFlex</Link>
          </Button>
        </div>
      </SocialLayout>
    );
  }

  // Filter items by search query
  const filterProfiles = (list: GamerProfile[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.username?.toLowerCase().includes(query) ||
        p.full_name?.toLowerCase().includes(query) ||
        p.game_handle?.toLowerCase().includes(query)
    );
  };

  const currentList =
    activeTab === "mutual"
      ? filterProfiles(socialGraph.mutual)
      : activeTab === "following"
      ? filterProfiles(socialGraph.following)
      : activeTab === "followers"
      ? filterProfiles(socialGraph.followers)
      : [];

  return (
    <SocialLayout title="Friends & Squads" subtitle="Your GameFlex competitive social network">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* GameFlex Branding Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-2">
                  GameFlex Social Graph
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect, follow top players, build your tournament squad, and track gamer mutuals.
                </p>
              </div>
            </div>

            {/* Quick Stats Counter */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/50 text-center">
                <span className="block text-xs text-muted-foreground font-medium">Mutuals</span>
                <span className="text-sm font-bold text-primary">{socialGraph.mutual.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/50 text-center">
                <span className="block text-xs text-muted-foreground font-medium">Following</span>
                <span className="text-sm font-bold text-foreground">{socialGraph.following.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-secondary/50 border border-border/50 text-center">
                <span className="block text-xs text-muted-foreground font-medium">Followers</span>
                <span className="text-sm font-bold text-foreground">{socialGraph.followers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-secondary/40 border border-border/50 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("mutual")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "mutual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              Mutual Friends ({socialGraph.mutual.length})
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "following"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Following ({socialGraph.following.length})
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "followers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Followers ({socialGraph.followers.length})
            </button>
            <button
              onClick={() => setActiveTab("suggested")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "suggested"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Squad Suggestions
            </button>
          </div>

          {/* Search Input */}
          {activeTab !== "suggested" && (
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 rounded-xl bg-card border-border/60 focus-visible:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Tab Content Display */}
        {activeTab === "suggested" ? (
          <SquadSuggestions limit={12} title="Discover Top Gamers & Recommended Squadmates" />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary/30 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">
              {searchQuery ? "No gamers match your search" : "No players found in this list"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Try searching by another username or game handle.`
                : activeTab === "mutual"
                ? "You don't have mutual friends yet. Mutual friends follow each other on GameFlex!"
                : activeTab === "following"
                ? "You aren't following any gamers yet. Discover top players from squad suggestions below."
                : "You don't have any followers yet. Share your profile or invite teammates!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setActiveTab("suggested")} variant="outline" className="rounded-xl text-xs gap-1.5 mt-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Find Gamers to Follow
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentList.map((gamer) => {
              const isInvited = invitedSquads[gamer.user_id];

              return (
                <div
                  key={gamer.user_id}
                  className="flex flex-col justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Link to={`/player/${gamer.user_id}`} className="shrink-0 relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary transition-colors">
                        <AvatarImage src={gamer.avatar_url || getGamerAvatar(gamer.username)} />
                        <AvatarFallback className="font-bold bg-secondary text-sm">
                          {(gamer.username || "G").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full"
                        title="Online"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/player/${gamer.user_id}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                        >
                          {gamer.username}
                        </Link>
                        {gamer.is_verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verified Gamer" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {gamer.full_name || "GameFlex Player"}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {gamer.game_handle ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-background font-medium border-border/60">
                            <Gamepad2 className="h-2.5 w-2.5 mr-1 text-primary" />
                            {gamer.game_handle}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-background font-medium border-border/60">
                            <Trophy className="h-2.5 w-2.5 mr-1 text-yellow-500" />
                            {gamer.total_wins || 0} Wins
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-border/30">
                    <FollowButton
                      userId={gamer.user_id}
                      username={gamer.username}
                      size="sm"
                      className="flex-1 text-xs h-8 rounded-xl"
                    />

                    <Button
                      size="sm"
                      variant={isInvited ? "secondary" : "outline"}
                      disabled={isInvited}
                      onClick={() => handleInviteSquad(gamer.username, gamer.user_id)}
                      className="text-xs h-8 rounded-xl gap-1 px-2.5 shrink-0"
                      title="Invite to Squad"
                    >
                      {isInvited ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          Invited
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5 text-primary" />
                          Squad
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="text-xs h-8 w-8 p-0 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                      title="Direct Message"
                    >
                      <Link to={`/chat?user=${gamer.user_id}`}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Squad Suggestions bottom rail if active tab is not suggested */}
        {activeTab !== "suggested" && (
          <div className="pt-4">
            <SquadSuggestions limit={6} title="More Suggested Gamer Squadmates" />
          </div>
        )}
      </div>
    </SocialLayout>
  );
}
