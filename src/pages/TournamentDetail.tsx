// @ts-nocheck
import { useState, useEffect } from "react";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import {
  Calendar,
  Users,
  Trophy,
  Gamepad2,
  ArrowLeft,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentModal } from "@/components/payment-modal";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn, formatExternalUrl } from "@/lib/utils";
import { mockTournaments } from "@/lib/mock-data";
import { getLocalRegistrations } from "@/utils/local-registrations";
import { StartCountdown } from "@/components/tournament/start-countdown";
import { assignLobbyNumbers, summarizeLobbies } from "@/lib/lobby/overflow";

const statusLabels: Record<string, string> = {
  live: "LIVE",
  upcoming: "Upcoming",
  registration_open: "Registration Open",
  registration_closed: "Registration Closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TournamentDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const queryClient = useQueryClient();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", id)
          .single();
        if (data) return data;
      } catch (e) {
        console.warn("Tournament detail fallback active");
      }
      const mock = mockTournaments.find((t) => t.id === id) || mockTournaments[0];
      if (!mock) return null;
      return {
        id: mock.id,
        title: mock.title,
        description: mock.description,
        game: mock.game,
        game_id: mock.game,
        format: mock.format,
        status: mock.status,
        entry_fee: mock.entryFee,
        prize_pool: mock.prizePool,
        max_participants: mock.maxParticipants,
        current_participants: mock.currentParticipants,
        start_date: mock.startDate.toISOString(),
        registration_deadline: mock.registrationDeadline.toISOString(),
        image_url: mock.imageUrl,
        rules: mock.rules,
      };
    },
    enabled: !!id,
  });

  // Real-time subscription for this tournament
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tournament-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments", filter: `id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tournament", id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations", filter: `tournament_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["registrations", id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const { data: matchesData } = useQuery({
    queryKey: ["matches", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (!data || data.length === 0) return [];

      // Get all unique player IDs from matches
      const playerIds = [
        ...new Set([
          ...data.map((m) => m.player1_id).filter(Boolean),
          ...data.map((m) => m.player2_id).filter(Boolean),
          ...data.map((m) => m.winner_id).filter(Boolean),
        ]),
      ] as string[];

      if (playerIds.length === 0) return data.map((m) => ({ ...m, player1: null, player2: null }));

      // Fetch profiles for all players
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, game_handle")
        .in("user_id", playerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((m) => ({
        ...m,
        player1: m.player1_id ? profileMap.get(m.player1_id) : null,
        player2: m.player2_id ? profileMap.get(m.player2_id) : null,
        winner: m.winner_id ? profileMap.get(m.winner_id) : null,
      }));
    },
    enabled: !!id,
  });

  const matches = matchesData;

  const { data: registrations } = useQuery({
    queryKey: ["registrations", id],
    queryFn: async () => {
      let regsData: any[] = [];
      try {
        const { data } = await supabase
          .from("registrations")
          .select("*")
          .eq("tournament_id", id);
        regsData = data || [];
      } catch (e) {
        console.warn("Fetch registrations error:", e);
      }

      // Merge local registrations
      const localRegs = getLocalRegistrations().filter((r) => r.tournament_id === id);
      const userIdsInDb = new Set(regsData.map((r) => r.user_id));
      for (const lr of localRegs) {
        if (!userIdsInDb.has(lr.user_id)) {
          regsData.push(lr);
        }
      }

      if (!regsData || regsData.length === 0) return [];

      const userIds = [...new Set(regsData.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return regsData.map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id),
      }));
    },
    enabled: !!id,
  });

  const { data: userRegistration } = useQuery({
    queryKey: ["user-registration", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data } = await supabase
          .from("registrations")
          .select("*")
          .eq("tournament_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) return data;
      } catch (e) {
        console.warn("Error fetching user registration:", e);
      }

      // Check local fallback
      const localRegs = getLocalRegistrations();
      const local = localRegs.find((r) => r.tournament_id === id && r.user_id === user.id);
      return local || null;
    },
    enabled: !!id && !!user,
  });

  // Numbered lobbies for this tournament (#1, #2, #3 …) incl. overflow rooms.
  const { data: tournamentRooms = [] } = useQuery({
    queryKey: ["tournament-lobbies", id],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("game_rooms")
          .select("*")
          .eq("tournament_id", id)
          .order("created_at", { ascending: true });
        return data ?? [];
      } catch (e) {
        console.warn("Tournament lobbies unavailable");
        return [];
      }
    },
    enabled: !!id,
  });

  const lobbies = assignLobbyNumbers(tournamentRooms as any[]);
  const lobbyStats = summarizeLobbies(lobbies);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground mt-4">Loading tournament...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Tournament not found</h1>
        <Link to="/tournaments" className="text-primary hover:underline mt-4 inline-block">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to register for tournaments",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    if (userRegistration) {
      toast({
        title: "Already Registered",
        description: `Your registration status: ${userRegistration.status}`,
      });
      return;
    }
    setShowPayment(true);
  };

  const isRegistered = !!userRegistration;
  const prizePool = Number(tournament.prize_pool);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tournaments
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 p-8 mb-8 relative overflow-hidden">
        {tournament.image_url && (
          <div className="absolute inset-0 opacity-20">
            <img
              loading="lazy"
              decoding="async"
              src={optimizeImageUrl(tournament.image_url, { width: 1200, quality: 80 })}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <Badge
              variant={
                tournament.status === "live"
                  ? "destructive"
                  : tournament.status === "registration_open"
                    ? "default"
                    : "secondary"
              }
              className="mb-4"
            >
              {statusLabels[tournament.status]}
            </Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{tournament.title}</h1>
            <p className="text-muted-foreground mb-4">{tournament.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {formatDate(tournament.start_date)}
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {tournament.current_participants}/{tournament.max_participants} players
              </span>
              <span className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                {tournament.game.toUpperCase()}
              </span>
              {lobbies.length > 0 && (
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  {lobbies.length} {lobbies.length === 1 ? "lobby" : "lobbies"} •{" "}
                  {lobbies.map((lobby) => lobby.lobbyTag).join(" ")}
                </span>
              )}
            </div>
            <StartCountdown
              startDate={tournament.start_date}
              status={tournament.status}
              className="mt-5 inline-block"
            />
          </div>
          <div className="text-center md:text-right">
            <div className="font-display text-4xl font-bold text-primary mb-1">
              KES {prizePool.toLocaleString()}
            </div>
            <div className="text-muted-foreground mb-4">Prize Pool</div>
            {tournament.status === "registration_open" && !isRegistered && (
              <Button size="lg" onClick={handleRegister}>
                Register • KES {Number(tournament.entry_fee).toLocaleString()}
              </Button>
            )}
            {isRegistered && (
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="text-primary border-primary/50 bg-primary/10 py-1 px-3"
                >
                  {userRegistration?.status === "confirmed"
                    ? "✓ Payment Verified & Registered"
                    : `Status: ${userRegistration?.status || "Pending Verification"}`}
                </Badge>
                {userRegistration?.status === "confirmed" && tournament.group_link ? (
                  <div className="pt-1">
                    <a
                      href={formatExternalUrl(tournament.group_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium w-full sm:w-auto shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Join Tournament Group
                      </Button>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pt-1">
                    🔒 Group link is unlocked after admin verifies your payment.
                  </p>
                )}
              </div>
            )}
            {tournament.live_stream_link && (
              <div className="mt-3">
                <a
                  href={formatExternalUrl(tournament.live_stream_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-primary border-primary/40 hover:bg-primary/10 gap-2 w-full sm:w-auto"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch Live Stream
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brackets">Brackets</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <h3 className="font-display font-bold mb-4">Tournament Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Format:</span>{" "}
                    <span className="font-medium capitalize">
                      {tournament.format.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entry Fee:</span>{" "}
                    <span className="font-medium">
                      KES {Number(tournament.entry_fee).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Game:</span>{" "}
                    <span className="font-medium uppercase">{tournament.game}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registration Deadline:</span>{" "}
                    <span className="font-medium">
                      {formatDate(tournament.registration_deadline)}
                    </span>
                  </div>
                  {tournament.group_link && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Group Link:</span>
                      {userRegistration?.status === "confirmed" ? (
                        <a
                          href={formatExternalUrl(tournament.group_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Join Group
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          🔒 Verified Players Only
                        </span>
                      )}
                    </div>
                  )}
                  {tournament.live_stream_link && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Live Stream:</span>
                      <a
                        href={formatExternalUrl(tournament.live_stream_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Watch Stream
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-6">
              <h3 className="font-display font-bold mb-4">Prize Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-yellow-500">🥇 1st Place</span>
                  <span className="font-bold">
                    KES {Math.round(prizePool * 0.5).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🥈 2nd Place</span>
                  <span className="font-bold">
                    KES {Math.round(prizePool * 0.3).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-500">🥉 3rd Place</span>
                  <span className="font-bold">
                    KES {Math.round(prizePool * 0.2).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brackets">
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <h3 className="font-display font-bold mb-6">Tournament Bracket</h3>
            {matches && matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match: any) => {
                  const isPlayer1Winner = match.winner_id === match.player1_id;
                  const isPlayer2Winner = match.winner_id === match.player2_id;

                  return (
                    <div
                      key={match.id}
                      className="p-4 rounded-lg bg-secondary/50 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-muted-foreground">
                          Round {match.round} • Match {match.match_number}
                        </div>
                        <Badge
                          variant={
                            match.status === "live"
                              ? "destructive"
                              : match.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {match.status === "live" && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                          )}
                          {match.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex-1 p-3 rounded-lg bg-background flex items-center justify-between",
                            isPlayer1Winner && "border-2 border-primary/50 bg-primary/10",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {match.player1?.avatar_url ? (
                              <img
                                loading="lazy"
                                decoding="async"
                                src={match.player1.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : match.player1_id ? (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {(match.player1?.username || "P").charAt(0).toUpperCase()}
                              </div>
                            ) : null}
                            <div>
                              <p className={cn("font-medium", isPlayer1Winner && "text-primary")}>
                                {match.player1?.username ||
                                  match.player1?.game_handle ||
                                  (match.player1_id ? "Loading..." : "TBD")}
                              </p>
                              {match.player1?.game_handle && match.player1?.username && (
                                <p className="text-xs text-muted-foreground">
                                  {match.player1.game_handle}
                                </p>
                              )}
                            </div>
                          </div>
                          {match.player1_score !== null && (
                            <span
                              className={cn("text-xl font-bold", isPlayer1Winner && "text-primary")}
                            >
                              {match.player1_score}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground font-bold">VS</span>
                        <div
                          className={cn(
                            "flex-1 p-3 rounded-lg bg-background flex items-center justify-between",
                            isPlayer2Winner && "border-2 border-primary/50 bg-primary/10",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {match.player2?.avatar_url ? (
                              <img
                                loading="lazy"
                                decoding="async"
                                src={match.player2.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : match.player2_id ? (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {(match.player2?.username || "P").charAt(0).toUpperCase()}
                              </div>
                            ) : null}
                            <div>
                              <p className={cn("font-medium", isPlayer2Winner && "text-primary")}>
                                {match.player2?.username ||
                                  match.player2?.game_handle ||
                                  (match.player2_id ? "Loading..." : "TBD")}
                              </p>
                              {match.player2?.game_handle && match.player2?.username && (
                                <p className="text-xs text-muted-foreground">
                                  {match.player2.game_handle}
                                </p>
                              )}
                            </div>
                          </div>
                          {match.player2_score !== null && (
                            <span
                              className={cn("text-xl font-bold", isPlayer2Winner && "text-primary")}
                            >
                              {match.player2_score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Brackets will be generated when the tournament starts
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <h3 className="font-display font-bold mb-4">
              {registrations?.length || 0} Registered Players
            </h3>
            {registrations && registrations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {registrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className="p-3 rounded-lg bg-secondary/50 flex items-center gap-2"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {reg.profiles?.avatar_url ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={reg.profiles.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">
                        {reg.profiles?.username || "Player"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {reg.game_handle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No registered players yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="rounded-xl bg-card border border-border/50 p-6">
            <h3 className="font-display font-bold mb-4">Tournament Rules</h3>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
              {tournament.rules || "No rules specified."}
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentModal
        tournament={{
          id: tournament.id,
          title: tournament.title,
          entryFee: Number(tournament.entry_fee),
          groupLink: tournament.group_link,
        }}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() =>
          toast({ title: "Registration submitted!", description: "Awaiting payment verification" })
        }
      />
    </div>
  );
}
