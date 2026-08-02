// @ts-nocheck
import {
  Activity,
  Users,
  Trophy,
  DollarSign,
  TrendingUp,
  Target,
  Repeat,
  Swords,
  Clock,
  Globe,
} from "lucide-react";
import { StatsChart } from "@/components/stats-chart";
import { Kpi, Panel, Empty, RankList } from "../primitives";
import { kes } from "../format";

export function OverviewTab({ kpis, trends, retention, segments, hourly, loading }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Kpi
          icon={Activity}
          tone="primary"
          label="Users online"
          hint="Active in last 30 min"
          value={kpis?.usersOnline ?? 0}
          loading={loading}
        />
        <Kpi
          icon={DollarSign}
          tone="primary"
          label="Revenue in period"
          value={kes(kpis?.revenue ?? 0)}
          delta={kpis?.revenueDelta}
          hint={`Today: ${kes(kpis?.revenueToday ?? 0)}`}
          loading={loading}
        />
        <Kpi
          icon={Users}
          tone="chart-2"
          label="New users"
          value={(kpis?.newUsers ?? 0).toLocaleString()}
          delta={kpis?.newUsersDelta}
          loading={loading}
        />
        <Kpi
          icon={Target}
          tone="accent"
          label="Active players"
          value={(kpis?.activeUsers ?? 0).toLocaleString()}
          delta={kpis?.activeDelta}
          hint={`${kpis?.engagementRate ?? 0}% of base engaged`}
          loading={loading}
        />
        <Kpi
          icon={Trophy}
          tone="chart-4"
          label="Live tournaments"
          value={kpis?.liveTournaments ?? 0}
          loading={loading}
        />
        <Kpi
          icon={Swords}
          tone="chart-5"
          label="Matches played"
          value={(kpis?.matches ?? 0).toLocaleString()}
          loading={loading}
        />
        <Kpi
          icon={Repeat}
          tone="chart-2"
          label="Stickiness (DAU/MAU)"
          value={`${retention?.stickiness ?? 0}%`}
          hint={`WAU/MAU ${retention?.weeklyRetention ?? 0}%`}
          loading={loading}
        />
        <Kpi
          icon={TrendingUp}
          tone="primary"
          label="Paying conversion"
          value={`${kpis?.conversionRate ?? 0}%`}
          hint={`ARPU ${kes(Math.round(kpis?.arpu ?? 0))}`}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Revenue trend"
          subtitle="Verified payments per day"
          icon={TrendingUp}
        >
          <StatsChart data={trends?.revenue ?? []} type="area" height={260} />
        </Panel>
        <Panel title="Growth funnel" subtitle="Signups vs tournament joins" icon={Users}>
          <StatsChart
            data={trends?.growth ?? []}
            type="area"
            height={260}
            primaryColor="hsl(200, 100%, 50%)"
            secondaryColor="hsl(280, 100%, 60%)"
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Peak activity by hour" subtitle="Last 30 days, local time" icon={Clock}>
          {hourly?.length ? (
            <StatsChart data={hourly} type="bar" height={200} primaryColor="hsl(25, 100%, 55%)" />
          ) : (
            <Empty label="No activity recorded yet" />
          )}
        </Panel>
        <Panel title="Top games" subtitle="By joins in period" icon={Trophy}>
          {segments?.games?.length ? <RankList rows={segments.games} /> : <Empty label="No joins yet" />}
        </Panel>
        <Panel title="Top regions" subtitle="New signups by country" icon={Globe}>
          {segments?.countries?.length ? (
            <RankList rows={segments.countries} />
          ) : (
            <Empty label="Country data appears as signups roll in" />
          )}
        </Panel>
        <Panel title="Acquisition channels" subtitle="Self-reported referral source" icon={TrendingUp}>
          {segments?.acquisition?.length ? (
            <RankList rows={segments.acquisition} />
          ) : (
            <Empty label="No attribution data yet" />
          )}
        </Panel>
      </div>
    </div>
  );
}
