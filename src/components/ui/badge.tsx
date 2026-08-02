import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
    " hover-elevate ",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: "text-foreground border [border-color:var(--badge-outline)]",
        // GameFlex-specific variants
        live: "border-transparent bg-red-900/60 text-red-400 border border-red-500/30",
        success: "border-transparent bg-green-900/60 text-green-400 border border-green-500/30",
        warning: "border-transparent bg-yellow-900/60 text-yellow-400 border border-yellow-500/30",
        info: "border-transparent bg-blue-900/60 text-blue-400 border border-blue-500/30",
        premium: "border-transparent bg-purple-900/60 text-purple-400 border border-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
