// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SocialLayout } from "@/components/social/social-nav";
import { Bookmark } from "lucide-react";

export default function Saved() {
  const { user } = useAuth();
  const { data: saved = [] } = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Reuses status_likes as saved-for-later signal (extend later with a proper post_saves table)
      const { data: likes } = await supabase
        .from("status_likes")
        .select("status_id")
        .eq("user_id", user!.id);
      const ids = likes?.map((l: any) => l.status_id) ?? [];
      if (!ids.length) return [];
      const { data: posts } = await supabase.from("user_statuses").select("*").in("id", ids);
      return posts ?? [];
    },
  });

  if (!user) {
    return (
      <SocialLayout title="Saved">
        <p className="text-center text-muted-foreground py-16">Sign in to see your saved posts.</p>
      </SocialLayout>
    );
  }

  return (
    <SocialLayout title="Saved" subtitle="Posts you've liked and want to revisit">
      {saved.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No saved posts yet. Like a post to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {saved.map((p: any) => (
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
                <div className="p-4 text-xs line-clamp-6">{p.content}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </SocialLayout>
  );
}
