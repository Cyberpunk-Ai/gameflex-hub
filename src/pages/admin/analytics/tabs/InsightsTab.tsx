// @ts-nocheck
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { Panel, Empty } from "../primitives";
import { kes } from "../format";

type Insight = {
  severity: "opportunity" | "risk" | "critical" | "healthy";
  title: string;
  body: string;
  action?: string;
};

function buildInsights({ kpis, retention, segments, leaders, telemetry, dataHealth }: any): Insight[] {
  const out: Insight[] = [];
  if (!kpis) return out;

  if (kpis.revenueDelta != null && kpis.revenueDelta <= -15) {
    out.push({
      severity: "critical",
      title: `Revenue is down ${Math.abs(kpis.revenueDelta)}% period-over-period`,
      body: `Verified revenue landed at ${kes(kpis.revenue)} versus the prior comparable window. Paying conversion is ${kpis.conversionRate}% and ARPPU is ${kes(kpis.arppu)}.`,
      action: "Audit the payment verification queue and re-target lapsed payers with an entry-fee incentive.",
    });
  } else if (kpis.revenueDelta >= 15) {
    out.push({
      severity: "opportunity",
      title: `Revenue growing ${kpis.revenueDelta}%`,
      body: `Momentum is positive at ${kes(kpis.revenue)} in period, ARPU ${kes(kpis.arpu)}. Top games are absorbing most of the spend.`,
      action: "Increase slot capacity on the top-performing tournaments while demand is elastic.",
    });
  }

  if (retention && retention.stickiness < 20 && retention.mau > 0) {
    out.push({
      severity: "risk",
      title: `Low stickiness at ${retention.stickiness}% DAU/MAU`,
      body: `Monthly players (${retention.mau}) are not returning daily (${retention.dau}). Healthy competitive platforms sit above 20%.`,
      action: "Schedule daily low-stake ladders and push notifications tied to peak activity hours.",
    });
  }

  if (kpis.conversionRate < 5 && kpis.activeUsers > 0) {
    out.push({
      severity: "risk",
      title: `Only ${kpis.conversionRate}% of active players pay`,
      body: `${kpis.payers} of ${kpis.activeUsers} active players converted. The free-to-paid step is the tightest part of the funnel.`,
      action: "Introduce a first-entry discount and surface prize pools earlier in the join flow.",
    });
  }

  const verifyRate = leaders?.totalCount ? (leaders.verifiedCount / leaders.totalCount) * 100 : 100;
  if (leaders?.totalCount > 0 && verifyRate < 80) {
    out.push({
      severity: "critical",
      title: `${Math.round(100 - verifyRate)}% of payments are unverified`,
      body: `${leaders.totalCount - leaders.verifiedCount} payments are stuck outside the verified state, which suppresses reported revenue.`,
      action: "Prioritise the manual verification backlog in Admin → Payments.",
    });
  }

  if (segments?.games?.length > 1) {
    const [first, second] = segments.games;
    const share = Math.round((first.value / segments.games.reduce((s: number, g: any) => s + g.value, 0)) * 100);
    out.push({
      severity: share > 60 ? "risk" : "opportunity",
      title: `${first.name} drives ${share}% of joins`,
      body: `Runner-up ${second.name} has ${second.value} joins. ${share > 60 ? "Concentration this high makes revenue fragile to a single title's popularity." : "Portfolio spread looks balanced across titles."}`,
      action: share > 60 ? "Seed prize pools in the #2 and #3 titles to diversify demand." : undefined,
    });
  }

  if (telemetry?.vitals?.lcp != null && telemetry.vitals.lcp > 2500) {
    out.push({
      severity: "risk",
      title: `LCP of ${telemetry.vitals.lcp} ms exceeds the 2.5s target`,
      body: `Page weight is ${telemetry.totalKb} KB across ${telemetry.resources.reduce((s: number, r: any) => s + r.count, 0)} requests on a ${telemetry.network.effectiveType} connection.`,
      action: "Defer non-critical chart bundles and serve hero imagery in AVIF/WebP at responsive sizes.",
    });
  }

  if (telemetry?.memory?.pct != null && telemetry.memory.pct > 80) {
    out.push({
      severity: "critical",
      title: `JS heap at ${telemetry.memory.pct}% of the browser limit`,
      body: `${telemetry.memory.usedMb} MB of ${telemetry.memory.limitMb} MB is in use, with ${telemetry.longTasks.count} long tasks blocking the main thread.`,
      action: "Virtualise long lists and drop retained query caches on route change.",
    });
  }

  const failing = (dataHealth ?? []).filter((h: any) => !h.ok);
  if (failing.length) {
    out.push({
      severity: "critical",
      title: `${failing.length} data source${failing.length > 1 ? "s" : ""} unreachable`,
      body: failing.map((f: any) => `${f.table}: ${f.error}`).join(" · "),
      action: "Verify table provisioning and row-level security policies for these tables.",
    });
  }

  const slow = (dataHealth ?? []).filter((h: any) => h.ok && h.latency > 500);
  if (slow.length) {
    out.push({
      severity: "risk",
      title: `${slow.length} slow query path${slow.length > 1 ? "s" : ""} detected`,
      body: slow.map((s: any) => `${s.table} at ${s.latency} ms`).join(" · "),
      action: "Add covering indexes on created_at and status columns used by these dashboards.",
    });
  }

  if (!out.length) {
    out.push({
      severity: "healthy",
      title: "All monitored signals are within target",
      body: `Revenue, retention, conversion, web vitals and data-layer latency are all inside their thresholds for the selected window.`,
    });
  }
  return out;
}

const style = {
  opportunity: { icon: TrendingUp, cls: "border-primary/40 bg-primary/5", tone: "text-primary", label: "Opportunity" },
  risk: { icon: TrendingDown, cls: "border-chart-4/40 bg-chart-4/5", tone: "text-chart-4", label: "Risk" },
  critical: { icon: AlertTriangle, cls: "border-destructive/40 bg-destructive/5", tone: "text-destructive", label: "Critical" },
  healthy: { icon: CheckCircle2, cls: "border-primary/40 bg-primary/5", tone: "text-primary", label: "Healthy" },
};

export function InsightsTab(props: any) {
  const insights = buildInsights(props);
  const counts = insights.reduce((acc: any, i) => ({ ...acc, [i.severity]: (acc[i.severity] ?? 0) + 1 }), {});

  return (
    <div className="space-y-6">
      <Panel
        title="AI-assisted insight engine"
        subtitle="Signals correlated across revenue, retention, performance and infrastructure"
        icon={Sparkles}
        action={
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
            {insights.length} findings
          </span>
        }
      >
        {insights.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {insights.map((i, idx) => {
              const s = style[i.severity];
              const Icon = s.icon;
              return (
                <article key={idx} className={`rounded-xl border p-4 ${s.cls}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${s.tone}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${s.tone}`}>{s.label}</span>
                  </div>
                  <h3 className="mt-2 font-display text-sm font-bold">{i.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
                  {i.action && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-background/60 p-2.5 text-xs">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-4" />
                      <span>{i.action}</span>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <Empty label="Not enough data to generate insights yet" />
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {(["critical", "risk", "opportunity", "healthy"] as const).map((k) => {
          const s = style[k];
          const Icon = s.icon;
          return (
            <div key={k} className={`rounded-xl border p-4 ${s.cls}`}>
              <Icon className={`h-4 w-4 ${s.tone}`} />
              <div className="mt-2 font-display text-2xl font-bold">{counts[k] ?? 0}</div>
              <div className="text-xs text-muted-foreground">{s.label} signals</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
