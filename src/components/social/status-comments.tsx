import { useState, useEffect } from "react";
import { recommendationEventService } from "@/services/recommendations/RecommendationEventService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock } from "lucide-react";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { useToast } from "@/hooks/use-toast";
import { updateStatusCount } from "@/lib/social-analytics";

interface StatusCommentsProps {
  statusId: string;
  commentsCount: number;
}

interface CommentProfile {
  username: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  status_id: string;
  user_id: string;
  content: string;
  is_encrypted: boolean;
  created_at: string;
  profile?: CommentProfile;
}

function serializeReplyContent(content: string, replyTo?: string | null) {
  const trimmed = (replyTo ?? "").trim();
  if (!trimmed) return content;
  return `↩${trimmed}::${content}`;
}

function parseReplyContent(content: string) {
  if (!content.startsWith("↩")) return { replyTo: null, body: content };
  const separator = content.indexOf("::");
  if (separator === -1) return { replyTo: null, body: content.slice(1) };
  return {
    replyTo: content.slice(1, separator).trim() || null,
    body: content.slice(separator + 2),
  };
}

async function decodeCommentContent(content: string, isEncrypted: boolean) {
  if (content.startsWith("↩")) {
    const { replyTo, body } = parseReplyContent(content);
    let decodedBody = body;
    if (isEncrypted && body) {
      try {
        decodedBody = await decryptMessage(body);
      } catch {
        decodedBody = body;
      }
    }
    return replyTo ? `↩${replyTo}::${decodedBody}` : decodedBody;
  }

  if (isEncrypted) {
    try {
      return await decryptMessage(content);
    } catch {
      return content;
    }
  }

  return content;
}

interface StatusCommentsPropsExtended extends StatusCommentsProps {
  open?: boolean;
}

export function StatusComments({
  statusId,
  commentsCount,
  open = false,
}: StatusCommentsPropsExtended) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(open);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);

  useEffect(() => {
    if (open) setIsExpanded(true);
  }, [open]);

  useEffect(() => {
    if (!isExpanded) setReplyTarget(null);
  }, [isExpanded]);

  const [decryptedComments, setDecryptedComments] = useState<Map<string, string>>(new Map());

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["status-comments", statusId],
    queryFn: async () => {
      const { data } = await supabase
        .from("status_comments")
        .select("*")
        .eq("status_id", statusId)
        .order("created_at", { ascending: true });

      if (!data) return [] as Comment[];

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map<string, CommentProfile>(
        (profiles ?? []).map((p) => [
          p.user_id,
          { username: p.username, avatar_url: p.avatar_url },
        ]),
      );

      return data.map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id),
      })) as Comment[];
    },
    enabled: isExpanded,
  });

  useEffect(() => {
    async function decryptComments() {
      const decrypted = new Map<string, string>();
      for (const comment of comments) {
        decrypted.set(
          comment.id,
          await decodeCommentContent(comment.content, comment.is_encrypted),
        );
      }
      setDecryptedComments(decrypted);
    }
    if (comments.length > 0) {
      decryptComments();
    }
  }, [comments]);

  useEffect(() => {
    if (!isExpanded) return;
    const channel = supabase
      .channel(`comments-${statusId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "status_comments",
          filter: `status_id=eq.${statusId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["status-comments", statusId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusId, isExpanded, queryClient]);

  const addCommentMutation = useMutation({
    mutationFn: async ({
      content,
      replyTarget,
    }: {
      content: string;
      replyTarget: Comment | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      let encryptedContent = content;
      let isEncrypted = false;
      try {
        encryptedContent = await encryptMessage(content);
        isEncrypted = true;
      } catch {
        encryptedContent = content;
      }

      const payloadContent = serializeReplyContent(
        encryptedContent,
        replyTarget?.profile?.username,
      );
      const { error } = await supabase.from("status_comments").insert({
        status_id: statusId,
        user_id: user.id,
        content: payloadContent,
        is_encrypted: isEncrypted,
      });
      if (error) throw error;
      await updateStatusCount(supabase, statusId, "comments_count", 1);
    },
    onSuccess: () => {
      setNewComment("");
      setReplyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["user-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["status-comments", statusId] });
      void recommendationEventService.recordEvent({
        userId: user?.id ?? null,
        entityType: "post",
        entityId: statusId,
        action: "comment",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    addCommentMutation.mutate({ content, replyTarget });
  };

  return (
    <div className="mt-1">
      {commentsCount > 0 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-[14px] text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer"
        >
          View all {commentsCount} comments
        </button>
      )}

      {isExpanded && (
        <div className="mt-1 space-y-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            Hide comments
          </button>
          {isLoading ? (
            <div className="py-2 text-[14px] text-muted-foreground">Loading comments...</div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const parsed = parseReplyContent(
                  decryptedComments.get(comment.id) ?? comment.content,
                );
                return (
                  <div
                    key={comment.id}
                    className="text-[14px] leading-[18px] group flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold tracking-tight">
                          {comment.profile?.username ?? "Unknown"}
                        </span>
                        {parsed.replyTo && (
                          <span className="text-[11px] text-muted-foreground">
                            replying to {parsed.replyTo}
                          </span>
                        )}
                      </div>
                      <div className="text-[14px] break-words">{parsed.body}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {comment.is_encrypted && (
                        <Lock className="h-3 w-3 text-muted-foreground opacity-50" />
                      )}
                      <button
                        type="button"
                        onClick={() => setReplyTarget(comment)}
                        className="text-[11px] uppercase tracking-wide text-primary/80 hover:text-primary"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {replyTarget && (
        <div className="mt-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between gap-3">
          <span>Replying to {replyTarget.profile?.username ?? "this comment"}</span>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className="text-primary hover:text-primary/80"
          >
            Cancel
          </button>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center relative">
          <Avatar className="h-7 w-7 mr-3 shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url ?? ""} />
            <AvatarFallback className="bg-secondary text-[10px]">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground pr-10"
          />
          {newComment.trim() && (
            <button
              type="submit"
              disabled={addCommentMutation.isPending}
              className="absolute right-0 text-primary text-[14px] font-bold hover:text-foreground transition-colors disabled:opacity-50"
            >
              Post
            </button>
          )}
        </form>
      )}
    </div>
  );
}
