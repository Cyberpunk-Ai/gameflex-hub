// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, Link } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusComments } from "@/components/social/status-comments";
import { Heart, Eye, ArrowLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { updateStatusCount } from "@/lib/social-analytics";
import { cn } from "@/lib/utils";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data } = await supabase.from("user_statuses").select("*").eq("id", id).maybeSingle();
      if (!data) return null;

      const [{ data: profile }, { data: userLike }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .eq("user_id", data.user_id)
          .maybeSingle(),
        user
          ? supabase
              .from("status_likes")
              .select("id")
              .eq("status_id", id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return { ...data, profile, isLiked: !!userLike };
    },
  });

  // Track view count on load
  useEffect(() => {
    if (id) {
      updateStatusCount(supabase, id, "views_count", 1).then(() => {
        queryClient.invalidateQueries({ queryKey: ["post", id] });
      });
    }
  }, [id, queryClient]);

  // Realtime subscription for this post's likes/comments/views updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`post-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_statuses", filter: `id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post", id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_likes", filter: `status_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post", id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_comments", filter: `status_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post", id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to like posts");
      if (post?.isLiked) {
        await supabase.from("status_likes").delete().eq("status_id", id).eq("user_id", user.id);
        await updateStatusCount(supabase, id, "likes_count", -1);
      } else {
        await supabase.from("status_likes").insert({ status_id: id, user_id: user.id });
        await updateStatusCount(supabase, id, "likes_count", 1);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", id] });
      const prev = queryClient.getQueryData(["post", id]);
      queryClient.setQueryData(["post", id], (old: any) =>
        old
          ? {
              ...old,
              isLiked: !old.isLiked,
              likes_count: (old.likes_count ?? 0) + (old.isLiked ? -1 : 1),
            }
          : old,
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["post", id], ctx.prev);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["user-statuses"] });
    },
  });

  if (isLoading)
    return (
      <SocialLayout title="Post">
        <p className="text-center py-16 text-muted-foreground">Loading...</p>
      </SocialLayout>
    );
  if (!post)
    return (
      <SocialLayout title="Post not found">
        <Link to="/social" className="text-primary text-sm flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
      </SocialLayout>
    );

  return (
    <SocialLayout>
      <Link
        to="/social"
        className="text-sm text-muted-foreground flex items-center gap-1 mb-4 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <article className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Link to={`/player/${post.user_id}`}>
            <Avatar className="h-11 w-11">
              <AvatarImage src={post.profile?.avatar_url} />
              <AvatarFallback>{post.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/player/${post.user_id}`} className="font-medium hover:text-primary">
              {post.profile?.username ?? "Anonymous"}
            </Link>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        {post.content && (
          <p className="px-4 pb-3 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
        )}
        {post.media_url && (
          <div className="bg-black">
            {post.media_type === "video" ? (
              <video src={post.media_url} controls className="w-full max-h-[600px]" />
            ) : (
              <img
                loading="lazy"
                decoding="async"
                src={post.media_url}
                className="w-full max-h-[600px] object-contain"
              />
            )}
          </div>
        )}
        <div className="p-4 flex items-center gap-6 text-sm border-t border-border/50">
          <button
            onClick={() =>
              user ? likeMutation.mutate() : toast({ title: "Sign in to like posts" })
            }
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              post.isLiked
                ? "text-red-500 font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart className={cn("h-5 w-5", post.isLiked && "fill-red-500 text-red-500")} />
            <span>{post.likes_count ?? 0}</span>
          </button>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments_count ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground ml-auto text-xs">
            <Eye className="h-4 w-4" />
            <span>{post.views_count ?? 0} views</span>
          </span>
        </div>
        <div className="px-4 pb-4">
          <StatusComments statusId={post.id} commentsCount={post.comments_count ?? 0} />
        </div>
      </article>
    </SocialLayout>
  );
}
