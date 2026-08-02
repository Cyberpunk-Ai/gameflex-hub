// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string, otherUser: any) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Suggested players: people the current user follows
  const { data: suggestedProfiles = [] } = useQuery({
    queryKey: ["suggested-players", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_follows")
        .select("profiles!user_follows_following_id_fkey(user_id, username, avatar_url)")
        .eq("follower_id", user.id)
        .limit(5);
      return data?.map((row) => row.profiles).filter(Boolean) ?? [];
    },
    enabled: !!user && open,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["searchable-users", searchTerm],
    queryFn: async () => {
      if (!searchTerm || !user) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .neq("user_id", user.id)
        .ilike("username", `%${searchTerm}%`)
        .limit(10);
      return data ?? [];
    },
    enabled: searchTerm.length >= 2,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`,
        )
        .single();

      if (existing) {
        return { id: existing.id, isNew: false, otherUserId };
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          participant1_id: user.id,
          participant2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return { id: data.id, isNew: true, otherUserId };
    },
    onSuccess: (result) => {
      // Find the other user from search results or suggested profiles
      const otherUser =
        users.find((u) => u.user_id === result.otherUserId) ||
        suggestedProfiles.find((p) => p?.user_id === result.otherUserId);

      onConversationCreated(result.id, otherUser);
      onOpenChange(false);
      setSearchTerm("");

      if (result.isNew) {
        toast({
          title: "Conversation created",
          description: `You can now chat with ${otherUser?.username}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <MessageCircle className="h-5 w-5" />
            New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Suggested Players */}
          {suggestedProfiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-0.5">
                Suggested
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {suggestedProfiles.map(
                  (profile) =>
                    profile && (
                      <button
                        key={profile.user_id}
                        onClick={() => createConversationMutation.mutate(profile.user_id)}
                        disabled={createConversationMutation.isPending}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                      >
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary transition-all">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-base font-semibold">
                              {profile.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors max-w-[56px] truncate">
                          {profile.username}
                        </span>
                      </button>
                    ),
                )}
              </div>
              <div className="border-t border-border/40" />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search users by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search results */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Searching...</div>
            ) : users.length === 0 && searchTerm.length >= 2 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">No users found</div>
            ) : searchTerm.length < 2 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Type at least 2 characters to search
              </div>
            ) : (
              users.map((u) => (
                <Button
                  key={u.user_id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-2.5"
                  onClick={() => createConversationMutation.mutate(u.user_id)}
                  disabled={createConversationMutation.isPending}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{u.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{u.username}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
