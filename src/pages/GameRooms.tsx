// @ts-nocheck
import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Copy, Clock, Monitor, Smartphone, Laptop, Tv } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { mockGameRooms } from "@/lib/mock-data";
import { assignLobbyNumbers, summarizeLobbies } from "@/lib/lobby/overflow";

const platformIcons: Record<string, React.ReactNode> = {
  playstation: <Tv className="w-5 h-5" />,
  xbox: <Monitor className="w-5 h-5" />,
  pc: <Laptop className="w-5 h-5" />,
  mobile: <Smartphone className="w-5 h-5" />,
};

const GameRooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: gameRooms = [], isLoading } = useQuery({
    queryKey: ["game-rooms"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("game_rooms")
          .select(
            `
            *,
            tournaments(title, game),
            matches(round, match_number, player1_id, player2_id, status)
          `,
          )
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });
        if (data && data.length > 0) return data;
      } catch (e) {
        console.warn("GameRooms fallback active");
      }
      return mockGameRooms.map((gr) => ({
        id: gr.id,
        room_code: "ROOM-" + gr.id.toUpperCase(),
        room_password: "PASS" + Math.floor(100 + Math.random() * 900),
        platform: gr.game === "cod" || gr.game === "pubg" ? "mobile" : "playstation",
        server_region: "EU-West (Kenya low ping)",
        expires_at: new Date(Date.now() + 7200000).toISOString(),
        created_at: gr.createdAt.toISOString(),
        tournaments: { title: gr.name, game: gr.game },
        matches: {
          round: 1,
          match_number: 1,
          player1_id: gr.hostId,
          player2_id: null,
          status: "scheduled",
        },
      }));
    },
  });

  // Number lobbies per tournament (#1, #2, #3 …) so overflow lobbies are obvious.
  const lobbies = assignLobbyNumbers(gameRooms as any[]);
  const lobbyStats = summarizeLobbies(lobbies);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please log in to view game rooms.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Game Rooms</h1>
            <p className="text-muted-foreground">Your active match rooms</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading game rooms...</p>
          </div>
        ) : gameRooms && gameRooms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 text-xs text-muted-foreground">
              {lobbyStats.lobbies} lobby(ies) · {lobbyStats.seatsLeft} seats left
              {lobbyStats.overflowLobbies > 0 &&
                ` · ${lobbyStats.overflowLobbies} overflow lobby(ies) opened automatically`}
            </div>
            {lobbies.map((room: any) => {
              const isExpired = new Date(room.expires_at) < new Date();
              const isMyRoom =
                room.matches?.player1_id === user.id || room.matches?.player2_id === user.id;

              return (
                <Card
                  key={room.id}
                  className={`border-border/50 bg-card/80 backdrop-blur-sm ${
                    isMyRoom ? "border-primary/50 bg-primary/5" : ""
                  } ${isExpired ? "opacity-50" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {platformIcons[room.platform]}
                          {room.tournaments?.title || "Tournament"}
                          <span className="text-primary font-display">Lobby {room.lobbyTag}</span>
                        </CardTitle>
                        <CardDescription>
                          Round {room.matches?.round || "?"} - Match{" "}
                          {room.matches?.match_number || "?"}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={room.isFull ? "destructive" : "outline"}>
                          {room.occupancy}/{room.capacity} {room.isFull ? "full" : "seats"}
                        </Badge>
                        {room.isOverflow && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            Overflow lobby
                          </Badge>
                        )}
                        <Badge variant={room.matches?.status === "live" ? "default" : "secondary"}>
                          {room.matches?.status || "scheduled"}
                        </Badge>
                        {isMyRoom && (
                          <Badge variant="outline" className="text-primary border-primary">
                            Your Match
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Room Code */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Room Code</p>
                          <p className="font-mono text-lg font-bold">{room.room_code}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(room.room_code, "Room code")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      {(room.password || room.room_password) && (
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div>
                            <p className="text-sm text-muted-foreground">Password</p>
                            <p className="font-mono text-lg font-bold">{room.password || room.room_password}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(room.password || room.room_password, "Password")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Platform & Timing */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {platformIcons[room.platform]}
                        <span className="capitalize">{room.platform}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Expires{" "}
                          {formatDistanceToNow(new Date(room.expires_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Active Game Rooms</h3>
              <p className="text-muted-foreground">
                Game rooms will appear here when you have upcoming matches. Register for tournaments
                to get started!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-primary/30 bg-primary/5 mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              How Game Rooms Work
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Room codes are generated before your match starts</li>
              <li>• Join the room using the code and password provided</li>
              <li>• Rooms expire after the scheduled match time</li>
              <li>• Report results immediately after your match</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameRooms;
