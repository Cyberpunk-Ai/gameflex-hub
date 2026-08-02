// @ts-nocheck
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function Kpi({
  icon: Icon,
  label,
  value,
  delta,
  hint,
  tone = "primary",
  loading,
}: {
  icon?: any;
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  hint?: string;
  tone?: "primary" | "accent" | "chart-2" | "chart-4" | "chart-5";
  loading?: boolean;
}) {
  const toneMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    "chart-2": "text-chart-2 bg-chart-2/10",
    "chart-4": "text-chart-4 bg-chart-4/10",
    "chart-5": "text-chart-5 bg-chart-5/10",
  };
  const DeltaIcon = delta == null ? Minus : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <span className={cn("rounded-lg p-2", toneMap[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        {delta != null && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta > 0
                ? "bg-primary/10 text-primary"
                : delta < 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-2xl font-bold leading-tight">
        {loading ? <Skeleton className="h-7 w-24" /> : value}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border/50 bg-card p-5 lg:p-6", className)}
      aria-label={title}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold sm:text-base">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground" role="status">
      {label}
    </p>
  );
}

export function RankList({
  rows,
  format = (v: any) => String(v),
  max,
}: {
  rows: { name: string; value: number; meta?: string }[];
  format?: (v: number) => string;
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className="rounded-lg bg-secondary/40 p-2.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
              <span className="truncate">{r.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{format(r.value)}</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.min(100, (r.value / top) * 100)}%` }}
            />
          </div>
          {r.meta && <div className="mt-1 text-[11px] text-muted-foreground">{r.meta}</div>}
        </li>
      ))}
    </ul>
  );
}

export function HealthRow({
  label,
  value,
  status,
  detail,
}: {
  label: string;
  value: string;
  status: "good" | "warn" | "bad" | "idle";
  detail?: string;
}) {
  const dot = {
    good: "bg-primary",
    warn: "bg-chart-4",
    bad: "bg-destructive",
    idle: "bg-muted-foreground",
  }[status];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dot, status === "good" && "animate-pulse")} />
        <div className="min-w-0">
          <div className="truncate text-sm">{label}</div>
          {detail && <div className="text-[11px] text-muted-foreground">{detail}</div>}
        </div>
      </div>
      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}
