// @ts-nocheck
import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Swords, Trophy, Clock, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "@/lib/router-compat";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-500",
  live: "bg-green-500/20 text-green-500",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/20 text-red-500",
};

const MyMatches = () => {
  const { user, profile } = useAuth();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["my-matches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("matches")
        .select("*, tournaments(id, title, game)")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order("scheduled_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ["match-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, game_handle")
        .limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  const getProfile = (userId: string | null) => {
    if (!userId) return null;
    return profiles?.find((p) => p.user_id === userId);
  };

  const upcomingMatches =
    matches?.filter((m) => m.status === "scheduled" || m.status === "live") || [];
  const completedMatches =
    matches?.filter((m) => m.status === "completed" || m.status === "cancelled") || [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please log in to view your matches.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MatchCard = ({
    match,
  }: {
    match: typeof matches extends (infer T)[] | undefined ? T : never;
  }) => {
    if (!match) return null;
    const isPlayer1 = match.player1_id === user.id;
    const opponent = isPlayer1 ? getProfile(match.player2_id) : getProfile(match.player1_id);
    const myScore = isPlayer1 ? match.player1_score : match.player2_score;
    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
    const didWin = match.winner_id === user.id;

    return (
      <Card
        className={`border-border/50 bg-card/80 backdrop-blur-sm ${
          match.status === "live" ? "border-green-500/50 animate-pulse" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <Link to={`/tournaments/${match.tournament_id}`}>
                <CardTitle className="text-lg hover:text-primary transition-colors">
                  {match.tournaments?.title}
                </CardTitle>
              </Link>
              <CardDescription>
                Round {match.round} - Match {match.match_number}
              </CardDescription>
            </div>
            <Badge className={statusColors[match.status]}>
              {match.status === "live" && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              )}
              {match.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            {/* You */}
            <div className="text-center flex-1">
              <div
                className={`text-sm mb-1 ${match.status === "completed" && didWin ? "text-green-500" : ""}`}
              >
                {match.status === "completed" && didWin && (
                  <Trophy className="w-4 h-4 inline mr-1" />
                )}
                You
              </div>
              <p className="font-semibold">{profile?.username}</p>
              {match.status === "completed" && myScore !== null && (
                <p className="text-2xl font-bold mt-2">{myScore}</p>
              )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <Swords className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">VS</span>
            </div>

            {/* Opponent */}
            <div className="text-center flex-1">
              <div
                className={`text-sm mb-1 ${match.status === "completed" && !didWin && match.winner_id ? "text-green-500" : ""}`}
              >
                {match.status === "completed" && !didWin && match.winner_id && (
                  <Trophy className="w-4 h-4 inline mr-1" />
                )}
                Opponent
              </div>
              <p className="font-semibold">{opponent?.username || "TBD"}</p>
              {match.status === "completed" && opponentScore !== null && (
                <p className="text-2xl font-bold mt-2">{opponentScore}</p>
              )}
            </div>
          </div>

          {/* Match Time */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {match.scheduled_at
                ? format(new Date(match.scheduled_at), "MMM d, yyyy h:mm a")
                : "Time TBD"}
            </div>
            <Badge variant="outline">{match.tournaments?.game}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Swords className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">My Matches</h1>
            <p className="text-muted-foreground">Your tournament matches</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Matches */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Upcoming & Live Matches
              </h2>
              {upcomingMatches.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No upcoming matches</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Completed Matches */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Match History
              </h2>
              {completedMatches.length > 0 ? (
                <div className="grid gap-4">
                  {completedMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No match history yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMatches;
