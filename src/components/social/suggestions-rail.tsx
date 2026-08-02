import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import { getGamerAvatar } from "@/constants/avatars";
import { useState } from "react";
import { toast } from "sonner";

export function SuggestionsRail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Query logged-in user's profile for the top header card
  const { data: userProfile } = useQuery({
    queryKey: ["user-rail-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, game_handle, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["suggestions", user?.id],
    queryFn: async () => {
      const followingIds = new Set<string>();
      if (user?.id) {
        followingIds.add(user.id);
        const { data: following } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id);
        (following || []).forEach((f: any) => followingIds.add(f.following_id));
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .limit(25);

      if (!profiles) return [];
      return profiles
        .filter((p: any) => !followingIds.has(p.user_id))
        .slice(0, 5);
    },
    staleTime: 60 * 1000,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Following gamer!");
    },
  });

  const handleFollow = (userId: string) => {
    setFollowingMap((prev) => ({ ...prev, [userId]: true }));
    followMutation.mutate(userId);
  };

  return (
    <div className="w-full space-y-6">
      {/* Instagram style User Profile Header */}
      {user && (
        <div className="flex items-center justify-between pb-2">
          <Link to={`/player/${user.id}`} className="flex items-center gap-3 group min-w-0">
            <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary transition-colors shrink-0">
              <AvatarImage src={userProfile?.avatar_url || getGamerAvatar(userProfile?.username || user.email)} />
              <AvatarFallback className="font-bold bg-secondary text-sm">
                {(userProfile?.username || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {userProfile?.username || "Gamer"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {userProfile?.game_handle || user.email}
              </span>
            </div>
          </Link>
          <Link
            to={`/player/${user.id}`}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors shrink-0 pl-2"
          >
            Switch
          </Link>
        </div>
      )}

      {/* Suggested for you header */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-sm text-muted-foreground tracking-tight">
            Suggested for you
          </h3>
          <Link
            to="/friends"
            className="text-xs font-bold text-foreground hover:text-primary transition-colors"
          >
            See All
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-muted/60" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted/60 rounded w-24" />
                  <div className="h-2.5 bg-muted/40 rounded w-32" />
                </div>
                <div className="w-16 h-7 bg-muted/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-4 text-xs text-muted-foreground text-center bg-secondary/20 rounded-xl">
            You are following top active gamers!
          </div>
        ) : (
          <div className="space-y-3.5">
            {suggestions.map((s: any) => (
              <div key={s.user_id} className="flex items-center justify-between gap-3 group">
                <Link to={"/player/" + s.user_id} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-11 w-11 shrink-0 border border-primary/20 group-hover:border-primary/50 transition-colors">
                    <AvatarImage src={s.avatar_url || getGamerAvatar(s.username)} className="object-cover" />
                    <AvatarFallback className="font-bold text-foreground bg-secondary text-xs">
                      {(s.username || "G").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                      {s.username}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {s.total_wins > 0 ? `Suggested · ${s.total_wins} wins` : "Suggested for you"}
                    </span>
                  </div>
                </Link>

                {followingMap[s.user_id] ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs font-bold px-3 border-border text-foreground hover:bg-transparent shrink-0"
                  >
                    Following
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold px-3 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    onClick={() => handleFollow(s.user_id)}
                    disabled={followMutation.isPending}
                  >
                    Follow
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground/60 leading-relaxed">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mb-2.5 font-medium">
          <Link to="/about" className="hover:underline">About</Link>
          <span>·</span>
          <Link to="/help" className="hover:underline">Help</Link>
          <span>·</span>
          <Link to="/api" className="hover:underline">API</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
        <p className="tracking-tight text-[11px]">© 2026 GAMEFLEX COMMUNITY</p>
      </div>
    </div>
  );
}
