// @ts-nocheck
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Trophy,
  CreditCard,
  Gamepad2,
  Info,
  MessageSquare,
  CheckCheck,
  Heart,
  UserPlus,
  Star,
  Zap,
  Shield,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { SocialLayout } from "@/components/social/social-nav";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";

// ─── icon + colour map ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: any; bg: string; text: string }> = {
  tournament: { icon: Trophy, bg: "bg-primary/15", text: "text-primary" },
  payment: { icon: CreditCard, bg: "bg-emerald-500/15", text: "text-emerald-400" },
  match: { icon: Gamepad2, bg: "bg-blue-500/15", text: "text-blue-400" },
  system: { icon: Info, bg: "bg-amber-500/15", text: "text-amber-400" },
  whatsapp: { icon: MessageSquare, bg: "bg-emerald-500/15", text: "text-emerald-400" },
  like: { icon: Heart, bg: "bg-rose-500/15", text: "text-rose-400" },
  follow: { icon: UserPlus, bg: "bg-violet-500/15", text: "text-violet-400" },
  achievement: { icon: Star, bg: "bg-amber-500/15", text: "text-amber-400" },
  reward: { icon: Zap, bg: "bg-primary/15", text: "text-primary" },
  admin: { icon: Shield, bg: "bg-red-500/15", text: "text-red-400" },
  alert: { icon: AlertCircle, bg: "bg-orange-500/15", text: "text-orange-400" },
  comment: { icon: MessageSquare, bg: "bg-sky-500/15", text: "text-sky-400" },
};

function typeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Bell, bg: "bg-muted", text: "text-muted-foreground" };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d");
}

function groupByDay(items: any[]) {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const label = dayLabel(item.created_at);
    const arr = map.get(label) ?? [];
    arr.push(item);
    map.set(label, arr);
  }
  return map;
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-3 w-10 rounded mt-1" />
    </div>
  );
}

// ─── single notification row ─────────────────────────────────────────────────

function NotifRow({ notif, onRead }: { notif: any; onRead: (id: string) => void }) {
  const { icon: Icon, bg, text } = typeConfig(notif.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3.5 cursor-default transition-colors",
        !notif.is_read && "bg-primary/[0.04] hover:bg-primary/[0.07]",
        notif.is_read && "hover:bg-secondary/30",
      )}
    >
      {/* unread dot */}
      {!notif.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
      )}

      {/* icon badge */}
      <div className={cn("h-11 w-11 rounded-full shrink-0 flex items-center justify-center", bg)}>
        <Icon className={cn("h-5 w-5", text)} />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13.5px] leading-snug",
            !notif.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/90",
          )}
        >
          {notif.title}
        </p>
        {notif.message && (
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notif.message}
          </p>
        )}
      </div>

      {/* time */}
      <span className="text-[11px] text-muted-foreground shrink-0 pt-0.5">
        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: false })
          .replace("about ", "")
          .replace("less than a minute", "now")
          .replace(" hours", "h")
          .replace(" hour", "h")
          .replace(" minutes", "m")
          .replace(" minute", "m")
          .replace(" days", "d")
          .replace(" day", "d")}
      </span>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
    enabled: !!user,
  });

  // real-time subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n: any) => !n.is_read).length;
  const grouped = groupByDay(notifications);

  const guestCta = (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
        <Bell className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg">Sign in to see notifications</p>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          Likes, follows, rewards and more — all in one place.
        </p>
        <Button asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <SocialLayout
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread` : "All caught up!"}
      headerRight={
        user && unread > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        ) : null
      }
    >
      <div className="pb-8">
        {!user ? (
          guestCta
        ) : isLoading ? (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotifSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card/40 border border-dashed border-border/50 rounded-2xl">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity on your posts and tournaments will show up here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([label, items]) => (
              <div key={label}>
                {/* day label */}
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
                  {label}
                </p>
                <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/20">
                  {items.map((n: any) => (
                    <NotifRow key={n.id} notif={n} onRead={(id) => markOne.mutate(id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SocialLayout>
  );
}
