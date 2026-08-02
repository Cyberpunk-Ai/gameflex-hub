// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, PenSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { isToday, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { decryptMessage } from "@/lib/encryption";

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, otherUser: any) => void;
  onCompose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function smartTimestamp(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const minsAgo = differenceInMinutes(now, date);
  if (minsAgo < 1) return "just now";
  if (minsAgo < 60) return `${minsAgo}m`;
  const hoursAgo = differenceInHours(now, date);
  if (hoursAgo < 24) return `${hoursAgo}h`;
  const daysAgo = differenceInDays(now, date);
  if (daysAgo < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
  onCompose,
}: ConversationListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [lastMessagePreviews, setLastMessagePreviews] = useState<Map<string, string>>(new Map());

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (!convData || convData.length === 0) return [];

      const conversationIds = convData.map((c) => c.id);
      const otherUserIds = convData.map((c) =>
        c.participant1_id === user.id ? c.participant2_id : c.participant1_id,
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      const { data: allMessages } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, any>();
      if (allMessages) {
        for (const msg of allMessages) {
          if (!lastMsgMap.has(msg.conversation_id)) {
            lastMsgMap.set(msg.conversation_id, msg);
          }
        }
      }

      const unreadCountMap = new Map<string, number>();
      if (allMessages) {
        for (const msg of allMessages) {
          if (!msg.is_read && msg.sender_id !== user.id) {
            unreadCountMap.set(
              msg.conversation_id,
              (unreadCountMap.get(msg.conversation_id) ?? 0) + 1,
            );
          }
        }
      }

      const result = convData.map((c) => {
        const otherId = c.participant1_id === user.id ? c.participant2_id : c.participant1_id;
        const lastMsg = lastMsgMap.get(c.id);
        const unreadCount = unreadCountMap.get(c.id) ?? 0;
        const isOnline = lastMsg
          ? differenceInMinutes(new Date(), new Date(lastMsg.created_at)) < 10
          : false;
        return {
          ...c,
          otherUser: profileMap.get(otherId),
          lastMsg,
          unreadCount,
          isOnline,
        };
      });

      // Sort: unread first, then by last_message_at
      return result.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return (
          new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
        );
      });
    },
    enabled: !!user,
  });

  // Decrypt last message previews
  function parseMessagePreview(raw: string) {
    if (raw.startsWith("[IMAGE]")) return "Photo";
    if (raw.startsWith("[VIDEO]")) return "Video";
    if (raw.startsWith("[FILE]")) return "File";
    return raw.slice(0, 40) + (raw.length > 40 ? "..." : "");
  }

  useEffect(() => {
    async function decryptPreviews() {
      const previews = new Map<string, string>();
      for (const conv of conversations) {
        if (conv.lastMsg) {
          const msg = conv.lastMsg;
          if (msg.is_encrypted) {
            try {
              const decrypted = await decryptMessage(msg.content);
              previews.set(conv.id, parseMessagePreview(decrypted));
            } catch {
              previews.set(conv.id, "Encrypted message");
            }
          } else {
            previews.set(conv.id, parseMessagePreview(msg.content));
          }
        }
      }
      setLastMessagePreviews(previews);
    }
    if (conversations.length > 0) {
      decryptPreviews();
    }
  }, [conversations]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const filtered = conversations.filter((c) =>
    c.otherUser?.username?.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const todayConvs = filtered.filter((c) => c.lastMsg && isToday(new Date(c.lastMsg.created_at)));
  const earlierConvs = filtered.filter(
    (c) => !c.lastMsg || !isToday(new Date(c.lastMsg.created_at)),
  );

  function ConversationItem({ conversation }: { conversation: any }) {
    const isSelected = selectedConversationId === conversation.id;
    const { unreadCount, isOnline, lastMsg, otherUser } = conversation;
    const hasUnread = unreadCount > 0;
    const preview = lastMessagePreviews.get(conversation.id) ?? "No messages yet";

    return (
      <button
        onClick={() => onSelectConversation(conversation.id, otherUser)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all text-left",
          "my-0.5",
          isSelected ? "shadow-sm" : "hover:bg-accent/40",
        )}
        style={
          isSelected
            ? {
                background:
                  "linear-gradient(135deg, hsl(142 76% 45% / 0.14) 0%, hsl(160 80% 45% / 0.07) 100%)",
                boxShadow: "0 0 0 1px hsl(142 76% 45% / 0.28)",
              }
            : undefined
        }
      >
        <div className="relative flex-shrink-0">
          <Avatar
            className={cn(
              "h-12 w-12 transition-all",
              hasUnread && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback className="text-sm font-semibold">
              {otherUser?.username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "font-medium truncate text-sm",
                hasUnread && "font-bold",
                isSelected && "text-primary",
              )}
            >
              {otherUser?.username ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {lastMsg ? smartTimestamp(lastMsg.created_at) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={cn(
                "text-xs text-muted-foreground truncate",
                hasUnread && "font-semibold text-foreground",
              )}
            >
              {preview}
            </span>
            {hasUnread && (
              <span className="flex-shrink-0 h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  function GroupLabel({ label }: { label: string }) {
    return (
      <div className="px-4 pt-4 pb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold text-xl tracking-tight truncate">Messages</span>
          <span className="ml-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
            {user?.email ? "You" : ""}
          </span>
        </div>
        <Button
          size="icon"
          onClick={onCompose}
          className="h-9 w-9 rounded-full shadow-md"
          title="New conversation"
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 rounded-full bg-muted/50 border-border/30 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 gap-3">
            <div className="rounded-full bg-muted/50 p-4">
              <MessageCircle className="h-8 w-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a conversation with another player</p>
            </div>
            <Button size="sm" onClick={onCompose} variant="outline" className="mt-1">
              Start a conversation
            </Button>
          </div>
        ) : (
          <>
            {todayConvs.length > 0 && (
              <>
                <GroupLabel label="Today" />
                {todayConvs.map((c) => (
                  <ConversationItem key={c.id} conversation={c} />
                ))}
              </>
            )}
            {earlierConvs.length > 0 && (
              <>
                <GroupLabel label="Earlier" />
                {earlierConvs.map((c) => (
                  <ConversationItem key={c.id} conversation={c} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
