// @ts-nocheck
import { useParams, Link } from "@/lib/router-compat";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/social/follow-button";
import { Trophy, Heart, Users, DollarSign } from "lucide-react";

export default function CreatorPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["creator", id],
    queryFn: async () => {
      const [{ data: profile }, { data: posts }, { data: followers }, { data: likes }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
          supabase
            .from("user_statuses")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
            .limit(12),
          supabase
            .from("user_follows")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", id),
          supabase.from("user_statuses").select("likes_count").eq("user_id", id),
        ]);
      const totalLikes = likes?.reduce((s: number, p: any) => s + (p.likes_count ?? 0), 0) ?? 0;
      return { profile, posts: posts ?? [], followers: (followers as any)?.count ?? 0, totalLikes };
    },
  });

  if (!data?.profile)
    return (
      <SocialLayout title="Creator">
        <p className="text-center py-16 text-muted-foreground">Creator not found.</p>
      </SocialLayout>
    );
  const { profile, posts, followers, totalLikes } = data;

  return (
    <SocialLayout>
      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Creator page</p>
          </div>
          <FollowButton userId={profile.user_id} username={profile.username} />
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat icon={Users} label="Followers" value={followers} />
          <Stat icon={Heart} label="Total likes" value={totalLikes} />
          <Stat icon={Trophy} label="Posts" value={posts.length} />
          <Stat icon={DollarSign} label="Tips" value="—" />
        </div>
      </div>

      <h2 className="font-display font-bold mb-3">Latest posts</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {posts.map((p: any) => (
          <Link
            key={p.id}
            to={`/post/${p.id}`}
            className="aspect-square rounded-lg overflow-hidden bg-secondary block"
          >
            {p.media_url ? (
              p.media_type === "video" ? (
                <video src={p.media_url} className="w-full h-full object-cover" muted />
              ) : (
                <img
                  loading="lazy"
                  decoding="async"
                  src={optimizeImageUrl(p.media_url, { width: 400, quality: 75 })}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="p-3 text-xs line-clamp-6">{p.content}</div>
            )}
          </Link>
        ))}
      </div>
    </SocialLayout>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="p-3 rounded-lg bg-background/50">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <div className="font-display font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
