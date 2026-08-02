// @ts-nocheck
import { Gauge, Zap, Cpu, HardDrive, Server, Database, AlertTriangle } from "lucide-react";
import { StatsChart } from "@/components/stats-chart";
import { Kpi, Panel, Empty, HealthRow } from "../primitives";
import { ms } from "../format";

function vitalStatus(metric: string, v: number | null) {
  if (v == null) return "idle";
  const t: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    inp: [200, 500],
    ttfb: [800, 1800],
    cls: [0.1, 0.25],
  };
  const [good, poor] = t[metric] ?? [0, 0];
  return v <= good ? "good" : v <= poor ? "warn" : "bad";
}

export function PerformanceTab({ telemetry, dataHealth }: any) {
  const v = telemetry.vitals;
  const waterfall = [
    { name: "DNS", value: telemetry.nav.dns },
    { name: "TCP", value: telemetry.nav.tcp },
    { name: "TLS", value: telemetry.nav.tls },
    { name: "TTFB", value: telemetry.nav.ttfb },
    { name: "Download", value: telemetry.nav.download },
    { name: "DOM", value: telemetry.nav.domReady },
    { name: "Load", value: telemetry.nav.load },
  ];
  const health = dataHealth ?? [];
  const avgLatency = health.length
    ? Math.round(health.reduce((s: number, h: any) => s + h.latency, 0) / health.length)
    : null;
  const errors = health.filter((h: any) => !h.ok);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi icon={Zap} label="LCP" value={ms(v.lcp)} tone="primary" hint="Largest contentful paint" />
        <Kpi icon={Gauge} label="INP" value={ms(v.inp)} tone="chart-2" hint="Interaction latency" />
        <Kpi
          icon={Gauge}
          label="CLS"
          value={v.cls == null ? "—" : v.cls.toFixed(3)}
          tone="accent"
          hint="Layout stability"
        />
        <Kpi icon={Zap} label="TTFB" value={ms(v.ttfb)} tone="chart-4" hint="Server response" />
        <Kpi
          icon={HardDrive}
          label="Page weight"
          value={`${telemetry.totalKb} KB`}
          tone="chart-5"
          hint={`${telemetry.resources.reduce((s: number, r: any) => s + r.count, 0)} requests`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Request waterfall"
          subtitle="Navigation timing for the current session (ms)"
          icon={Zap}
        >
          <StatsChart data={waterfall} type="bar" height={240} primaryColor="hsl(200, 100%, 50%)" />
        </Panel>
        <Panel title="Core Web Vitals scorecard" subtitle="Against Google thresholds" icon={Gauge}>
          <div>
            <HealthRow label="LCP" value={ms(v.lcp)} status={vitalStatus("lcp", v.lcp)} detail="Target ≤ 2.5s" />
            <HealthRow label="FCP" value={ms(v.fcp)} status={vitalStatus("fcp", v.fcp)} detail="Target ≤ 1.8s" />
            <HealthRow label="INP" value={ms(v.inp)} status={vitalStatus("inp", v.inp)} detail="Target ≤ 200ms" />
            <HealthRow label="TTFB" value={ms(v.ttfb)} status={vitalStatus("ttfb", v.ttfb)} detail="Target ≤ 800ms" />
            <HealthRow
              label="CLS"
              value={v.cls == null ? "—" : v.cls.toFixed(3)}
              status={vitalStatus("cls", v.cls)}
              detail="Target ≤ 0.1"
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Asset weight by type" subtitle="Transferred bytes this session" icon={HardDrive}>
          {telemetry.resources.length ? (
            <StatsChart
              data={telemetry.resources.map((r: any) => ({ name: r.type, value: r.kb }))}
              type="bar"
              height={220}
              primaryColor="hsl(330, 100%, 60%)"
            />
          ) : (
            <Empty label="Collecting resource timings…" />
          )}
        </Panel>

        <Panel title="Runtime & memory" subtitle="JS heap and main-thread blocking" icon={Cpu}>
          <div>
            <HealthRow
              label="JS heap used"
              value={telemetry.memory.usedMb == null ? "—" : `${telemetry.memory.usedMb} MB`}
              status={
                telemetry.memory.pct == null ? "idle" : telemetry.memory.pct < 60 ? "good" : telemetry.memory.pct < 85 ? "warn" : "bad"
              }
              detail={telemetry.memory.limitMb ? `Limit ${telemetry.memory.limitMb} MB` : "Not exposed by this browser"}
            />
            <HealthRow
              label="Heap pressure"
              value={telemetry.memory.pct == null ? "—" : `${telemetry.memory.pct}%`}
              status={telemetry.memory.pct == null ? "idle" : telemetry.memory.pct < 75 ? "good" : "warn"}
            />
            <HealthRow
              label="Long tasks"
              value={String(telemetry.longTasks.count)}
              status={telemetry.longTasks.count < 5 ? "good" : telemetry.longTasks.count < 15 ? "warn" : "bad"}
              detail={`${telemetry.longTasks.totalMs} ms blocked`}
            />
            <HealthRow
              label="CPU cores"
              value={telemetry.device.cores ? String(telemetry.device.cores) : "—"}
              status="idle"
            />
          </div>
        </Panel>

        <Panel
          title="Data layer health"
          subtitle="Live probe of backend tables"
          icon={Database}
          action={
            avgLatency != null ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                avg {avgLatency} ms
              </span>
            ) : null
          }
        >
          {health.length ? (
            <div>
              {health.map((h: any) => (
                <HealthRow
                  key={h.table}
                  label={h.table}
                  value={`${h.latency} ms`}
                  status={!h.ok ? "bad" : h.latency < 300 ? "good" : "warn"}
                  detail={h.ok ? `${h.rows.toLocaleString()} rows` : h.error}
                />
              ))}
            </div>
          ) : (
            <Empty label="Probing tables…" />
          )}
        </Panel>
      </div>

      <Panel title="Infrastructure status" subtitle="Edge runtime, API and session signals" icon={Server}>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <HealthRow
              label="API reachability"
              value={errors.length ? `${errors.length} failing` : "healthy"}
              status={errors.length ? "bad" : "good"}
              detail={`${health.length} probes`}
            />
            <HealthRow
              label="Client connectivity"
              value={telemetry.network.online ? "online" : "offline"}
              status={telemetry.network.online ? "good" : "bad"}
            />
            <HealthRow
              label="Service worker"
              value={
                typeof navigator !== "undefined" && "serviceWorker" in navigator
                  ? navigator.serviceWorker.controller
                    ? "active"
                    : "registered/idle"
                  : "unsupported"
              }
              status="idle"
            />
          </div>
          <div>
            <HealthRow label="Time to interactive (DOM)" value={ms(telemetry.nav.domReady)} status={telemetry.nav.domReady < 2500 ? "good" : "warn"} />
            <HealthRow label="Full load" value={ms(telemetry.nav.load)} status={telemetry.nav.load < 4000 ? "good" : "warn"} />
            <HealthRow
              label="Error budget"
              value={errors.length ? "breached" : "within target"}
              status={errors.length ? "bad" : "good"}
              detail="99.9% availability target"
            />
          </div>
        </div>
        {errors.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {errors.map((e: any) => `${e.table}: ${e.error}`).join(" · ")}
            </span>
          </div>
        )}
      </Panel>
    </div>
  );
}
