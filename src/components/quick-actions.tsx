import { Link } from "@/lib/router-compat";
import { Trophy, Wallet, Gamepad2, Users, Gift, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color: string;
  description?: string;
}

const actions: QuickAction[] = [
  {
    icon: Trophy,
    label: "Tournaments",
    href: "/tournaments",
    color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-500/50",
    description: "Join competitions",
  },
  {
    icon: Wallet,
    label: "Wallet",
    href: "/wallet",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50",
    description: "Manage funds",
  },
  {
    icon: Gamepad2,
    label: "My Matches",
    href: "/my-matches",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50",
    description: "View schedule",
  },
  {
    icon: Gift,
    label: "Rewards",
    href: "/rewards",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50",
    description: "Claim prizes",
  },
  {
    icon: Users,
    label: "Leaderboard",
    href: "/leaderboard",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/50",
    description: "Rankings",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    color: "from-gray-500/20 to-slate-500/20 border-gray-500/30 hover:border-gray-500/50",
    description: "Account",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br border transition-all hover:scale-105",
            action.color,
          )}
        >
          <action.icon className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">{action.label}</span>
          <span className="text-xs text-muted-foreground hidden md:block">
            {action.description}
          </span>
        </Link>
      ))}
    </div>
  );
}
