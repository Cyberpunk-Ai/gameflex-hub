import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
    " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border border-destructive-border",
        outline:
          "border border-white/20 bg-transparent text-foreground hover:bg-white/10 shadow-xs active:shadow-none",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border",
        ghost: "border border-transparent hover:bg-secondary/60",
        link: "text-primary underline-offset-4 hover:underline",
        // GameFlex gaming button — exact gradient from design
        gaming:
          "bg-gradient-to-r from-[#22ff88] to-[#22c55e] text-black font-bold border-0 shadow-[0_0_20px_rgba(34,255,136,0.45)] hover:shadow-[0_0_28px_rgba(34,255,136,0.6)] hover:from-[#00ff7f] hover:to-[#22c55e] active:scale-[0.98] no-default-hover-elevate no-default-active-elevate",
        // Neon outline variant for "Join Now" / secondary CTAs
        neon: "border border-primary/60 bg-primary/10 text-primary font-semibold hover:bg-primary/20 hover:border-primary shadow-[0_0_12px_rgba(34,197,94,0.2)] hover:shadow-neon active:scale-[0.98] no-default-hover-elevate no-default-active-elevate",
        // Success / warning / danger aliases
        success: "bg-green-600 text-white hover:bg-green-700 border border-green-700",
        warning: "bg-yellow-500 text-black hover:bg-yellow-600 border border-yellow-600",
        danger: "bg-red-600 text-white hover:bg-red-700 border border-red-700",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        xl: "min-h-12 rounded-lg px-8 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
