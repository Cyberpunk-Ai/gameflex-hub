// @ts-nocheck
import { Link, Outlet, useLocation } from "@/lib/router-compat";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CreditCard,
  ClipboardList,
  Swords,
  Gamepad2,
  Store,
  Shield,
  Award,
  Gift,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Database,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Referrals", href: "/admin/referrals", icon: UserPlus },
  { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
  { name: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { name: "Matches", href: "/admin/matches", icon: Swords },
  { name: "Game Rooms", href: "/admin/game-rooms", icon: Gamepad2 },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Rewards", href: "/admin/rewards", icon: Gift },
  { name: "Leaderboard", href: "/admin/leaderboard", icon: TrendingUp },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Achievements", href: "/admin/achievements", icon: Award },
  { name: "Marketplace", href: "/admin/marketplace", icon: Store },
  { name: "Support", href: "/admin/support", icon: MessageSquare },
  { name: "Roles", href: "/admin/roles", icon: Shield },
  { name: "Backup", href: "/admin/backup", icon: Database },
];

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
        <Link to="/" className="text-primary hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border/50 p-4 hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <div className="font-display text-lg font-bold mb-8 px-4">Admin Panel</div>
        <nav className="space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 p-2 z-50 overflow-x-auto shadow-lg">
        <div className="flex gap-1 min-w-max px-2">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg text-xs whitespace-nowrap min-w-[64px]",
                location.pathname === item.href
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
