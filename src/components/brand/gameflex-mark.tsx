import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-9 w-9 rounded-lg", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 rounded-xl", icon: "h-6 w-6" },
  lg: { box: "h-16 w-16 rounded-2xl", icon: "h-8 w-8" },
} as const;

/**
 * The single GameFlex brand mark — a trophy in the neon-primary badge used in
 * the header. Every auth / profile surface should use this instead of ad-hoc
 * gamepad or shield icons so the identity stays consistent.
 */
export function GameFlexMark({
  size = "md",
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const s = sizeMap[size];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-primary shadow-lg shadow-primary/30",
        s.box,
        className,
      )}
    >
      <Trophy className={cn("text-primary-foreground", s.icon)} />
    </div>
  );
}
