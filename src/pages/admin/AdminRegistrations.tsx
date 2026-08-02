// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Clock, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-500 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/30",
  checked_in: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

export default function AdminRegistrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, title")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["admin-registrations", tournamentFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("registrations")
        .select("*, tournaments(id, title, game)")
        .limit(200)
        .order("created_at", { ascending: false });

      if (tournamentFilter !== "all") {
        query = query.eq("tournament_id", tournamentFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq(
          "status",
          statusFilter as "pending" | "confirmed" | "cancelled" | "checked_in",
        );
      }

      const { data } = await query;
      if (!data || data.length === 0) return [];

      // Fetch profiles
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, email, phone, game_handle")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id),
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("registrations")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      toast({ title: "Registration Updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmAllMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("registrations")
        .update({ status: "confirmed" })
        .eq("tournament_id", tournamentId)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      toast({ title: "All Pending Registrations Confirmed" });
    },
  });

  const filteredRegistrations = registrations.filter((r: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.profile?.username?.toLowerCase().includes(searchLower) ||
      r.game_handle?.toLowerCase().includes(searchLower) ||
      r.profile?.email?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = registrations.filter((r: any) => r.status === "pending").length;
  const confirmedCount = registrations.filter((r: any) => r.status === "confirmed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Registrations</h1>
          <p className="text-muted-foreground">View and manage tournament registrations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{registrations.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          {tournamentFilter !== "all" && pendingCount > 0 ? (
            <Button
              size="sm"
              className="w-full h-full"
              onClick={() => confirmAllMutation.mutate(tournamentFilter)}
              disabled={confirmAllMutation.isPending}
            >
              {confirmAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm All Pending"
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select tournament to bulk confirm
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username, game handle, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
          <SelectTrigger className="w-full md:w-64">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div>Player</div>
              <div>Game Handle</div>
              <div className="col-span-2">Tournament</div>
              <div>Registered</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredRegistrations.length > 0 ? (
              filteredRegistrations.map((r: any) => (
                <div
                  key={r.id}
                  className="grid grid-cols-7 gap-4 p-4 border-t border-border/50 items-center text-sm"
                >
                  <div>
                    <p className="font-medium">{r.profile?.username ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                  </div>
                  <div className="font-mono text-xs">{r.game_handle}</div>
                  <div className="col-span-2">
                    <p className="font-medium truncate">{r.tournaments?.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{r.tournaments?.game}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d, h:mm a")}
                  </div>
                  <div>
                    <Badge variant="outline" className={statusColors[r.status]}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary/80"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: r.id, status: "confirmed" })
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: r.id, status: "cancelled" })
                          }
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {r.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: r.id, status: "checked_in" })
                        }
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">No registrations found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
