// @ts-nocheck
import { DollarSign, Trophy, CreditCard, Users, TrendingUp, Wallet } from "lucide-react";
import { StatsChart } from "@/components/stats-chart";
import { Kpi, Panel, Empty, RankList } from "../primitives";
import { kes } from "../format";

export function BusinessTab({ kpis, leaders, trends }: any) {
  const verifyRate =
    leaders?.totalCount > 0 ? Math.round((leaders.verifiedCount / leaders.totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Revenue in period"
          value={kes(kpis?.revenue ?? 0)}
          delta={kpis?.revenueDelta}
          tone="primary"
        />
        <Kpi icon={Wallet} label="ARPU" value={kes(kpis?.arpu ?? 0)} tone="chart-2" hint="Per registered user" />
        <Kpi icon={Users} label="ARPPU" value={kes(kpis?.arppu ?? 0)} tone="accent" hint="Per paying user" />
        <Kpi
          icon={CreditCard}
          label="Payment verify rate"
          value={`${verifyRate}%`}
          tone="chart-4"
          hint={`${leaders?.verifiedCount ?? 0} of ${leaders?.totalCount ?? 0} payments`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Revenue by day" subtitle="Verified payments" icon={TrendingUp}>
          <StatsChart data={trends?.revenue ?? []} type="area" height={260} />
        </Panel>
        <Panel title="Payment pipeline" subtitle="Payments by status" icon={CreditCard}>
          {leaders?.paymentStatus?.length ? (
            <StatsChart
              data={leaders.paymentStatus}
              type="bar"
              height={260}
              primaryColor="hsl(142, 76%, 45%)"
            />
          ) : (
            <Empty label="No payments recorded yet" />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top revenue tournaments" subtitle="Entry fee × participants" icon={Trophy}>
          {leaders?.tournaments?.length ? (
            <RankList
              rows={leaders.tournaments.map((t: any) => ({
                name: t.title,
                value: t.revenue,
                meta: `${t.game ?? "—"} · ${t.current_participants ?? 0} players · prize ${kes(t.prize_pool ?? 0)}`,
              }))}
              format={kes}
            />
          ) : (
            <Empty label="No tournaments yet" />
          )}
        </Panel>
        <Panel title="Top spenders" subtitle="Lifetime verified spend" icon={DollarSign}>
          {leaders?.spenders?.length ? (
            <RankList rows={leaders.spenders} format={kes} />
          ) : (
            <Empty label="No verified payments yet" />
          )}
        </Panel>
      </div>
    </div>
  );
}
