import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/lib/router-compat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/social/follow-button";
import { getGamerAvatar } from "@/constants/avatars";
import { useToast } from "@/hooks/use-toast";
import { Users, Gamepad2, Trophy, Sparkles, UserPlus, Check, MessageCircle } from "lucide-react";

interface SquadSuggestionsProps {
  currentProfileId?: string;
  limit?: number;
  className?: string;
  title?: string;
}

export function SquadSuggestions({
  currentProfileId,
  limit = 6,
  className = "",
  title = "Suggested Friends & Squadmates",
}: SquadSuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitedSquads, setInvitedSquads] = useState<Record<string, boolean>>({});

  // Query recommended gamers and squad members
  const { data: squadSuggestions = [], isLoading } = useQuery({
    queryKey: ["squad-suggestions", currentProfileId || user?.id, limit],
    queryFn: async () => {
      // 1. Get current followed IDs to avoid suggesting someone already heavily connected if needed, or get active profiles
      const excludeIds = new Set<string>();
      if (user?.id) excludeIds.add(user.id);
      if (currentProfileId) excludeIds.add(currentProfileId);

      if (user?.id) {
        const { data: follows } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id);
        (follows || []).forEach((f: any) => excludeIds.add(f.following_id));
      }

      // 2. Fetch active profiles with avatars & stats
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(25);

      if (error || !profiles || profiles.length === 0) {
        return [];
      }

      // Filter out excluded IDs
      const filtered = profiles.filter((p: any) => !excludeIds.has(p.user_id));
      
      // If filtered list is small, fallback to returning all profiles except self/current
      if (filtered.length < 3) {
        return profiles
          .filter((p: any) => p.user_id !== user?.id && p.user_id !== currentProfileId)
          .slice(0, limit);
      }

      return filtered.slice(0, limit);
    },
    staleTime: 60 * 1000,
  });

  const handleInviteSquad = (username: string, userId: string) => {
    setInvitedSquads((prev) => ({ ...prev, [userId]: true }));
    toast({
      title: "Squad Invitation Sent! 🎮",
      description: `Invited @${username} to join your competitive gaming squad.`,
    });
  };

  if (!isLoading && squadSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-border/60 bg-card p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-1.5">
              {title}
              <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
            </h3>
            <p className="text-xs text-muted-foreground">Gamers looking for team tournament squadmates</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {squadSuggestions.map((member: any) => {
            const isInvited = invitedSquads[member.user_id];
            return (
              <div
                key={member.user_id}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/20 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Link to={`/player/${member.user_id}`} className="shrink-0 relative">
                    <Avatar className="h-11 w-11 border-2 border-primary/30 group-hover:border-primary transition-colors">
                      <AvatarImage src={member.avatar_url || getGamerAvatar(member.username)} />
                      <AvatarFallback className="font-bold bg-secondary text-sm">
                        {(member.username || "G").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" title="Online for matches" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/player/${member.user_id}`}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {member.username}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.full_name || "Gamer"}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {member.game_handle ? (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-background/60 font-medium border-border/60">
                          <Gamepad2 className="h-2.5 w-2.5 mr-1 text-primary" />
                          {member.game_handle}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-background/60 font-medium border-border/60">
                          <Trophy className="h-2.5 w-2.5 mr-1 text-yellow-500" />
                          {member.total_wins || 0} Wins
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <FollowButton
                    userId={member.user_id}
                    username={member.username}
                    size="sm"
                    className="flex-1 text-xs h-8"
                  />
                  <Button
                    size="sm"
                    variant={isInvited ? "secondary" : "outline"}
                    disabled={isInvited}
                    onClick={() => handleInviteSquad(member.username, member.user_id)}
                    className="text-xs h-8 rounded-xl gap-1 px-2.5 shrink-0"
                    title="Invite to Squad"
                  >
                    {isInvited ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Invited
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5 text-primary" />
                        Squad Up
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
