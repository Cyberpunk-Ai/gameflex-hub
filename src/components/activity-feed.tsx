import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trophy, DollarSign, Users, Gamepad2, Star, Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string | null;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  tournament_win: Trophy,
  payment_verified: DollarSign,
  new_registration: Users,
  match_completed: Gamepad2,
  achievement_earned: Star,
  system: Bell,
};

const activityColors: Record<string, string> = {
  tournament_win: "text-yellow-500 bg-yellow-500/10",
  payment_verified: "text-green-500 bg-green-500/10",
  new_registration: "text-blue-500 bg-blue-500/10",
  match_completed: "text-purple-500 bg-purple-500/10",
  achievement_earned: "text-orange-500 bg-orange-500/10",
  system: "text-primary bg-primary/10",
};

export function ActivityFeed() {
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["public-activity-feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as Activity[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("activity-feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed" }, () => {
        queryClient.invalidateQueries({ queryKey: ["public-activity-feed"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-pulse"
          >
            <div className="h-10 w-10 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[360px] md:max-h-[420px] lg:max-h-[520px] overflow-y-auto scrollbar-hide pr-1">
      {activities.map((activity) => {
        const IconComponent = activityIcons[activity.activity_type] || Bell;
        const colorClass = activityColors[activity.activity_type] || activityColors.system;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in min-h-0"
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
