import { useEffect, useMemo, useState } from "react";
import { Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  startDate?: string | null;
  status?: string | null;
  className?: string;
};

function breakdown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const Unit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center rounded-lg bg-background/60 border border-primary/20 px-3 py-2 min-w-[3.5rem]">
    <span className="font-display text-xl font-bold text-primary tabular-nums leading-none">
      {String(value).padStart(2, "0")}
    </span>
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
  </div>
);

export function StartCountdown({ startDate, status, className }: Props) {
  const target = useMemo(() => (startDate ? new Date(startDate).getTime() : Number.NaN), [startDate]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (Number.isNaN(target)) return null;

  const msLeft = target - now;
  const started = msLeft <= 0;
  const isLive = status === "live";
  const finished = status === "completed" || status === "cancelled";

  if (finished) return null;

  const { days, hours, minutes, seconds } = breakdown(msLeft);

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/25 bg-card/60 backdrop-blur px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {started || isLive ? (
          <Play className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-primary" />
        )}
        {started || isLive ? "Tournament underway" : "Starts in"}
      </div>
      {started || isLive ? (
        <p className="font-display text-lg font-bold text-primary">
          {isLive ? "Live now" : "Kick-off time reached"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {days > 0 && <Unit value={days} label="days" />}
          <Unit value={hours} label="hrs" />
          <Unit value={minutes} label="min" />
          <Unit value={seconds} label="sec" />
        </div>
      )}
    </div>
  );
}

export default StartCountdown;
