// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGamerAvatar } from "@/constants/avatars";
import { Search as SearchIcon, Trophy, Hash } from "lucide-react";
import { track } from "@/lib/analytics";

export default function Search() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(timer);
  }, [q]);

  const { data: results } = useQuery({
    queryKey: ["search", debouncedQ],
    enabled: debouncedQ.trim().length > 1,
    queryFn: async () => {
      void track("search", { query: q });
      const [{ data: players }, { data: tournaments }, { data: posts }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .ilike("username", `%${q}%`)
          .limit(10),
        supabase.from("tournaments").select("id, title, game").ilike("title", `%${q}%`).limit(10),
        supabase
          .from("user_statuses")
          .select("id, content, user_id")
          .ilike("content", `%${q}%`)
          .limit(10),
      ]);
      return { players: players ?? [], tournaments: tournaments ?? [], posts: posts ?? [] };
    },
  });

  return (
    <SocialLayout title="Search" subtitle="Find players, tournaments, and posts">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search players, tournaments, hashtags..."
          className="pl-10"
        />
      </div>

      {q.trim().length < 2 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Type at least 2 characters to search.
        </p>
      )}

      {results && (
        <div className="space-y-6">
          <Section title="Players" icon={<SearchIcon className="h-4 w-4" />}>
            {results.players.length === 0 ? (
              <Empty />
            ) : (
              results.players.map((p: any) => (
                <Link
                  key={p.user_id}
                  to={`/player/${p.user_id}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-secondary"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url || getGamerAvatar(p.username)} />
                    <AvatarFallback>{p.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{p.username}</span>
                </Link>
              ))
            )}
          </Section>
          <Section title="Tournaments" icon={<Trophy className="h-4 w-4" />}>
            {results.tournaments.length === 0 ? (
              <Empty />
            ) : (
              results.tournaments.map((t: any) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary"
                >
                  <span className="text-sm">{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.game}</span>
                </Link>
              ))
            )}
          </Section>
          <Section title="Posts" icon={<Hash className="h-4 w-4" />}>
            {results.posts.length === 0 ? (
              <Empty />
            ) : (
              results.posts.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/post/${p.id}`}
                  className="block p-2 rounded hover:bg-secondary text-sm line-clamp-2"
                >
                  {p.content}
                </Link>
              ))
            )}
          </Section>
        </div>
      )}
    </SocialLayout>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Empty() {
  return <p className="text-xs text-muted-foreground p-2">No matches</p>;
}
