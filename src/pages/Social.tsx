import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, TrendingUp, Gamepad2 } from "lucide-react";
import { StatusFeed } from "@/components/status/status-feed";
import { SocialLayout } from "@/components/social/social-nav";
import { StoriesRail } from "@/components/social/stories-rail";
import { SuggestionsRail } from "@/components/social/suggestions-rail";
import { SquadSuggestions } from "@/components/social/squad-suggestions";
import { CreateStatus } from "@/components/status/create-status";
import { cn } from "@/lib/utils";

const feedTabs = [
  { id: "foryou", name: "For You", icon: Sparkles },
  { id: "trending", name: "Trending", icon: TrendingUp },
  { id: "following", name: "Following", icon: Users },
] as const;

type FeedTabId = (typeof feedTabs)[number]["id"];

export default function Social() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTabId>("foryou");

  return (
    <SocialLayout rightRail={<SuggestionsRail />}>
      <div className="max-w-[470px] mx-auto w-full">
        {/* Stories rail */}
        <StoriesRail />

        {/* Sign-in prompt for guests */}
        {!user && (
          <div className="relative mx-4 md:mx-0 mb-6 rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center shadow-[0_0_30px_rgba(34,197,94,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.08),transparent_70%)] pointer-events-none" />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                <Gamepad2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold mb-1 tracking-tight">
                Join the community
              </h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-[260px] mx-auto leading-relaxed">
                Post clips, follow top players, and show off your wins.
              </p>
              <Button asChild variant="gaming" className="rounded-full px-6 font-bold">
                <Link to="/auth">Sign In to GameFlex</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Create post */}
        {user && <CreateStatus />}

        {/* Mobile / Tablet Suggestions Carousel (Instagram style) */}
        <div className="lg:hidden my-4 px-1">
          <SquadSuggestions limit={3} title="Suggested Gamers for You" className="rounded-xl border border-border/50 bg-card/60" />
        </div>

        {/* Feed tabs — sticky below header */}
        <div className="sticky top-[56px] md:top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center">
            {feedTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-semibold transition-colors",
                  tab === t.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                <t.icon className={cn("h-4 w-4 shrink-0", tab === t.id ? "text-primary" : "")} />
                <span className="hidden sm:inline">{t.name}</span>
                {/* Active indicator bar */}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full bg-primary shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="pb-20 md:pb-8">
          <StatusFeed key={tab} mode={tab} />
        </div>
      </div>
    </SocialLayout>
  );
}
