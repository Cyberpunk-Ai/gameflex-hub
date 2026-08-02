import {
  Trophy,
  Medal,
  Crown,
  Gamepad2,
  Shield,
  User,
  Users,
  Star,
  DollarSign,
  Gem,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned?: boolean;
  earned_at?: string;
}

interface AchievementsDisplayProps {
  achievements: Achievement[];
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  "gamepad-2": Gamepad2,
  shield: Shield,
  user: User,
  users: Users,
  star: Star,
  "dollar-sign": DollarSign,
  gem: Gem,
};

const categoryColors: Record<string, string> = {
  competition: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
  participation: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  profile: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  social: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  earnings: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
};

export function AchievementsDisplay({ achievements, compact = false }: AchievementsDisplayProps) {
  if (compact) {
    const earned = achievements.filter((a) => a.earned);
    return (
      <div className="flex flex-wrap gap-2">
        {earned.slice(0, 5).map((achievement) => {
          const IconComponent = iconMap[achievement.icon] || Trophy;
          return (
            <div
              key={achievement.id}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center"
              title={achievement.name}
            >
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
          );
        })}
        {earned.length > 5 && (
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
            +{earned.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {achievements.map((achievement) => {
        const IconComponent = iconMap[achievement.icon] || Trophy;
        const colorClass = categoryColors[achievement.category] || categoryColors.competition;

        return (
          <div
            key={achievement.id}
            className={cn(
              "relative p-4 rounded-xl bg-gradient-to-br border transition-all",
              colorClass,
              achievement.earned ? "opacity-100 hover:scale-105" : "opacity-40 grayscale",
            )}
          >
            {!achievement.earned && (
              <div className="absolute top-2 right-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                  achievement.earned ? "bg-primary/20" : "bg-secondary",
                )}
              >
                <IconComponent
                  className={cn(
                    "h-6 w-6",
                    achievement.earned ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <h4 className="font-display text-sm font-semibold mb-1">{achievement.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                {achievement.points} pts
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
