import { useParams, Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGamerAvatar } from "@/constants/avatars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialLayout } from "@/components/social/social-nav";
import { FollowButton } from "@/components/social/follow-button";
import { SquadSuggestions } from "@/components/social/squad-suggestions";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import Achievements from "@/pages/Achievements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  Gamepad2,
  Users,
  TrendingUp,
  Star,
  MessageCircle,
  ArrowLeft,
  Medal,
  Target,
  Flame,
  Grid3x3,
  Film,
  BadgeCheck,
  Share2,
  Coins,
  Heart,
  Camera,
  Play,
  LayoutGrid,
  Square,
  MoreVertical,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { formatDistanceToNow } from "date-fns";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"posts" | "reels" | "matches" | "achievements">("posts");
  const [viewMode, setViewMode] = useState<"grid" | "cards">("grid");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Fetch target player profile
  const { data: player, isLoading } = useQuery({
    queryKey: ["player-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", id).maybeSingle();
      if (data) return data;
      const { data: byUsername } = await supabase.from("profiles").select("*").ilike("username", id).maybeSingle();
      if (byUsername) return byUsername;
      const { data: byId } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return byId ?? null;
    },
    enabled: !!id,
  });

  const targetUserId = player?.user_id || id;

  // Fetch player stats
  const { data: stats } = useQuery({
    queryKey: ["player-stats", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!targetUserId,
  });

  // Fetch player post & follower counts
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["player-profile-counts", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { posts: 0, followers: 0, following: 0 };

      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("user_statuses").select("id", { count: "exact", head: true }).eq("user_id", targetUserId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
      ]);

      return {
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    },
    enabled: !!targetUserId,
  });

  // Fetch player's posts (excluding story items)
  const { data: playerPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["player-user-posts", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from("user_statuses")
        .select(`
          *,
          user_status_likes(id, user_id),
          user_status_comments(id, content, created_at, user_id, profiles(username, avatar_url))
        `)
        .eq("user_id", targetUserId)
        .is("expires_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!targetUserId,
  });

  // Fetch player active stories / highlights
  const { data: playerStories = [] } = useQuery({
    queryKey: ["player-stories", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data } = await supabase
        .from("user_statuses")
        .select("*")
        .eq("user_id", targetUserId)
        .not("expires_at", "is", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!targetUserId,
  });

  // Fetch player achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["player-achievements", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", targetUserId);
      return data ?? [];
    },
    enabled: !!targetUserId,
  });

  // Fetch recent matches
  const { data: recentMatches = [] } = useQuery({
    queryKey: ["player-matches", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data } = await supabase
        .from("matches")
        .select("*, tournaments(title, game)")
        .or(`player1_id.eq.${targetUserId},player2_id.eq.${targetUserId}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
    enabled: !!targetUserId,
  });

  // Fetch Followers list
  const { data: followersList = [], isLoading: followersLoading } = useQuery({
    queryKey: ["player-followers-list", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data: rawData } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", targetUserId);
      if (!rawData || rawData.length === 0) {
        // Fallback to top active community gamers
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", targetUserId)
          .limit(5);
        return fallback ?? [];
      }
      const followerIds = rawData.map((r: any) => r.follower_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", followerIds);
      return profilesData ?? [];
    },
    enabled: followersModalOpen && !!targetUserId,
  });

  // Fetch Following list
  const { data: followingList = [], isLoading: followingLoading } = useQuery({
    queryKey: ["player-following-list", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data: rawData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", targetUserId);
      if (!rawData || rawData.length === 0) {
        // Fallback to top active community gamers
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", targetUserId)
          .limit(5);
        return fallback ?? [];
      }
      const followingIds = rawData.map((r: any) => r.following_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", followingIds);
      return profilesData ?? [];
    },
    enabled: followingModalOpen && !!targetUserId,
  });

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Profile Link Copied!",
        description: `Link to ${player?.username || "player"}'s profile copied to clipboard.`,
      });
    }
  };

  if (isLoading) {
    return (
      <SocialLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </SocialLayout>
    );
  }

  if (!player) {
    return (
      <SocialLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-display font-bold">Gamer Profile Not Found</h1>
          <p className="text-xs text-muted-foreground">The requested player profile does not exist or has been removed.</p>
          <Button asChild size="sm">
            <Link to="/leaderboard">View Leaderboards</Link>
          </Button>
        </div>
      </SocialLayout>
    );
  }

  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const isOwnProfile = !!user?.id && user.id === targetUserId;

  const filteredPosts = playerPosts.filter((p: any) => {
    if (tab === "reels") return p.media_type === "video";
    return p.media_type !== "video";
  });

  return (
    <SocialLayout>
      <div className="max-w-4xl mx-auto pb-16">
        {/* Back Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav(-1)}
            className="gap-2 text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Instagram Profile Header */}
        <div className="px-4 md:px-6 pt-2 pb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar with Story Gradient Border */}
            <div className="flex items-center gap-4 md:flex-col md:items-center shrink-0">
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-yellow-400">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={player.avatar_url || getGamerAvatar(player.username)} />
                  <AvatarFallback className="text-3xl font-display font-bold bg-secondary text-primary">
                    {player.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Mobile Username & Stats Row next to Avatar */}
              <div className="md:hidden flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display font-bold text-xl truncate">{player.username}</h1>
                  {player.is_verified && <BadgeCheck className="h-5 w-5 text-primary fill-primary/20 shrink-0" />}
                </div>

                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="font-bold text-foreground">{countsLoading ? "-" : counts?.posts}</span>{" "}
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <button onClick={() => setFollowersModalOpen(true)} className="text-left">
                    <span className="font-bold text-foreground">{countsLoading ? "-" : counts?.followers}</span>{" "}
                    <span className="text-muted-foreground">followers</span>
                  </button>
                  <button onClick={() => setFollowingModalOpen(true)} className="text-left">
                    <span className="font-bold text-foreground">{countsLoading ? "-" : counts?.following}</span>{" "}
                    <span className="text-muted-foreground">following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Info Box */}
            <div className="flex-1 space-y-4">
              {/* Desktop Username & Action Buttons */}
              <div className="hidden md:flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{player.username}</h1>
                  {player.is_verified && <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditProfile(true)}
                      className="rounded-xl font-semibold text-xs gap-1.5"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <FollowButton userId={player.user_id} username={player.username} size="sm" />
                      <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold text-xs gap-1.5">
                        <Link to={`/messages?user=${player.user_id}`}>
                          <MessageCircle className="h-3.5 w-3.5" />
                          Message
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Action Buttons */}
              {isOwnProfile ? (
                <div className="flex md:hidden gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditProfile(true)}
                    className="flex-1 rounded-xl font-semibold text-xs gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="flex md:hidden gap-2">
                  <FollowButton userId={player.user_id} username={player.username} size="sm" className="flex-1" />
                  <Button variant="outline" size="sm" asChild className="flex-1 rounded-xl font-semibold text-xs gap-1.5">
                    <Link to={`/messages?user=${player.user_id}`}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      Message
                    </Link>
                  </Button>
                </div>
              )}

              {/* Desktop Stats Row */}
              <div className="hidden md:flex gap-8 text-sm font-medium">
                <div>
                  <span className="font-bold text-foreground font-display text-base mr-1">
                    {countsLoading ? "-" : counts?.posts}
                  </span>{" "}
                  <span className="text-muted-foreground">posts</span>
                </div>

                <button onClick={() => setFollowersModalOpen(true)} className="hover:opacity-80 transition-opacity text-left">
                  <span className="font-bold text-foreground font-display text-base mr-1">
                    {countsLoading ? "-" : counts?.followers}
                  </span>{" "}
                  <span className="text-muted-foreground">followers</span>
                </button>

                <button onClick={() => setFollowingModalOpen(true)} className="hover:opacity-80 transition-opacity text-left">
                  <span className="font-bold text-foreground font-display text-base mr-1">
                    {countsLoading ? "-" : counts?.following}
                  </span>{" "}
                  <span className="text-muted-foreground">following</span>
                </button>
              </div>

              {/* Bio & Badges */}
              <div className="text-sm space-y-2">
                <div className="font-bold font-display text-base">
                  {(player as any)?.full_name ?? player.username}
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed max-w-lg">
                  {player.bio || "GameFlex Competitor 🎮 | Highlighting gameplay clips & tournament achievements."}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {player.game_handle && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg font-medium text-xs bg-secondary/80">
                      <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                      {player.game_handle}
                    </Badge>
                  )}
                  {stats?.wins !== undefined && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg font-medium text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      <Trophy className="h-3.5 w-3.5" />
                      {stats.wins} Wins ({winRate}%)
                    </Badge>
                  )}
                  {stats?.earnings !== undefined && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg font-medium text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Coins className="h-3.5 w-3.5" />
                      KES {((stats.earnings ?? 0) as number).toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Highlights Strip */}
        {playerStories.length > 0 && (
          <div className="flex gap-4 px-4 md:px-6 mb-6 overflow-x-auto scrollbar-hide pb-2 border-b border-border/40">
            {playerStories.map((story: any, i: number) => (
              <Link
                key={story.id}
                to="/stories"
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="h-16 w-16 md:h-18 md:w-18 rounded-full p-0.5 bg-gradient-to-tr from-primary via-emerald-400 to-yellow-400">
                  <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-secondary">
                    {story.media_url ? (
                      story.media_type === "video" ? (
                        <video src={story.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={optimizeImageUrl(story.media_url, { width: 200, quality: 75 })}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          alt="Highlight"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold">
                        TEXT
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] md:text-xs font-medium">Highlight {i + 1}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Profile Tabs Bar */}
        <div className="flex items-center justify-between border-b border-border/60 mb-6 px-4 md:px-0">
          <div className="flex items-center gap-6 md:gap-10">
            {[
              { id: "posts" as const, label: "POSTS", icon: Grid3x3 },
              { id: "reels" as const, label: "FLEXES", icon: Film },
              { id: "matches" as const, label: "MATCHES", icon: Gamepad2 },
              { id: "achievements" as const, label: "ACHIEVEMENTS", icon: Trophy },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors relative",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground/80"
                )}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {(tab === "posts" || tab === "reels") && (
            <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-lg border border-border/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "cards" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Card View"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* TAB 1 & 2: POSTS & FLEXES */}
        {(tab === "posts" || tab === "reels") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 md:px-0">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-none md:rounded-lg" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl p-8">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  {tab === "posts" ? <Camera className="h-8 w-8 text-muted-foreground" /> : <Film className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="font-display font-bold text-lg mb-1">
                  {tab === "posts" ? "No Posts Shared" : "No Flex Clips Uploaded"}
                </h3>
                <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                  {player.username} has not posted any {tab === "posts" ? "photos or statuses" : "video flex clips"} yet.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* Instagram 3x3 Photo Matrix View */
              <div className="grid grid-cols-3 gap-0.5 md:gap-2">
                {filteredPosts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPost(p)}
                    className="relative aspect-square bg-secondary group overflow-hidden md:rounded-lg block text-left"
                  >
                    {p.media_type === "video" ? (
                      <div className="w-full h-full relative">
                        <video src={p.media_url} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-md text-white">
                          <Play className="h-3.5 w-3.5 fill-white" />
                        </div>
                      </div>
                    ) : p.media_url ? (
                      <img
                        src={optimizeImageUrl(p.media_url, { width: 400, quality: 80 })}
                        loading="lazy"
                        decoding="async"
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full p-3 bg-gradient-to-br from-secondary to-card flex items-center justify-center text-center">
                        <p className="text-xs font-semibold line-clamp-4 text-foreground/90">{p.content}</p>
                      </div>
                    )}

                    {/* Hover Stats Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4 fill-white" />
                        <span>{p.user_status_likes?.length ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 fill-white" />
                        <span>{p.user_status_comments?.length ?? 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Cards Feed View */
              <div className="space-y-4">
                {filteredPosts.map((p: any) => (
                  <Card key={p.id} className="border-border/60 overflow-hidden rounded-2xl">
                    <div className="p-4 flex items-center justify-between border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/20">
                          <AvatarImage src={player.avatar_url ?? undefined} />
                          <AvatarFallback className="font-bold bg-secondary">
                            {player.username?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-sm">{player.username}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {p.content && <div className="p-4 text-sm font-medium">{p.content}</div>}

                    {p.media_url && (
                      <div className="bg-black flex items-center justify-center max-h-[450px] overflow-hidden">
                        {p.media_type === "video" ? (
                          <video src={p.media_url} controls className="w-full h-full object-contain" />
                        ) : (
                          <img loading="lazy" decoding="async" src={p.media_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: RECENT MATCHES */}
        {tab === "matches" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 px-4 md:px-0">
            {recentMatches.length > 0 ? (
              recentMatches.map((match: any) => (
                <Card key={match.id} className="rounded-xl border-border/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm">{match.tournaments?.title || "Tournament Match"}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {match.tournaments?.game || "GameFlex eSports"} • Round {match.round}
                    </p>
                  </div>
                  <Badge variant={match.winner_id === id ? "default" : "secondary"} className="rounded-lg font-bold">
                    {match.winner_id === id ? "VICTORY" : "DEFEAT"}
                  </Badge>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl p-8">
                <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No completed tournament matches recorded</p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: ACHIEVEMENTS */}
        {tab === "achievements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 md:px-0">
            <Achievements userId={id} />
          </motion.div>
        )}

        {/* Squad & Friends Suggestions Section */}
        <div className="px-4 md:px-0 mt-8 mb-6">
          <SquadSuggestions currentProfileId={id} title="Suggested Friends & Squadmates" />
        </div>

        {/* Followers Dialog */}
        <Dialog open={followersModalOpen} onOpenChange={setFollowersModalOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-center">Followers</DialogTitle>
              <DialogDescription className="text-center text-xs">
                People following {player?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {followersLoading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : followersList.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No followers yet</div>
              ) : (
                followersList.map((f: any) => (
                  <div key={f.user_id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors">
                    <Link
                      to={`/player/${f.user_id}`}
                      onClick={() => setFollowersModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={f.avatar_url || getGamerAvatar(f.username)} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {(f.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {f.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{f.full_name || "Gamer"}</div>
                      </div>
                    </Link>
                    {user?.id !== f.user_id && <FollowButton userId={f.user_id} username={f.username} size="sm" />}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following Dialog */}
        <Dialog open={followingModalOpen} onOpenChange={setFollowingModalOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-center">Following</DialogTitle>
              <DialogDescription className="text-center text-xs">
                People {player?.username} is following
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {followingLoading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : followingList.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Not following anyone yet</div>
              ) : (
                followingList.map((f: any) => (
                  <div key={f.user_id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors">
                    <Link
                      to={`/player/${f.user_id}`}
                      onClick={() => setFollowingModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={f.avatar_url || getGamerAvatar(f.username)} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {(f.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {f.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{f.full_name || "Gamer"}</div>
                      </div>
                    </Link>
                    {user?.id !== f.user_id && <FollowButton userId={f.user_id} username={f.username} size="sm" />}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Post Detail Modal */}
        <Dialog open={!!selectedPost} onOpenChange={(open) => { if (!open) setSelectedPost(null); }}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl bg-card border-border/60">
            <DialogHeader className="sr-only">
              <DialogTitle>Post Details</DialogTitle>
              <DialogDescription>View post details</DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                <div className="bg-black flex items-center justify-center max-h-[500px] overflow-hidden">
                  {selectedPost.media_type === "video" ? (
                    <video src={selectedPost.media_url} controls className="w-full h-full object-contain" />
                  ) : selectedPost.media_url ? (
                    <img loading="lazy" decoding="async" src={selectedPost.media_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-8 text-center">
                      <p className="font-display font-bold text-lg text-white">{selectedPost.content}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarImage src={player.avatar_url ?? undefined} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {player.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-sm">{player.username}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {selectedPost.content && (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{selectedPost.content}</p>
                    )}
                  </div>
                  {!isOwnProfile && (
                    <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                      <FollowButton userId={player.user_id} username={player.username} size="sm" />
                      <Button variant="outline" size="sm" asChild className="rounded-xl text-xs gap-1.5">
                        <Link to={`/messages?user=${player.user_id}`}>
                          <MessageCircle className="h-3.5 w-3.5" />
                          Message
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Profile Modal */}
        <EditProfileModal open={showEditProfile} onOpenChange={setShowEditProfile} />
      </div>
    </SocialLayout>
  );
}

