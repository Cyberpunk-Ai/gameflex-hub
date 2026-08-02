import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SocialLayout } from "@/components/social/social-nav";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type EventKind = "like" | "follow" | "comment";

interface ActivityEvent {
  kind: EventKind;
  actor: string;
  at: string;
}

export default function Activity() {
  const { user } = useAuth();
  const { data: activity = [] } = useQuery<ActivityEvent[]>({
    queryKey: ["activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: myPosts } = await supabase
        .from("user_statuses")
        .select("id")
        .eq("user_id", user!.id);
      const ids = myPosts?.map((p) => p.id) ?? [];
      if (!ids.length) return [];
      const [{ data: likes }, { data: followers }, { data: comments }] = await Promise.all([
        supabase
          .from("status_likes")
          .select("status_id, user_id, created_at")
          .in("status_id", ids)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("user_follows")
          .select("follower_id, created_at")
          .eq("following_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("status_comments")
          .select("status_id, user_id, created_at")
          .in("status_id", ids)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const actorIds = [
        ...new Set([
          ...(likes ?? []).map((l) => l.user_id),
          ...(followers ?? []).map((f) => f.follower_id),
          ...(comments ?? []).map((c) => c.user_id),
        ]),
      ];
      if (!actorIds.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", actorIds);
      const nameOf = (id: string): string =>
        profs?.find((p) => p.user_id === id)?.username ?? "Someone";
      const events: ActivityEvent[] = [];
      likes?.forEach((l) =>
        events.push({ kind: "like", actor: nameOf(l.user_id), at: l.created_at }),
      );
      followers?.forEach((f) =>
        events.push({ kind: "follow", actor: nameOf(f.follower_id), at: f.created_at }),
      );
      comments?.forEach((c) =>
        events.push({ kind: "comment", actor: nameOf(c.user_id), at: c.created_at }),
      );
      return events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    },
  });

  if (!user)
    return (
      <SocialLayout title="Activity">
        <p className="text-center text-muted-foreground py-16">Sign in to view your activity.</p>
      </SocialLayout>
    );

  return (
    <SocialLayout title="Activity" subtitle="Recent interactions on your profile and posts">
      {activity.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {activity.map((e, i) => (
            <li
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50"
            >
              {e.kind === "like" && <Heart className="h-4 w-4 text-destructive" />}
              {e.kind === "follow" && <UserPlus className="h-4 w-4 text-primary" />}
              {e.kind === "comment" && <MessageCircle className="h-4 w-4 text-blue-500" />}
              <span className="text-sm flex-1">
                <b>{e.actor}</b>{" "}
                {e.kind === "like"
                  ? "liked your post"
                  : e.kind === "follow"
                    ? "started following you"
                    : "commented on your post"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SocialLayout>
  );
}
