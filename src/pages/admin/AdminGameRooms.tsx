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
import { Plus, Gamepad2, Copy, Trash2, Loader2, Clock, Key } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function AdminGameRooms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    tournament_id: "",
    match_id: "",
    room_code: "",
    password: "",
    platform: "mobile" as const,
    expires_at: "",
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, title, game")
        .in("status", ["live", "registration_open", "registration_closed"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches-for-rooms", formData.tournament_id],
    queryFn: async () => {
      if (!formData.tournament_id) return [];
      const { data } = await supabase
        .from("matches")
        .select("id, round, match_number")
        .eq("tournament_id", formData.tournament_id)
        .in("status", ["scheduled", "live"])
        .order("round", { ascending: true });
      return data ?? [];
    },
    enabled: !!formData.tournament_id,
  });

  const { data: gameRooms = [], isLoading } = useQuery({
    queryKey: ["admin-game-rooms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("game_rooms")
        .select("*, tournaments(id, title, game), matches(round, match_number)")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const expiresAt = data.expires_at
        ? new Date(data.expires_at).toISOString()
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // Default 2 hours

      const { error } = await supabase.from("game_rooms").insert({
        tournament_id: data.tournament_id,
        match_id: data.match_id || null,
        room_code: data.room_code,
        password: data.password || null,
        platform: data.platform,
        expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-game-rooms"] });
      toast({ title: "Game Room Created" });
      setIsCreateOpen(false);
      setFormData({
        tournament_id: "",
        match_id: "",
        room_code: "",
        password: "",
        platform: "mobile",
        expires_at: "",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-game-rooms"] });
      toast({ title: "Game Room Deleted" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const activeRooms = gameRooms.filter((r: any) => new Date(r.expires_at) > new Date());
  const expiredRooms = gameRooms.filter((r: any) => new Date(r.expires_at) <= new Date());

  const platformColors: Record<string, string> = {
    playstation: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    xbox: "bg-green-500/20 text-green-500 border-green-500/30",
    pc: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    mobile: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  };

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, room_code: code });
  };

  const generatePassword = () => {
    const pass = Math.random().toString(36).substring(2, 10);
    setFormData({ ...formData, password: pass });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Game Rooms</h1>
          <p className="text-muted-foreground">Create and manage game room codes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Game Room</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Tournament *</Label>
                <Select
                  value={formData.tournament_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, tournament_id: v, match_id: "" })
                  }
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

              {formData.tournament_id && matches.length > 0 && (
                <div>
                  <Label>Match (Optional)</Label>
                  <Select
                    value={formData.match_id}
                    onValueChange={(v) => setFormData({ ...formData, match_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select match" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific match</SelectItem>
                      {matches.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          Round {m.round} - Match {m.match_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(v: any) => setFormData({ ...formData, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="playstation">PlayStation</SelectItem>
                    <SelectItem value="xbox">Xbox</SelectItem>
                    <SelectItem value="pc">PC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Room Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.room_code}
                    onChange={(e) =>
                      setFormData({ ...formData, room_code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., ABC123"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateRoomCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Password (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Room password"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Defaults to 2 hours if not set</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  createMutation.isPending || !formData.tournament_id || !formData.room_code
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Room"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{gameRooms.length}</p>
              <p className="text-xs text-muted-foreground">Total Rooms</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{activeRooms.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-muted border border-border p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{expiredRooms.length}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Rooms */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-lg mb-4">Active Rooms</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : activeRooms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[450px] overflow-y-auto pr-1">
            {activeRooms.map((room: any) => (
              <div key={room.id} className="rounded-xl bg-card border border-border/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold truncate">{room.tournaments?.title}</p>
                  <Badge variant="outline" className={platformColors[room.platform]}>
                    {room.platform}
                  </Badge>
                </div>

                {room.matches && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Round {room.matches.round} - Match {room.matches.match_number}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-bold">{room.room_code}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(room.room_code, "Room code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {room.password && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{room.password}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(room.password, "Password")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDistanceToNow(new Date(room.expires_at), { addSuffix: true })}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
            <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active game rooms</p>
          </div>
        )}
      </div>

      {/* Expired Rooms */}
      {expiredRooms.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg mb-4 text-muted-foreground">
            Expired Rooms
          </h2>
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground">
              <div>Tournament</div>
              <div>Room Code</div>
              <div>Platform</div>
              <div>Expired</div>
              <div>Actions</div>
            </div>
            {expiredRooms.slice(0, 10).map((room: any) => (
              <div
                key={room.id}
                className="grid grid-cols-5 gap-4 p-4 border-t border-border/50 items-center text-sm opacity-60"
              >
                <div className="truncate">{room.tournaments?.title}</div>
                <div className="font-mono">{room.room_code}</div>
                <div className="capitalize">{room.platform}</div>
                <div className="text-xs">{format(new Date(room.expires_at), "MMM d, h:mm a")}</div>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
