// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  FileIcon,
  Check,
  CheckCheck,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { STORAGE_BUCKETS } from "@/integrations/supabase/storage-setup";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "@/lib/router-compat";

interface ChatWindowProps {
  conversationId: string;
  otherUser: { user_id: string; username: string; avatar_url?: string } | null;
  onBack?: () => void;
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const COMMON_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "👍",
  "👏",
  "🔥",
  "💯",
  "❤️",
  "🎮",
  "🏆",
  "💪",
  "🎉",
  "😅",
  "😭",
  "😤",
  "🤣",
  "✨",
  "😱",
  "🤩",
  "😇",
  "🙌",
  "💀",
  "🎯",
  "⚡",
  "🌟",
  "👀",
  "🤝",
  "😏",
  "🥳",
  "🫡",
  "💚",
  "🎊",
  "🎁",
  "🚀",
  "🌈",
  "💫",
  "🔫",
];

function parseChatContent(raw: string) {
  if (raw.startsWith("[IMAGE]")) return { type: "image", url: raw.slice("[IMAGE]".length) };
  if (raw.startsWith("[VIDEO]")) return { type: "video", url: raw.slice("[VIDEO]".length) };
  if (raw.startsWith("[FILE]")) return { type: "file", url: raw.slice("[FILE]".length) };
  return { type: "text", body: raw };
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = "Today";
  else if (isYesterday(date)) label = "Yesterday";
  else label = format(date, "MMMM d, yyyy");

  return (
    <div className="flex justify-center my-4">
      <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border/30">
        {label}
      </span>
    </div>
  );
}

