// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, subHours } from "date-fns";
import {
  Camera,
  Plus,
  Layers,
  Heart,
  MessageCircle,
  Clock,
  Trash2,
  Pencil,
  BarChart3,
  Eye,
  TrendingUp,
  Check,
  Send,
  AlertCircle,
} from "lucide-react";
import { StoryViewer } from "@/components/social/stories-rail";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import {
  resolveStoryGradient,
  isVideoStory,
  STORY_GRADIENTS,
  encodeTextStoryType,
} from "@/features/stories/gradients";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ─────────────────────────────────────────────────────────────────

function hoursLeft(createdAt: string) {
  const h = 24 - (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return Math.max(0, h);
}

// Stories live in `user_statuses`; likes and comments live in
// `status_likes` (status_id, user_id) and
// `status_comments` (id, status_id, user_id, content, created_at).

// ─── Story thumbnail (reused in grid + stats list) ────────────────────────────

function StoryThumb({
  story,
  index,
  className = "",
}: {
  story: any;
  index: number;
  className?: string;
}) {
  const isVid = isVideoStory(story);
  const grad = resolveStoryGradient(story.media_type, index);

  if (isVid) {
    return (
      <video
        src={story.media_url}
        className={cn("w-full h-full object-cover", className)}
        muted
        playsInline
      />
    );
  }
  if (story.media_url) {
    return (
      <img
        src={optimizeImageUrl(story.media_url, { width: 800, quality: 75 })}
        alt=""
        className={cn("w-full h-full object-cover", className)}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div
      className={cn("w-full h-full flex items-center justify-center p-2", className)}
      style={{ background: grad }}
    >
      <p className="text-[9px] font-bold text-white text-center line-clamp-3 leading-tight drop-shadow-sm">
        {story.content ?? ""}
      </p>
    </div>
  );
}

// ─── Comments dialog (opened from the My Stories stats rows) ─────────────────

function CommentsDialog({
  story,
  open,
  onOpenChange,
}: {
  story: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const {
    data: comments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["story-comments", story?.id],
    enabled: !!story && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_comments")
        .select("id, status_id, user_id, content, created_at")
        .eq("status_id", story.id)
        .order("created_at", { ascending: true });

      // surface the error instead of silently returning [] — an empty list
      // and a failed fetch look identical to the user otherwise
      if (error) throw error;

      const ids = [...new Set((data ?? []).map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", ids.length ? ids : ["__none__"]);
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);

      return (data ?? []).map((c: any) => ({ ...c, profile: profileMap.get(c.user_id) }));
    },
  });

  const postMut = useMutation({
    mutationFn: async () => {
      if (!story || !user) throw new Error("Sign in to comment");
      const trimmed = text.trim();
      if (!trimmed) throw new Error("Comment is empty");

      const { data, error } = await supabase
        .from("status_comments")
        .insert({ status_id: story.id, user_id: user.id, content: trimmed })
        .select()
        .single();
      if (error) throw error;

      const table = "user_statuses";
      await supabase
        .from(table)
        .update({ comments_count: (story.comments_count ?? 0) + 1 })
        .eq("id", story.id);

      return data;
    },
    onSuccess: (inserted) => {
      setText("");
      // Show the new comment immediately rather than waiting on a refetch
      qc.setQueryData(["story-comments", story.id], (old: any[] = []) => [
        ...old,
        {
          ...inserted,
          profile: {
            username: user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "You",
            avatar_url: user?.user_metadata?.avatar_url ?? "",
          },
        },
      ]);
      // Real comment-count sources for the stats section
      qc.invalidateQueries({ queryKey: ["story-comment-counts"] });
      qc.invalidateQueries({ queryKey: ["stories-grid"] });
      qc.invalidateQueries({ queryKey: ["my-stories"] });
    },
    onError: (e: any) =>
      toast({ title: "Could not post comment", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm flex flex-col max-h-[75vh] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="text-base">Comments</DialogTitle>
        </DialogHeader>

        {/* comment list */}
        <div className="flex-1 overflow-y-auto min-h-[160px] px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className="h-10 flex-1 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive/60" />
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Couldn't load comments right now. Check your connection and try again.
              </p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No comments yet — be the first to say something.
              </p>
            </div>
          ) : (
            comments.map((c: any) => {
              const isMine = c.user_id === user?.id;
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarImage src={c.profile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-[10px] font-bold bg-secondary text-foreground">
                      {c.profile?.username?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 border",
                      isMine
                        ? "bg-primary/10 border-primary/20"
                        : "bg-secondary/50 border-border/30",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold truncate">
                        {isMine ? "You" : (c.profile?.username ?? "Unknown")}
                      </p>
                      <p className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(c.created_at))} ago
                      </p>
                    </div>
                    <p className="text-[13px] text-foreground/90 mt-0.5 break-words leading-snug">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* composer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40 bg-card/60">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim() && !postMut.isPending) {
                e.preventDefault();
                postMut.mutate();
              }
            }}
            maxLength={280}
            placeholder={user ? "Write a comment…" : "Sign in to comment"}
            disabled={!user}
            className="flex-1 rounded-full bg-secondary/50 border border-border/50 text-xs px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            disabled={!user || !text.trim() || postMut.isPending}
            onClick={() => postMut.mutate()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Community story card ─────────────────────────────────────────────────────
// Kept clean — no like/comment actions here. Those live in the My Stories
// stats rows below, where they now reflect real fetched comment counts.

function CommunityCard({
  group,
  index,
  onClick,
}: {
  group: any;
  index: number;
  onClick: () => void;
}) {
  const latest = group.stories[group.stories.length - 1];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      type="button"
      onClick={onClick}
      className="flex flex-col text-left group cursor-pointer w-full"
    >
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-2.5 bg-secondary border border-border/40 group-hover:border-primary/60 transition-all duration-200 shadow-md group-hover:shadow-primary/10 group-hover:shadow-lg">
        <StoryThumb story={latest} index={index} />

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20 pointer-events-none" />

        {/* story count badge */}
        {group.stories.length > 1 && (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
            <Layers className="h-3 w-3" />
            {group.stories.length}
          </div>
        )}

        {/* user info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-2">
          <div
            className="shrink-0 p-[2px] rounded-full"
            style={{
              background: "linear-gradient(135deg, hsl(142 76% 45%), hsl(180 100% 50%))",
            }}
          >
            <Avatar className="h-8 w-8 border-[1.5px] border-black">
              <AvatarImage src={group.profile?.avatar_url} className="object-cover" />
              <AvatarFallback className="text-[10px] font-bold bg-secondary text-foreground">
                {group.profile?.username?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white truncate drop-shadow-md leading-none mb-0.5">
              {group.profile?.username ?? "—"}
            </p>
            <p className="text-[10px] text-white/70 font-medium">
              {formatDistanceToNow(new Date(latest.created_at))} ago
            </p>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Stats row (my story card) ────────────────────────────────────────────────

function MyStoryRow({
  story,
  index,
  liked,
  commentsCount,
  onDelete,
  onEdit,
  onView,
  onLike,
  onComment,
}: {
  story: any;
  index: number;
  liked?: boolean;
  commentsCount: number;
  onDelete: (s: any) => void;
  onEdit: (s: any) => void;
  onView: () => void;
  onLike: (s: any) => void;
  onComment: (s: any) => void;
}) {
  const isText = !story.media_url;
  const likes = story.likes_count ?? 0;
  const remaining = hoursLeft(story.created_at);
  const pct = (remaining / 24) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3 bg-card/50 border border-border/40 rounded-2xl p-3 hover:border-border/70 hover:bg-card/80 transition-all group"
    >
      {/* Thumbnail */}
      <button
        onClick={onView}
        className="relative w-12 h-[72px] shrink-0 rounded-xl overflow-hidden border border-border/30 group-hover:border-primary/40 transition-colors"
        aria-label="Preview"
      >
        <StoryThumb story={story} index={index} />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="h-4 w-4 text-white drop-shadow" />
        </div>
      </button>

      {/* Info + stats */}
      <div className="flex-1 min-w-0">
        {/* caption */}
        <p className="text-[13px] font-semibold text-foreground truncate leading-snug mb-1.5">
          {story.content
            ? story.content.length > 45
              ? story.content.slice(0, 45) + "…"
              : story.content
            : isVideoStory(story)
              ? "Video story"
              : "Photo story"}
        </p>

        {/* stats pills — heart + comment are interactive, comment count is live */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => onLike(story)}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 border transition-colors",
              liked
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/15 hover:bg-rose-500/15",
            )}
          >
            <Heart className={cn("h-3 w-3", liked && "fill-rose-400")} />
            {likes.toLocaleString()}
          </button>
          <button
            onClick={() => onComment(story)}
            className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 font-semibold rounded-full px-2 py-0.5 border border-blue-500/15 hover:bg-blue-500/15 transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            {commentsCount.toLocaleString()}
          </button>
          <span className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 font-semibold rounded-full px-2 py-0.5 border border-amber-500/15">
            <Clock className="h-3 w-3" />
            {remaining < 1 ? "<1h" : `${Math.round(remaining)}h`}
          </span>
        </div>

        {/* expiry progress */}
        <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* action buttons */}
      <div className="flex flex-col gap-1 shrink-0">
        {isText && (
          <button
            onClick={() => onEdit(story)}
            className="p-1.5 rounded-lg hover:bg-primary/15 transition-colors text-muted-foreground hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(story)}
          className="p-1.5 rounded-lg hover:bg-destructive/15 transition-colors text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

function EditDialog({
  story,
  open,
  onOpenChange,
}: {
  story: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [gid, setGid] = useState("neon");

  // sync when story changes — useEffect not useMemo (no side-effects in render)
  useEffect(() => {
    if (!story) return;
    setText(story.content ?? "");
    setGid(story.media_type?.startsWith("text:") ? story.media_type.slice("text:".length) : "neon");
  }, [story]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!story) return;
      const { error } = await supabase
        .from("user_statuses")
        .update({ content: text.trim(), media_type: encodeTextStoryType(gid) })
        .eq("id", story.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories-grid"] });
      qc.invalidateQueries({ queryKey: ["my-stories"] });
      toast({ title: "Story updated" });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const grad = STORY_GRADIENTS.find((g) => g.id === gid) ?? STORY_GRADIENTS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit story</DialogTitle>
        </DialogHeader>

        {/* live preview */}
        <div
          className="relative h-28 rounded-xl overflow-hidden flex items-center justify-center p-4"
          style={{ background: grad.css }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <p className="relative text-white font-bold text-center drop-shadow-md line-clamp-3 text-sm">
            {text || "Your text here…"}
          </p>
        </div>

        {/* text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={180}
          rows={3}
          className="w-full rounded-xl bg-secondary/50 border border-border/50 text-sm px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          placeholder="What's on your mind?"
        />
        <p className="text-[11px] text-muted-foreground text-right -mt-2">{text.length}/180</p>

        {/* gradient */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Background</p>
          <div className="grid grid-cols-9 gap-1.5">
            {STORY_GRADIENTS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGid(g.id)}
                className={cn(
                  "relative h-7 rounded-lg overflow-hidden transition-transform hover:scale-110 active:scale-95",
                  gid === g.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
                style={{ background: g.css }}
              >
                {gid === g.id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white drop-shadow stroke-[3]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!text.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { cleanupExpiredStories } from "@/lib/story-cleanup";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Stories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showViewer, setShowViewer] = useState(false);
  const [viewingIdx, setViewingIdx] = useState(0);
  const [myViewerOpen, setMyViewerOpen] = useState(false);
  const [myViewerStartIndex, setMyViewerStartIndex] = useState(0);
  const [myViewerOpenComments, setMyViewerOpenComments] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [commentTarget, setCommentTarget] = useState<any>(null);

  // ── community stories ──
  const { data: userGroups = [], isLoading: communityLoading } = useQuery({
    queryKey: ["stories-grid", user?.id],
    staleTime: 0,
    queryFn: async () => {
      try {
        const { items } = await recommendationService.fetchRecommendations("stories", user?.id, 36);
        const data = (items || [])
          .map((item: any) => item.payload)
          .filter(Boolean)
          .map((s: any) => ({ ...s, _table: "user_statuses" }));
        // If recommendations are empty, fall back to DB query below
        if (!data.length) {
          throw new Error("no-recommendations");
        }
        const ids = [...new Set(data.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", ids);
        const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);

        const grouped = new Map<string, any[]>();
        for (const s of data) {
          const arr = grouped.get(s.user_id) ?? [];
          arr.push(s);
          grouped.set(s.user_id, arr);
        }

        return Array.from(grouped.entries())
          .map(([uid, stories]) => ({
            user_id: uid,
            profile: profileMap.get(uid) ?? { username: "Unknown" },
            stories,
          }))
          .sort((a, b) => {
            const aT = new Date(a.stories[a.stories.length - 1].created_at).getTime();
            const bT = new Date(b.stories[b.stories.length - 1].created_at).getTime();
            return bT - aT;
          });
      } catch (err) {
        // if recommendations failed or returned empty, fetch recent stories from DB
        const cutoff = subHours(new Date(), 24).toISOString();
        const { data: rows, error: rowsError } = await supabase
          .from("user_statuses")
          .select("*")
          .not("expires_at", "is", null)
          .gte("created_at", cutoff)
          .order("created_at", { ascending: true });
        if (rowsError) throw rowsError;
        const data = (rows ?? []).map((s: any) => ({ ...s, _table: "user_statuses" }));

        if (!data?.length) return [];

        const ids = [...new Set(data.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", ids);
        const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);

        const grouped = new Map<string, any[]>();
        for (const s of data) {
          const arr = grouped.get(s.user_id) ?? [];
          arr.push(s);
          grouped.set(s.user_id, arr);
        }

        return Array.from(grouped.entries())
          .map(([uid, stories]) => ({
            user_id: uid,
            profile: profileMap.get(uid) ?? { username: "Unknown" },
            stories,
          }))
          .sort((a, b) => {
            const aT = new Date(a.stories[a.stories.length - 1].created_at).getTime();
            const bT = new Date(b.stories[b.stories.length - 1].created_at).getTime();
            return bT - aT;
          });
      }
    },
  });

  // ── my stories ──
  const { data: myStories = [], isLoading: myLoading } = useQuery({
    queryKey: ["my-stories", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      if (!user) return [];
      const cutoff = subHours(new Date(), 24).toISOString();
      const { data, error } = await supabase
        .from("user_statuses")
        .select(
          "id, user_id, content, media_url, media_type, created_at, likes_count, comments_count, views_count",
        )
        .eq("user_id", user.id)
        .not("expires_at", "is", null)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({ ...s, _table: "user_statuses" }));
    },
  });

  // ── real comment counts for my stories (fetched from status_comments, not
  // the possibly-stale comments_count column) ──
  const myStoryIds = useMemo(() => myStories.map((s: any) => s.id), [myStories]);

  const { data: commentCountRows = [] } = useQuery({
    queryKey: ["story-comment-counts", myStoryIds.join(",")],
    enabled: myStoryIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_comments")
        .select("status_id")
        .in("status_id", myStoryIds);
      if (error || !data) return [];
      return data;
    },
  });

  const commentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    commentCountRows.forEach((r: any) => {
      map.set(r.status_id, (map.get(r.status_id) ?? 0) + 1);
    });
    return map;
  }, [commentCountRows]);

  const getCommentsCount = (story: any) =>
    commentCountMap.has(story.id) ? commentCountMap.get(story.id)! : (story.comments_count ?? 0);

  // ── liked story ids (for current user) ──
  const allVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    userGroups.forEach((g: any) => g.stories.forEach((s: any) => ids.add(s.id)));
    myStories.forEach((s: any) => ids.add(s.id));
    return Array.from(ids);
  }, [userGroups, myStories]);

  const { data: likedIds = [] } = useQuery({
    queryKey: ["story-likes", user?.id, allVisibleIds.join(",")],
    enabled: !!user && allVisibleIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status_likes")
        .select("status_id")
        .eq("user_id", user!.id)
        .in("status_id", allVisibleIds);
      if (error || !data) return [];
      return data.map((d: any) => d.status_id);
    },
  });
  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  // viewer groups for my stories
  const myGroups = useMemo(() => {
    if (!user || !myStories.length) return [];
    return [
      {
        user_id: user.id,
        profile: {
          username: "You",
          avatar_url: user.user_metadata?.avatar_url ?? "",
        },
        stories: [...myStories].reverse(),
      },
    ];
  }, [user, myStories]);

  // aggregate stats — comments now come from the live count map
  const totalLikes = myStories.reduce((s: number, x: any) => s + (x.likes_count ?? 0), 0);
  const totalComments = myStories.reduce((s: number, x: any) => s + getCommentsCount(x), 0);
  const totalViews = myStories.reduce((s: number, x: any) => s + (x.views_count ?? 0), 0);

  // ── real-time updates for likes, comments, and views on stories ──
  useEffect(() => {
    void cleanupExpiredStories();

    const channel = supabase
      .channel("stories-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_statuses" }, () => {
        qc.invalidateQueries({ queryKey: ["my-stories"] });
        qc.invalidateQueries({ queryKey: ["stories-grid"] });
        qc.invalidateQueries({ queryKey: ["story-comment-counts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "status_likes" }, () => {
        qc.invalidateQueries({ queryKey: ["my-stories"] });
        qc.invalidateQueries({ queryKey: ["story-likes"] });
        qc.invalidateQueries({ queryKey: ["stories-grid"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "status_comments" }, () => {
        qc.invalidateQueries({ queryKey: ["my-stories"] });
        qc.invalidateQueries({ queryKey: ["story-comment-counts"] });
        qc.invalidateQueries({ queryKey: ["stories-grid"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // ── delete ──
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories-grid"] });
      qc.invalidateQueries({ queryKey: ["my-stories"] });
      toast({ title: "Story deleted" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── like / unlike (My Stories only) ──
  const likeMut = useMutation({
    mutationFn: async (story: any) => {
      if (!user) throw new Error("Sign in to like stories");
      const table = "user_statuses";
      const alreadyLiked = likedSet.has(story.id);

      if (alreadyLiked) {
        await supabase
          .from("status_likes")
          .delete()
          .eq("status_id", story.id)
          .eq("user_id", user.id);
        await supabase
          .from(table)
          .update({ likes_count: Math.max(0, (story.likes_count ?? 0) - 1) })
          .eq("id", story.id);
      } else {
        await supabase.from("status_likes").insert({ status_id: story.id, user_id: user.id });
        await supabase
          .from(table)
          .update({ likes_count: (story.likes_count ?? 0) + 1 })
          .eq("id", story.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories-grid"] });
      qc.invalidateQueries({ queryKey: ["my-stories"] });
      qc.invalidateQueries({ queryKey: ["story-likes"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleLike = (story: any) => {
    if (!user) {
      toast({ title: "Sign in to like stories" });
      return;
    }
    likeMut.mutate(story);
  };

  // featured (first two) vs the rest — kept mutually exclusive to avoid rendering
  // the same story cards twice on the page
  const featuredGroups = userGroups.slice(0, 2);
  const remainingGroups = userGroups.slice(2);

  return (
    <SocialLayout
      title="Stories"
      subtitle="Stories from the community • Expire in 24 hours"
      headerRight={
        <>
          <Button asChild size="sm" className="gap-2 hidden md:inline-flex">
            <Link to="/stories/new">
              <Plus className="h-4 w-4" />
              Create Story
            </Link>
          </Button>
          <Button asChild size="icon" className="md:hidden rounded-full h-8 w-8">
            <Link to="/stories/new" aria-label="Create story">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <div className="px-4 md:px-0 space-y-10">
        {/* ──────────── COMMUNITY STORIES ──────────── */}
        <section>
          {communityLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-2xl w-full" />
              ))}
            </div>
          ) : userGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-5 bg-card/30 rounded-2xl border border-dashed border-border/50">
              <div className="h-16 w-16 rounded-full bg-secondary/80 flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-lg">No active stories</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Be the first — share a 24-hour highlight with the community.
                </p>
                <Button asChild>
                  <Link to="/stories/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Story
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Featured large cards (first two), left-aligned to match design */}
              {featuredGroups.length > 0 && (
                <div className="flex items-start justify-start gap-6 flex-wrap">
                  {featuredGroups.map((g, idx) => (
                    <div key={g.user_id} className="w-[210px] md:w-[230px] lg:w-[250px]">
                      <CommunityCard
                        group={g}
                        index={idx}
                        onClick={() => {
                          setViewingIdx(idx);
                          setShowViewer(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Remaining grid — excludes the two featured above so nothing repeats */}
              {remainingGroups.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {remainingGroups.map((g, idx) => (
                    <CommunityCard
                      key={g.user_id}
                      group={g}
                      index={idx + featuredGroups.length}
                      onClick={() => {
                        setViewingIdx(idx + featuredGroups.length);
                        setShowViewer(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ──────────── MY STORIES STATS (logged-in only) ──────────── */}
        {user && (
          <section>
            {/* section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base tracking-tight">My Stories</h2>
                {myStories.length > 0 && (
                  <span className="bg-primary/15 text-primary text-[11px] font-bold rounded-full px-2 py-0.5">
                    {myStories.length} active
                  </span>
                )}
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <Link to="/stories/new">
                  <Plus className="h-3.5 w-3.5" />
                  New Story
                </Link>
              </Button>
            </div>

            {myLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[84px] rounded-2xl" />
                ))}
              </div>
            ) : myStories.length === 0 ? (
              <div className="flex items-center gap-4 bg-card/40 border border-dashed border-border/40 rounded-2xl p-5">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-secondary/80 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold">No stories yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create a story to see your likes, comments, and expiry countdown here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* aggregate stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "Stories",
                      value: myStories.length,
                      icon: Layers,
                      from: "from-primary/20",
                      text: "text-primary",
                    },
                    {
                      label: "Total Likes",
                      value: totalLikes,
                      icon: Heart,
                      from: "from-rose-500/20",
                      text: "text-rose-400",
                    },
                    {
                      label: "Comments",
                      value: totalComments,
                      icon: MessageCircle,
                      from: "from-blue-500/20",
                      text: "text-blue-400",
                    },
                    {
                      label: "Views",
                      value: totalViews,
                      icon: Eye,
                      from: "from-emerald-500/20",
                      text: "text-emerald-400",
                    },
                  ].map(({ label, value, icon: Icon, from, text }) => (
                    <div
                      key={label}
                      className={cn(
                        "bg-gradient-to-br to-transparent border border-border/40 rounded-2xl p-4 flex flex-col items-center text-center gap-1.5",
                        from,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", text)} />
                      <span className="text-2xl font-extrabold text-foreground tracking-tight">
                        {value.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* per-story rows */}
                <div className="space-y-2.5">
                  {myStories.map((story: any, idx: number) => (
                    <MyStoryRow
                      key={story.id}
                      story={story}
                      index={idx}
                      liked={likedSet.has(story.id)}
                      commentsCount={getCommentsCount(story)}
                      onDelete={setDeleteTarget}
                      onEdit={setEditTarget}
                      onLike={handleLike}
                      onComment={setCommentTarget}
                      onView={() => {
                        setMyViewerStartIndex(myStories.length - 1 - idx);
                        setMyViewerOpenComments(false);
                        setMyViewerOpen(true);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* guest prompt */}
        {!user && (
          <div className="flex items-center gap-4 bg-card/40 border border-primary/20 rounded-2xl p-5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Track your story stats</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in to see likes, comments, and manage your own stories.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── viewers ── */}
      {showViewer && userGroups.length > 0 && (
        <StoryViewer
          userGroups={userGroups}
          initialGroupIndex={viewingIdx}
          onClose={() => setShowViewer(false)}
        />
      )}
      {myViewerOpen && myGroups.length > 0 && (
        <StoryViewer
          userGroups={myGroups}
          initialGroupIndex={0}
          initialStoryIndex={myViewerStartIndex}
          openComments={myViewerOpenComments}
          onClose={() => {
            setMyViewerOpen(false);
            setMyViewerOpenComments(false);
          }}
        />
      )}

      {/* ── delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── edit dialog ── */}
      <EditDialog
        story={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />

      {/* ── comments dialog ── */}
      <CommentsDialog
        story={commentTarget}
        open={!!commentTarget}
        onOpenChange={(v) => !v && setCommentTarget(null)}
      />
    </SocialLayout>
  );
}
