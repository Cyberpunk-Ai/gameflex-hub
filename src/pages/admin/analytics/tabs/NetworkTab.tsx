// @ts-nocheck
import { Wifi, Smartphone, Signal, Globe, Languages, MonitorSmartphone } from "lucide-react";
import { Kpi, Panel, Empty, HealthRow, RankList } from "../primitives";
import { ms } from "../format";

export function NetworkTab({ telemetry, segments }: any) {
  const n = telemetry.network;
  const d = telemetry.device;
  const quality =
    n.rttMs == null ? "idle" : n.rttMs < 100 ? "good" : n.rttMs < 300 ? "warn" : "bad";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          icon={Signal}
          label="Connection class"
          value={n.effectiveType.toUpperCase()}
          tone="primary"
          hint="Network Information API"
        />
        <Kpi
          icon={Wifi}
          label="Downlink"
          value={n.downlinkMbps == null ? "—" : `${n.downlinkMbps} Mbps`}
          tone="chart-2"
          hint="Estimated bandwidth"
        />
        <Kpi icon={Signal} label="Round-trip time" value={ms(n.rttMs)} tone="accent" hint="Transport latency" />
        <Kpi
          icon={Smartphone}
          label="Form factor"
          value={d.formFactor}
          tone="chart-4"
          hint={`${d.viewport} @ ${d.dpr}x`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Network quality" subtitle="Live session transport profile" icon={Wifi}>
          <div>
            <HealthRow label="Effective type" value={n.effectiveType} status="idle" />
            <HealthRow label="RTT" value={ms(n.rttMs)} status={quality} detail="Target < 100 ms" />
            <HealthRow
              label="Bandwidth"
              value={n.downlinkMbps == null ? "—" : `${n.downlinkMbps} Mbps`}
              status={n.downlinkMbps == null ? "idle" : n.downlinkMbps >= 5 ? "good" : "warn"}
            />
            <HealthRow
              label="Data saver"
              value={n.saveData == null ? "—" : n.saveData ? "enabled" : "off"}
              status={n.saveData ? "warn" : "good"}
              detail="Serve lighter assets when enabled"
            />
            <HealthRow
              label="Status"
              value={n.online ? "online" : "offline"}
              status={n.online ? "good" : "bad"}
            />
          </div>
        </Panel>

        <Panel title="Device telemetry" subtitle="Hardware and capability signals" icon={MonitorSmartphone}>
          <div>
            <HealthRow label="Platform" value={d.platform} status="idle" />
            <HealthRow label="CPU cores" value={d.cores ? String(d.cores) : "—"} status={d.cores && d.cores >= 4 ? "good" : "warn"} />
            <HealthRow
              label="Device memory"
              value={d.deviceMemoryGb ? `${d.deviceMemoryGb} GB` : "—"}
              status={d.deviceMemoryGb == null ? "idle" : d.deviceMemoryGb >= 4 ? "good" : "warn"}
            />
            <HealthRow label="Touch input" value={d.touch ? "yes" : "no"} status="idle" />
            <HealthRow label="Reduced motion" value={d.reducedMotion ? "requested" : "off"} status="idle" />
          </div>
        </Panel>

        <Panel title="Locale & routing" subtitle="Where this session is served from" icon={Languages}>
          <div>
            <HealthRow label="Language" value={d.language} status="idle" />
            <HealthRow label="Timezone" value={d.timezone} status="idle" />
            <HealthRow
              label="Origin host"
              value={typeof window !== "undefined" ? window.location.hostname : "—"}
              status="idle"
            />
            <HealthRow
              label="Protocol"
              value={typeof window !== "undefined" ? window.location.protocol.replace(":", "") : "—"}
              status="good"
            />
            <HealthRow label="Viewport" value={`${d.viewport} @ ${d.dpr}x`} status="idle" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Geographic distribution" subtitle="Signups by country in period" icon={Globe}>
          {segments?.countries?.length ? (
            <RankList rows={segments.countries} />
          ) : (
            <Empty label="Country data appears as signups roll in" />
          )}
        </Panel>
        <Panel title="Delivery notes" subtitle="What these signals imply" icon={Signal}>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="rounded-lg bg-secondary/40 p-3">
              Sessions on <strong className="text-foreground">{n.effectiveType.toUpperCase()}</strong> connections
              should get compressed images and deferred non-critical JS.
            </li>
            <li className="rounded-lg bg-secondary/40 p-3">
              Page weight is <strong className="text-foreground">{telemetry.totalKb} KB</strong>; at{" "}
              {n.downlinkMbps ?? "?"} Mbps that is roughly{" "}
              <strong className="text-foreground">
                {n.downlinkMbps ? `${((telemetry.totalKb * 8) / 1024 / n.downlinkMbps).toFixed(1)}s` : "unknown"}
              </strong>{" "}
              of transfer time.
            </li>
            <li className="rounded-lg bg-secondary/40 p-3">
              ISP-level attribution requires a server-side IP enrichment step; per-session network class is
              captured here without collecting IP addresses.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
