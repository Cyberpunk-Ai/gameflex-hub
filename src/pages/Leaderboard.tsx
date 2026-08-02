// @ts-nocheck
import { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { Trophy, Medal, TrendingUp, Crown, Phone, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { FollowButton } from "@/components/social/follow-button";
import { mockLeaderboard } from "@/lib/mock-data";
import { getGamerAvatar } from "@/constants/avatars";

export default function Leaderboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: leaderboard = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        const { data: statsData } = await supabase
          .from("leaderboard_stats")
          .select("*")
          .order("points", { ascending: false })
          .limit(50);

        if (statsData && statsData.length > 0) {
          const userIds = [...new Set(statsData.map((s) => s.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, username, avatar_url, game_handle, phone, bio")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

          return statsData.map((s) => ({
            ...s,
            profiles: profileMap.get(s.user_id),
          }));
        }
      } catch (e) {
        console.warn("Leaderboard fallback active");
      }
      return mockLeaderboard.map((m) => ({
        user_id: m.user_id,
        points: m.points,
        rank: m.rank,
        tournaments_played: Math.floor(m.points / 300) + 2,
        tournaments_won: Math.floor(m.points / 900) + 1,
        wins: Math.floor(m.points / 150),
        losses: Math.floor(m.points / 400),
        profiles: {
          username: m.username,
          avatar_url: getGamerAvatar(m.username),
          game_handle: m.game_handle,
          phone: "+2547****" + (1000 + ((m.rank * 137) % 8999)),
          bio: "Pro esports competitor & team strategist.",
        },
      }));
    },
  });

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboard_stats",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          toast({
            title: "📊 Leaderboard Updated",
            description: "Rankings have been refreshed with new results!",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-orange-500" />;
    return null;
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top players ranked by performance</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard
            </h1>
            <div className="text-muted-foreground flex items-center gap-2">
              <span>Top players ranked by performance</span>
              <Badge variant="outline" className="ml-2 text-xs gap-1">
                <Zap className="h-3 w-3 text-green-500" />
                Live Updates
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card border border-border/50">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No rankings yet</h3>
            <p className="text-muted-foreground">Join tournaments to appear on the leaderboard</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {leaderboard.slice(0, 3).map((player: any, index: number) => {
                const winRate = getWinRate(player.wins ?? 0, player.losses ?? 0);
                return (
                  <div
                    key={player.id}
                    className={`relative rounded-2xl p-6 text-center transition-transform hover:scale-[1.02] ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-yellow-900/20 border-yellow-500/40 md:order-2 shadow-lg shadow-yellow-500/10"
                        : index === 1
                          ? "bg-gradient-to-br from-gray-300/20 via-gray-400/10 to-gray-600/20 border-gray-400/40 md:order-1"
                          : "bg-gradient-to-br from-orange-400/20 via-orange-500/10 to-orange-700/20 border-orange-500/40 md:order-3"
                    } border-2`}
                  >
                    {/* Rank Badge */}
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-yellow-950"
                          : index === 1
                            ? "bg-gray-400 text-gray-900"
                            : "bg-orange-500 text-orange-950"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="text-5xl mb-4 mt-2">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </div>

                    <Link to={`/player/${player.user_id}`}>
                      <Avatar
                        className={`h-24 w-24 mx-auto mb-4 border-4 transition-transform hover:scale-105 ${
                          index === 0
                            ? "border-yellow-500/50"
                            : index === 1
                              ? "border-gray-400/50"
                              : "border-orange-500/50"
                        }`}
                      >
                        <AvatarImage src={player.profiles?.avatar_url || getGamerAvatar(player.profiles?.username)} />
                        <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                          {(player.profiles?.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <Link
                      to={`/player/${player.user_id}`}
                      className="hover:text-primary transition-colors"
                    >
                      <h3 className="font-display text-xl font-bold">
                        {player.profiles?.username ?? "Unknown"}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-sm mb-2">
                      {player.profiles?.game_handle ?? "-"}
                    </p>

                    {/* Bio snippet */}
                    {player.profiles?.bio && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                        "{player.profiles.bio}"
                      </p>
                    )}

                    <div className="font-display text-4xl font-bold text-primary mb-1">
                      {(player.points ?? 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Points</p>

                    <div className="flex justify-center gap-4 text-sm mb-3">
                      <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        {player.wins ?? 0}W
                      </div>
                      <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400">
                        {player.losses ?? 0}L
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {winRate}% Win Rate • KES {Number(player.earnings ?? 0).toLocaleString()}{" "}
                      earned
                    </div>

                    {/* WhatsApp Contact */}
                    {player.profiles?.phone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`https://wa.me/${player.profiles.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 mr-2 px-3 py-1.5 rounded-full bg-green-600/20 text-green-400 text-xs hover:bg-green-600/30 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            WhatsApp
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Contact via WhatsApp</TooltipContent>
                      </Tooltip>
                    )}
                    <FollowButton
                      userId={player.user_id}
                      username={player.profiles?.username}
                      size="sm"
                      showText={false}
                      className="mt-3"
                    />
                  </div>
                );
              })}
            </div>

            {/* Full Rankings Table */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-2 text-center">Record</div>
                <div className="col-span-2 text-center">Points</div>
                <div className="col-span-2 text-right">Earnings</div>
                <div className="col-span-1 text-center">Contact</div>
              </div>

              {leaderboard.map((player: any, index: number) => {
                const winRate = getWinRate(player.wins ?? 0, player.losses ?? 0);
                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-2 md:grid-cols-12 gap-4 p-4 border-t border-border/50 items-center hover:bg-secondary/30 transition-colors ${
                      index < 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center gap-2">
                      <span
                        className={`font-display font-bold text-lg ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-orange-500"
                                : ""
                        }`}
                      >
                        {index + 1}
                      </span>
                      {getRankIcon(index)}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                      <Link to={`/player/${player.user_id}`}>
                        <Avatar className="h-12 w-12 border-2 border-border transition-transform hover:scale-105">
                          <AvatarImage src={player.profiles?.avatar_url || getGamerAvatar(player.profiles?.username)} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {(player.profiles?.username ?? "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/player/${player.user_id}`}
                          className="font-semibold truncate block hover:text-primary transition-colors"
                        >
                          {player.profiles?.username ?? "Unknown"}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate">
                          {player.profiles?.game_handle ?? "-"}
                        </div>
                        {player.profiles?.bio && (
                          <div className="text-xs text-muted-foreground/70 truncate hidden lg:block">
                            {player.profiles.bio}
                          </div>
                        )}
                      </div>
                      <FollowButton
                        userId={player.user_id}
                        username={player.profiles?.username}
                        size="sm"
                        variant="ghost"
                        showText={false}
                      />
                    </div>

                    {/* Record */}
                    <div className="hidden md:flex col-span-2 justify-center items-center gap-2">
                      <span className="text-green-400 font-semibold">{player.wins ?? 0}W</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-400 font-semibold">{player.losses ?? 0}L</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {winRate}%
                      </Badge>
                    </div>

                    {/* Points */}
                    <div className="hidden md:block col-span-2 text-center">
                      <span className="font-display font-bold text-lg text-primary">
                        {(player.points ?? 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Earnings */}
                    <div className="hidden md:block col-span-2 text-right">
                      <span className="font-semibold text-green-400">
                        KES {Number(player.earnings ?? 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="hidden md:flex col-span-1 justify-center">
                      {player.profiles?.phone ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`https://wa.me/${player.profiles.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Contact on WhatsApp</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
