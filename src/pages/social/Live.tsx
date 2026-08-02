// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Radio, Users, DollarSign, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatExternalUrl } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtu\.be\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

export default function Live() {
  const { user } = useAuth();
  const [activeViewers, setActiveViewers] = useState<number>(1);

  const { data: live = [] } = useQuery({
    queryKey: ["live-tournaments-social"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "live")
        .limit(20);
      return data ?? [];
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["upcoming-tournaments-social"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "upcoming")
        .order("start_date", { ascending: true })
        .limit(8);
      return data ?? [];
    },
  });

  const featuredLive = live[0];

  // Track real-time presence for watching count
  useEffect(() => {
    if (!featuredLive?.id) return;

    const viewerKey = user?.id || `anon-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(`stream_watchers_${featuredLive.id}`, {
      config: {
        presence: { key: viewerKey },
      },
    });

    const updateCount = () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setActiveViewers(Math.max(count, 1));
    };

    channel
      .on("presence", { event: "sync" }, updateCount)
      .on("presence", { event: "join" }, updateCount)
      .on("presence", { event: "leave" }, updateCount)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [featuredLive?.id, user?.id]);

  return (
    <SocialLayout title="Live" subtitle="Tournaments streaming right now">
      {live.length === 0 ? (
        <div className="space-y-8">
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border/50 bg-card/30">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                <Radio className="h-10 w-10 text-muted-foreground/50" />
              </div>
            </div>
            <p className="font-semibold text-xl mb-2">No live streams right now</p>
            <p className="text-muted-foreground text-sm max-w-md">
              Check back later for live broadcasts and gaming action.
            </p>
          </div>

          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4 px-1">
                Starting Soon
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {upcoming.map((t: any) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.id}`}
                    className="group rounded-xl bg-card border border-border/50 hover:border-primary/50 p-4 transition-all hover:shadow-lg"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-secondary/50 flex items-center justify-center">
                      <Radio className="h-8 w-8 text-muted-foreground/30" />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                        Upcoming
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{t.game}</span>
                    </div>

                    <h4 className="font-display font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {t.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t.current_participants}/{t.max_participants}
                      </span>
                      <span>KES {Number(t.prize_pool ?? 0).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Featured Live Stream */}
          {featuredLive && (
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border/50">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  LIVE NOW
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {activeViewers} {activeViewers === 1 ? "watching" : "watching"}
                </span>
              </div>

              {(featuredLive.live_stream_link ?? featuredLive.group_link) &&
              extractYouTubeId(featuredLive.live_stream_link ?? featuredLive.group_link) ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(featuredLive.live_stream_link ?? featuredLive.group_link)}?autoplay=1&mute=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (featuredLive.live_stream_link ?? featuredLive.group_link) ? (
                <div className="aspect-video bg-black">
                  <video
                    src={featuredLive.live_stream_link ?? featuredLive.group_link}
                    controls
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-secondary via-secondary/50 to-secondary flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Radio className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="font-semibold text-lg mb-1">Stream Starting Soon</p>
                    <p className="text-sm text-muted-foreground">Waiting for broadcast...</p>
                  </div>
                </div>
              )}

              <div className="p-5">
                <Link to={`/tournaments/${featuredLive.id}`}>
                  <h3 className="font-display font-bold text-xl mb-2 hover:text-primary transition-colors">
                    {featuredLive.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-border/40">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {featuredLive.current_participants}/{featuredLive.max_participants} players
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      KES {Number(featuredLive.prize_pool ?? 0).toLocaleString()} prize
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase">
                      {featuredLive.game}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredLive.live_stream_link && (
                      <a
                        href={formatExternalUrl(featuredLive.live_stream_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-primary border-primary/40"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open Stream
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Live Tournaments */}
          {live.length > 1 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4 px-1">
                More Live
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {live.slice(1).map((t: any) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.id}`}
                    className="group rounded-xl bg-card border border-border/50 hover:border-border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    {(t.live_stream_link ?? t.group_link) &&
                    extractYouTubeId(t.live_stream_link ?? t.group_link) ? (
                      <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-black relative">
                        <img
                          src={`https://img.youtube.com/vi/${extractYouTubeId(t.live_stream_link ?? t.group_link)}/hqdefault.jpg`}
                          alt={t.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="h-11 w-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 text-black ml-0.5 fill-black" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-secondary/50 flex items-center justify-center">
                        <Radio className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{t.game}</span>
                    </div>

                    <h4 className="font-display font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {t.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t.current_participants ?? 0} watching
                      </span>
                      <span>KES {Number(t.prize_pool ?? 0).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SocialLayout>
  );
}
