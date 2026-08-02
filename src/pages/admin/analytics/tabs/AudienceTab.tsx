// @ts-nocheck
import { Users, UserPlus, Repeat, Target, Gauge } from "lucide-react";
import { StatsChart } from "@/components/stats-chart";
import { Kpi, Panel, Empty, RankList, HealthRow } from "../primitives";
import { num } from "../format";

export function AudienceTab({ kpis, retention, trends, segments, hourly }: any) {
  const funnel = [
    { label: "Registered users", value: kpis?.totalUsers ?? 0 },
    { label: "Active in period", value: kpis?.activeUsers ?? 0 },
    { label: "Paying users", value: kpis?.payers ?? 0 },
  ];
  const top = Math.max(1, funnel[0].value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={Users} label="DAU" value={num(retention?.dau ?? 0)} tone="primary" />
        <Kpi icon={Users} label="WAU" value={num(retention?.wau ?? 0)} tone="chart-2" />
        <Kpi icon={Users} label="MAU" value={num(retention?.mau ?? 0)} tone="accent" />
        <Kpi
          icon={Repeat}
          label="Weekly retention"
          value={`${retention?.weeklyRetention ?? 0}%`}
          tone="chart-4"
          hint="WAU as share of MAU"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Signups vs engagement" subtitle="Daily cohort inflow" icon={UserPlus}>
          <StatsChart
            data={trends?.growth ?? []}
            type="area"
            height={260}
            primaryColor="hsl(200, 100%, 50%)"
            secondaryColor="hsl(142, 76%, 45%)"
          />
        </Panel>
        <Panel title="Lifecycle funnel" subtitle="Registered → active → paying" icon={Target}>
          <div className="space-y-4">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-semibold tabular-nums">{num(f.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (f.value / top) * 100)}%`, opacity: 1 - i * 0.25 }}
                  />
                </div>
                {i > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {funnel[i - 1].value > 0 ? Math.round((f.value / funnel[i - 1].value) * 100) : 0}% step
                    conversion
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Behaviour by hour" subtitle="When players show up" icon={Gauge}>
          {hourly?.length ? (
            <StatsChart data={hourly} type="bar" height={220} primaryColor="hsl(280, 100%, 60%)" />
          ) : (
            <Empty label="No activity recorded yet" />
          )}
        </Panel>
        <Panel title="Game preference" subtitle="Where attention goes" icon={Target}>
          {segments?.games?.length ? <RankList rows={segments.games} /> : <Empty label="No joins yet" />}
        </Panel>
        <Panel title="Engagement quality" subtitle="Derived behaviour ratios" icon={Repeat}>
          <div>
            <HealthRow
              label="Engagement rate"
              detail="Active players / total users"
              value={`${kpis?.engagementRate ?? 0}%`}
              status={(kpis?.engagementRate ?? 0) > 20 ? "good" : "warn"}
            />
            <HealthRow
              label="Stickiness"
              detail="DAU / MAU"
              value={`${retention?.stickiness ?? 0}%`}
              status={(retention?.stickiness ?? 0) > 20 ? "good" : "warn"}
            />
            <HealthRow
              label="Paying conversion"
              detail="Payers / active players"
              value={`${kpis?.conversionRate ?? 0}%`}
              status={(kpis?.conversionRate ?? 0) > 5 ? "good" : "warn"}
            />
            <HealthRow
              label="Repeat participation"
              detail="Joins per active player"
              value={
                kpis?.activeUsers
                  ? ((trends?.joins ?? []).reduce((s: number, d: any) => s + d.value, 0) / kpis.activeUsers).toFixed(
                      1,
                    )
                  : "—"
              }
              status="idle"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
