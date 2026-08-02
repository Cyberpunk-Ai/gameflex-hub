// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Card } from "@/components/ui/card";
import { Heart, Eye, MessageCircle } from "lucide-react";
import { subDays } from "date-fns";
import { recommendationService } from "@/services/recommendations/RecommendationService";
import { useAuth } from "@/lib/auth-context";

export default function Explore() {
  const { user } = useAuth();

  const { data: posts = [] } = useQuery({
    queryKey: ["explore-posts", user?.id],
    queryFn: async () => {
      try {
        const { items } = await recommendationService.fetchRecommendations(
          "explore",
          user?.id,
          24,
        );
        return items.map((item: any) => item.payload);
      } catch {
        const weekAgo = subDays(new Date(), 7).toISOString();
        const { data } = await supabase
          .from("user_statuses")
          .select("*")
          .gte("created_at", weekAgo)
          .not("media_url", "is", null)
          .order("likes_count", { ascending: false })
          .limit(24);
        return data ?? [];
      }
    },
  });


  return (
    <SocialLayout title="Explore" subtitle="Discover top gaming moments across the community">
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No posts to explore yet — be the first to share a clip.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {posts.map((p: any) => (
            <Link
              key={p.id}
              to={`/post/${p.id}`}
              className="group relative aspect-square block overflow-hidden rounded-lg bg-secondary"
            >
              {p.media_type === "video" ? (
                <video src={p.media_url} className="w-full h-full object-cover" muted />
              ) : (
                <img
                  loading="lazy"
                  decoding="async"
                  src={optimizeImageUrl(p.media_url, { width: 400, quality: 75 })}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white text-sm font-semibold transition-opacity">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 fill-current" />
                  {p.likes_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {p.comments_count ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SocialLayout>
  );
}
