import { useState, useEffect } from "react";
import { Search, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TournamentCard } from "@/components/tournament-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { mockTournaments } from "@/lib/mock-data";

const games = ["all", "fifa", "cod", "pubg", "fortnite", "apex", "valorant"];
const statuses = ["all", "live", "registration_open", "upcoming", "completed"];

export default function Tournaments() {
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("tournaments")
          .select("*")
          .limit(60)
          .order("created_at", { ascending: false });
        if (data && data.length > 0) return data;
      } catch (e) {
        console.warn("Tournaments list fallback active");
      }
      return mockTournaments.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        game: t.game,
        game_id: t.game,
        format: t.format,
        status: t.status,
        entry_fee: t.entryFee,
        prize_pool: t.prizePool,
        max_participants: t.maxParticipants,
        current_participants: t.currentParticipants,
        start_date: t.startDate.toISOString(),
        registration_deadline: t.registrationDeadline.toISOString(),
        image_url: t.imageUrl,
        rules: t.rules,
      }));
    },
  });

  // Real-time subscription for tournament updates
  useEffect(() => {
    const channel = supabase
      .channel("tournaments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredTournaments = tournaments.filter((t: any) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesGame = gameFilter === "all" || t.game === gameFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesGame && matchesStatus;
  });

  const hasActiveFilters = search.trim() !== "" || gameFilter !== "all" || statusFilter !== "all";
  const resetFilters = () => {
    setSearch("");
    setGameFilter("all");
    setStatusFilter("all");
  };

  const liveTournaments = filteredTournaments.filter((t: any) => t.status === "live");
  const otherTournaments = filteredTournaments.filter((t: any) => t.status !== "live");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Tournaments</h1>
        <p className="text-muted-foreground">Find and join competitive gaming tournaments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <label htmlFor="tournament-search" className="sr-only">
            Search tournaments
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="tournament-search"
            aria-label="Search tournaments"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by game">
            <SelectValue placeholder="Game" />
          </SelectTrigger>
          <SelectContent>
            {games.map((g) => (
              <SelectItem key={g} value={g} className="capitalize">
                {g === "all" ? "All Games" : g.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All Status" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button type="button" variant="outline" onClick={resetFilters} className="md:w-auto">
            Clear filters
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-8">
        Showing {filteredTournaments.length} tournament{filteredTournaments.length === 1 ? "" : "s"}
      </p>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Live Tournaments */}
          {liveTournaments.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="destructive" className="text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5" />
                  LIVE NOW
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveTournaments.map((t: any) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          )}

          {/* Other Tournaments */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTournaments.map((t: any) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/70 bg-card/60">
              <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Try adjusting your filters, or check back soon for fresh tournaments and live
                brackets.
              </p>
              {hasActiveFilters && (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