export function ChatWindow({ conversationId, otherUser, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!conversationId,
  });

  // Decrypt messages
  useEffect(() => {
    async function decrypt() {
      const decrypted = new Map<string, string>();
      for (const msg of messages) {
        if (msg.is_encrypted) {
          try {
            decrypted.set(msg.id, await decryptMessage(msg.content));
          } catch {
            decrypted.set(msg.id, "[Could not decrypt]");
          }
        } else {
          decrypted.set(msg.id, msg.content);
        }
      }
      setDecryptedMessages(decrypted);
    }
    decrypt();
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages, isTyping]);

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unread = messages.filter((m) => !m.is_read && m.sender_id !== user.id);
      if (unread.length > 0) {
        supabase
          .from("messages")
          .update({ is_read: true })
          .in(
            "id",
            unread.map((m) => m.id),
          )
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          });
      }
    }
  }, [messages, user, conversationId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");
      const encrypted = await encryptMessage(content);
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: encrypted,
        is_encrypted: true,
      });
      if (error) throw error;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    onSuccess: () => {
      setNewMessage("");
      setIsTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const encrypted = await encryptMessage(content);
      const { error } = await supabase
        .from("messages")
        .update({ content: encrypted })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditText("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ content: await encryptMessage("[Message deleted]"), is_encrypted: true })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      // Store reaction in message metadata (simplified - in production use a reactions table)
      toast({ title: `Reacted with ${reaction}` });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = newMessage.trim();
    if (trimmed) {
      sendMessageMutation.mutate(trimmed);
    }
  }, [newMessage, sendMessageMutation]);

  const handleEdit = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditText(currentContent);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingMessageId) {
      editMessageMutation.mutate({ messageId: editingMessageId, content: editText.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleSaveEdit();
      } else {
        handleSend();
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxHeight = 4 * 24;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    setIsTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setEmojiOpen(false);
    textareaRef.current?.focus();
  };

  const comingSoon = (feature: string) => {
    toast({ title: `${feature} coming soon`, description: "Stay tuned!" });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to send media.",
        variant: "destructive",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Images only",
        description: "Pick an image file to send.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Images are capped at 10 MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const rawExt = file.name.split(".").pop();
      const fileExt =
        rawExt && /^[a-z0-9]{1,5}$/i.test(rawExt)
          ? rawExt.toLowerCase()
          : file.type.split("/").pop() || "jpg";

      // Storage RLS on `status-media` scopes writes to a top-level folder named
      // after the uploader's user id. The previous `messages/<uid>/...` path put
      // a literal "messages" segment first, so every upload was rejected by the
      // owner check. The user id MUST be the first path segment.
      const fileName = `${user.id}/messages/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STATUS_MEDIA)
        .upload(fileName, file, { cacheControl: "3600", contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKETS.STATUS_MEDIA).getPublicUrl(fileName);

      const encrypted = await encryptMessage(`[IMAGE]${publicUrl}`);
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: encrypted,
        is_encrypted: true,
      });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  function buildGroups(msgs: any[]) {
    const groups: { senderId: string; messages: any[] }[] = [];
    for (const msg of msgs) {
      const last = groups[groups.length - 1];
      if (last && last.senderId === msg.sender_id) {
        last.messages.push(msg);
      } else {
        groups.push({ senderId: msg.sender_id, messages: [msg] });
      }
    }
    return groups;
  }

  function buildTimeline(msgs: any[]) {
    const items: any[] = [];
    let lastDate: Date | null = null;

    const groups = buildGroups(msgs);
    for (const group of groups) {
      const firstMsg = group.messages[0];
      const msgDate = new Date(firstMsg.created_at);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({ type: "date", date: msgDate, key: `date-${msgDate.toISOString()}` });
        lastDate = msgDate;
      }
      items.push({ type: "group", ...group, key: `group-${firstMsg.id}` });
    }
    return items;
  }

  const isSent = (senderId: string) => senderId === user?.id;

  function ReadReceipt({ msg }: { msg: any }) {
    if (!isSent(msg.sender_id)) return null;
    if (msg.is_read) {
      return <CheckCheck className="h-3.5 w-3.5 text-primary inline-block" />;
    }
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/60 inline-block" />;
  }

  function MessageContent({ msg }: { msg: any }) {
    const decrypted = decryptedMessages.get(msg.id) ?? "";
    const parsed = parseChatContent(decrypted);

    if (parsed.type === "image") {
      return (
        <img
          src={parsed.url}
          alt="Shared image"
          loading="lazy"
          decoding="async"
          className="max-w-[280px] rounded-xl"
        />
      );
    }

    if (parsed.type === "video") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span className="text-sm">Video</span>
        </div>
      );
    }

    if (parsed.type === "file") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileIcon className="h-4 w-4" />
          <span className="text-sm">File</span>
        </div>
      );
    }

    if (parsed.body === "[Message deleted]") {
      return <span className="italic text-muted-foreground text-xs">Message deleted</span>;
    }

    return (
      <span>{decrypted || <span className="opacity-50 italic text-xs">Decrypting…</span>}</span>
    );
  }

  const timeline = buildTimeline(messages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-sm flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden h-8 w-8 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback className="text-sm font-semibold">
              {otherUser?.username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {otherUser?.username ?? "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground/70 leading-tight">Active now</p>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => comingSoon("Voice calls")}
          >
            <Phone className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => comingSoon("Video calls")}
          >
            <Video className="h-4.5 w-4.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <MoreVertical className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => otherUser?.user_id && navigate(`/player/${otherUser.user_id}`)}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => comingSoon("Clear chat")}>
                Clear Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => comingSoon("Block user")}
                className="text-destructive"
              >
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="rounded-full bg-muted/40 p-5 mb-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {otherUser?.username?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="font-semibold text-sm">{otherUser?.username ?? "Unknown"}</p>
            <p className="text-xs mt-1 opacity-60">
              Say hi! Your messages are end-to-end encrypted
            </p>
          </div>
        ) : (
          timeline.map((item) => {
            if (item.type === "date") {
              return <DateSeparator key={item.key} date={item.date} />;
            }

            const group = item;
            const sent = isSent(group.senderId);

            return (
              <div
                key={group.key}
                className={cn("flex gap-2 mb-1.5", sent ? "flex-row-reverse" : "flex-row")}
              >
                {!sent && (
                  <div className="w-6 flex-shrink-0 flex flex-col justify-end pb-5">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={otherUser?.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                        {otherUser?.username?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-0.5 max-w-[70%]",
                    sent ? "items-end" : "items-start",
                  )}
                >
                  {group.messages.map((msg, idx) => {
                    const isLast = idx === group.messages.length - 1;
                    const isEditing = editingMessageId === msg.id;
                    const decrypted = decryptedMessages.get(msg.id) ?? "";

                    return (
                      <div key={msg.id} className="relative group">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                                if (e.key === "Escape") {
                                  setEditingMessageId(null);
                                }
                              }}
                              className="px-4 py-2.5 text-sm rounded-2xl border border-primary bg-background resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMessageId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                className={cn(
                                  "px-4 py-2.5 text-sm break-words cursor-pointer",
                                  sent
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                                    : "bg-muted/60 text-foreground rounded-2xl rounded-bl-sm",
                                )}
                                onMouseEnter={() => setHoveredMessageId(msg.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                              >
                                <MessageContent msg={msg} />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(decrypted)}
                              >
                                Copy
                              </DropdownMenuItem>
                              {sent && decrypted !== "[Message deleted]" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(msg.id, decrypted)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteMessageMutation.mutate(msg.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!sent && (
                                <div className="p-2">
                                  <div className="text-xs text-muted-foreground mb-1 px-2">
                                    React
                                  </div>
                                  <div className="flex gap-1">
                                    {REACTION_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() =>
                                          reactToMessageMutation.mutate({
                                            messageId: msg.id,
                                            reaction: emoji,
                                          })
                                        }
                                        className="text-lg hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {isLast && !isEditing && (
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-0.5 px-1",
                              sent ? "justify-end" : "justify-start",
                            )}
                          >
                            {hoveredMessageId === msg.id && (
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(msg.created_at), "h:mm a")}
                              </span>
                            )}
                            {sent && <ReadReceipt msg={msg} />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/40 bg-card/50 p-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Attach an image"
            disabled={isUploadingImage}
            className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => imageInputRef.current?.click()}
          >
            {isUploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </Button>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={() => comingSoon("File sharing")}
          />

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl border border-border/40 bg-background/50",
              "px-4 py-2.5 text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              "transition-all duration-150 leading-6 max-h-[96px] overflow-y-auto",
            )}
            style={{ height: "auto" }}
          />

          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 p-2">
              <div className="grid grid-cols-8 gap-1">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {newMessage.trim().length > 0 ? (
            <Button
              onClick={handleSend}
              disabled={sendMessageMutation.isPending}
              size="icon"
              className="h-10 w-10 rounded-xl flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
