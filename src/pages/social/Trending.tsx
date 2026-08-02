// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { StatusFeed } from "@/components/status/status-feed";
import { TrendingUp, Hash } from "lucide-react";
import { subDays } from "date-fns";

export default function Trending() {
  const { data: tags = [] } = useQuery({
    queryKey: ["trending-tags"],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("user_statuses")
        .select("content")
        .gte("created_at", weekAgo)
        .not("content", "is", null);
      const counts: Record<string, number> = {};
      data?.forEach((s: any) => {
        const matches = (s.content ?? "").match(/#[a-zA-Z0-9_]+/g) ?? [];
        matches.forEach((t: string) => {
          counts[t.toLowerCase()] = (counts[t.toLowerCase()] ?? 0) + 1;
        });
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);
    },
  });

  return (
    <SocialLayout title="Trending" subtitle="Hot posts and hashtags this week">
      <div className="rounded-xl border border-border/50 bg-card p-4 mb-6">
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Trending hashtags
        </h2>
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add #hashtags to your posts to see them trend.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, count]: any) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {tag} <span className="text-muted-foreground">· {count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <h2 className="font-display font-bold flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        Top posts
      </h2>
      <StatusFeed mode="trending" />
    </SocialLayout>
  );
}
