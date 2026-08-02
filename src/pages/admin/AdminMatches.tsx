// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Swords, Trophy, Loader2, Play, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  live: "bg-green-500/20 text-green-500 border-green-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/30",
};

export default function AdminMatches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [formData, setFormData] = useState({
    tournament_id: "",
    round: 1,
    match_number: 1,
    player1_id: "",
    player2_id: "",
    scheduled_at: "",
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, title, game")
        .in("status", ["live", "registration_open", "registration_closed", "upcoming"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["admin-matches", tournamentFilter],
    queryFn: async () => {
      let query = supabase
        .from("matches")
        .select("*, tournaments(id, title, game)")
        .limit(200)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (tournamentFilter !== "all") {
        query = query.eq("tournament_id", tournamentFilter);
      }

      const { data } = await query;
      if (!data || data.length === 0) return [];

      // Fetch player profiles
      const playerIds = [
        ...new Set([
          ...data.map((m) => m.player1_id).filter(Boolean),
          ...data.map((m) => m.player2_id).filter(Boolean),
        ]),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, game_handle")
        .in("user_id", playerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((m) => ({
        ...m,
        player1: profileMap.get(m.player1_id),
        player2: profileMap.get(m.player2_id),
        winner: m.winner_id ? profileMap.get(m.winner_id) : null,
      }));
    },
  });

  const { data: confirmedPlayers = [] } = useQuery({
    queryKey: ["confirmed-players", formData.tournament_id],
    queryFn: async () => {
      if (!formData.tournament_id) return [];
      const { data } = await supabase
        .from("registrations")
        .select("user_id, game_handle")
        .eq("tournament_id", formData.tournament_id)
        .eq("status", "confirmed");

      if (!data || data.length === 0) return [];

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((r) => ({
        user_id: r.user_id,
        username: profileMap.get(r.user_id)?.username ?? "Unknown",
        game_handle: r.game_handle,
      }));
    },
    enabled: !!formData.tournament_id,
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("matches").insert({
        tournament_id: data.tournament_id,
        round: data.round,
        match_number: data.match_number,
        player1_id: data.player1_id || null,
        player2_id: data.player2_id || null,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast({ title: "Match Created" });
      setIsCreateOpen(false);
      setFormData({
        tournament_id: "",
        round: 1,
        match_number: 1,
        player1_id: "",
        player2_id: "",
        scheduled_at: "",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, status, player1_score, player2_score, winner_id }: any) => {
      const update: any = { status };
      if (player1_score !== undefined) update.player1_score = player1_score;
      if (player2_score !== undefined) update.player2_score = player2_score;
      if (winner_id) {
        update.winner_id = winner_id;
        update.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from("matches").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });

      // Invalidate leaderboard queries to reflect new stats in real-time
      if (variables.winner_id) {
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["user-stats"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard-stats"] });
        toast({
          title: "✅ Match Completed!",
          description:
            "Leaderboard updated with new stats, achievements checked, and activity logged.",
        });
      } else {
        toast({ title: "Match Updated" });
      }
      setSelectedMatch(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startMatch = (matchId: string) => {
    updateMatchMutation.mutate({ id: matchId, status: "live" });
  };

  const completeMatch = (match: any, winnerId: string) => {
    updateMatchMutation.mutate({
      id: match.id,
      status: "completed",
      player1_score: scores.player1,
      player2_score: scores.player2,
      winner_id: winnerId,
    });
  };

  const groupedMatches = matches.reduce((acc: any, match: any) => {
    const round = `Round ${match.round}`;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Matches</h1>
          <p className="text-muted-foreground">Create and manage tournament matches</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Match
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Match</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMatchMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Tournament</Label>
                <Select
                  value={formData.tournament_id}
                  onValueChange={(v) => setFormData({ ...formData, tournament_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Round</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: +e.target.value })}
                  />
                </div>
                <div>
                  <Label>Match #</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.match_number}
                    onChange={(e) => setFormData({ ...formData, match_number: +e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Player 1</Label>
                <Select
                  value={formData.player1_id}
                  onValueChange={(v) => setFormData({ ...formData, player1_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">TBD</SelectItem>
                    {confirmedPlayers.map((p: any) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.username} ({p.game_handle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Player 2</Label>
                <Select
                  value={formData.player2_id}
                  onValueChange={(v) => setFormData({ ...formData, player2_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">TBD</SelectItem>
                    {confirmedPlayers.map((p: any) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.username} ({p.game_handle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMatchMutation.isPending || !formData.tournament_id}
              >
                {createMatchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Match"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
          <SelectTrigger className="w-full md:w-80">
            <SelectValue placeholder="All Tournaments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tournaments</SelectItem>
            {tournaments.map((t: any) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matches by Round */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      ) : Object.keys(groupedMatches).length > 0 ? (
        <div className="space-y-8 max-h-[calc(100vh-220px)] min-h-[350px] overflow-y-auto pr-2">
          {Object.entries(groupedMatches).map(([round, roundMatches]: [string, any]) => (
            <div key={round}>
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {round}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roundMatches.map((match: any) => (
                  <div
                    key={match.id}
                    className={`rounded-xl bg-card border p-4 ${
                      match.status === "live"
                        ? "border-green-500/50 animate-pulse"
                        : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">
                        Match {match.match_number}
                      </span>
                      <Badge variant="outline" className={statusColors[match.status]}>
                        {match.status === "live" && (
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                        )}
                        {match.status}
                      </Badge>
                    </div>

                    {/* Players */}
                    <div className="space-y-2 mb-4">
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          match.winner_id === match.player1_id
                            ? "bg-green-500/10"
                            : "bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {match.winner_id === match.player1_id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="font-medium">{match.player1?.username ?? "TBD"}</span>
                        </div>
                        <span className="font-bold">{match.player1_score ?? "-"}</span>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">VS</div>
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          match.winner_id === match.player2_id
                            ? "bg-green-500/10"
                            : "bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {match.winner_id === match.player2_id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="font-medium">{match.player2?.username ?? "TBD"}</span>
                        </div>
                        <span className="font-bold">{match.player2_score ?? "-"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {match.status === "scheduled" && match.player1_id && match.player2_id && (
                        <Button size="sm" className="flex-1" onClick={() => startMatch(match.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {match.status === "live" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedMatch(match);
                                setScores({
                                  player1: match.player1_score || 0,
                                  player2: match.player2_score || 0,
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Complete Match</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 text-center">
                                  <p className="font-medium mb-2">{match.player1?.username}</p>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={scores.player1}
                                    onChange={(e) =>
                                      setScores({ ...scores, player1: +e.target.value })
                                    }
                                    className="text-center text-2xl font-bold"
                                  />
                                </div>
                                <Swords className="h-6 w-6 text-muted-foreground" />
                                <div className="flex-1 text-center">
                                  <p className="font-medium mb-2">{match.player2?.username}</p>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={scores.player2}
                                    onChange={(e) =>
                                      setScores({ ...scores, player2: +e.target.value })
                                    }
                                    className="text-center text-2xl font-bold"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Select Winner</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => completeMatch(match, match.player1_id)}
                                    disabled={updateMatchMutation.isPending}
                                  >
                                    {match.player1?.username} Wins
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => completeMatch(match, match.player2_id)}
                                    disabled={updateMatchMutation.isPending}
                                  >
                                    {match.player2?.username} Wins
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Match Time */}
                    {match.scheduled_at && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        {format(new Date(match.scheduled_at), "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border/50 p-12 text-center">
          <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No matches found. Create matches to get started.</p>
        </div>
      )}
    </div>
  );
}
