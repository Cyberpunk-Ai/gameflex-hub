// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Trophy,
  TrendingUp,
  Award,
  DollarSign,
  Search,
  RefreshCw,
  Save,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  wins: number;
  losses: number;
  points: number;
  earnings: number;
  tournaments_played: number;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

export default function AdminLeaderboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [editForm, setEditForm] = useState({
    wins: 0,
    losses: 0,
    points: 0,
    earnings: 0,
    tournaments_played: 0,
  });

  const {
    data: leaderboard = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-leaderboard"],
    queryFn: async () => {
      const { data: stats } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .limit(200)
        .order("points", { ascending: false });

      if (!stats) return [];

      const userIds = stats.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return stats.map((s) => ({
        ...s,
        profile: profileMap.get(s.user_id),
      }));
    },
  });

  const updateStatsMutation = useMutation({
    mutationFn: async (data: { id: string; stats: typeof editForm }) => {
      const { error } = await supabase
        .from("leaderboard_stats")
        .update({
          wins: data.stats.wins,
          losses: data.stats.losses,
          points: data.stats.points,
          earnings: data.stats.earnings,
          tournaments_played: data.stats.tournaments_played,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Stats Updated",
        description: "Leaderboard stats have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setEditingEntry(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leaderboard_stats")
        .update({
          wins: 0,
          losses: 0,
          points: 0,
          earnings: 0,
          tournaments_played: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Stats Reset", description: "Player stats have been reset to zero" });
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const handleEditOpen = (entry: LeaderboardEntry) => {
    setEditingEntry(entry);
    setEditForm({
      wins: entry.wins ?? 0,
      losses: entry.losses ?? 0,
      points: entry.points ?? 0,
      earnings: Number(entry.earnings) || 0,
      tournaments_played: entry.tournaments_played ?? 0,
    });
  };

  const handleSave = () => {
    if (editingEntry) {
      updateStatsMutation.mutate({ id: editingEntry.id, stats: editForm });
    }
  };

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.profile?.username?.toLowerCase().includes(search.toLowerCase()),
  );

  const topStats = {
    totalPlayers: leaderboard.length,
    totalWins: leaderboard.reduce((sum, e) => sum + (e.wins ?? 0), 0),
    totalEarnings: leaderboard.reduce((sum, e) => sum + Number(e.earnings ?? 0), 0),
    totalTournaments: leaderboard.reduce((sum, e) => sum + (e.tournaments_played ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Leaderboard Management
          </h1>
          <p className="text-muted-foreground text-sm">Update player stats and rankings</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{topStats.totalPlayers}</div>
              <div className="text-xs text-muted-foreground">Total Players</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Trophy className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{topStats.totalWins}</div>
              <div className="text-xs text-muted-foreground">Total Wins</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                KES {(topStats.totalEarnings / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-muted-foreground">Total Earnings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{topStats.totalTournaments}</div>
              <div className="text-xs text-muted-foreground">Tournaments Played</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Player Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Wins</TableHead>
                  <TableHead className="text-center">Losses</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Earnings</TableHead>
                  <TableHead className="text-center">Tournaments</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaderboard.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-500/20 text-yellow-500"
                            : index === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : index === 2
                                ? "bg-amber-600/20 text-amber-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.profile?.avatar_url} />
                          <AvatarFallback>
                            {entry.profile?.username?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{entry.profile?.username ?? "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-green-500 font-medium">
                      {entry.wins ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-red-500 font-medium">
                      {entry.losses ?? 0}
                    </TableCell>
                    <TableCell className="text-center font-bold">{entry.points ?? 0}</TableCell>
                    <TableCell className="text-center font-medium">
                      KES {Number(entry.earnings ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{entry.tournaments_played ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEditOpen(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Edit className="h-5 w-5" />
                              Edit {entry.profile?.username}'s Stats
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Wins</Label>
                                <Input
                                  type="number"
                                  value={editForm.wins}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      wins: parseInt(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label>Losses</Label>
                                <Input
                                  type="number"
                                  value={editForm.losses}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      losses: parseInt(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={editForm.points}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    points: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label>Earnings (KES)</Label>
                              <Input
                                type="number"
                                value={editForm.earnings}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    earnings: parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label>Tournaments Played</Label>
                              <Input
                                type="number"
                                value={editForm.tournaments_played}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    tournaments_played: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  editingEntry && resetStatsMutation.mutate(editingEntry.id)
                                }
                                disabled={resetStatsMutation.isPending}
                              >
                                Reset Stats
                              </Button>
                              <Button onClick={handleSave} disabled={updateStatsMutation.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
