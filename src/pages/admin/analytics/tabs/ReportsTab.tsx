// @ts-nocheck
import { useState } from "react";
import { FileDown, FileJson, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel } from "../primitives";
import { exportAsCSV, exportAsJSON } from "@/utils/export";

const DATASETS = [
  { id: "kpis", label: "Executive KPIs", desc: "Revenue, users, conversion, ARPU" },
  { id: "revenue", label: "Revenue time series", desc: "Daily verified revenue" },
  { id: "growth", label: "Growth time series", desc: "Signups and tournament joins" },
  { id: "retention", label: "Retention cohorts", desc: "DAU / WAU / MAU and stickiness" },
  { id: "hourly", label: "Hourly activity", desc: "Load distribution by hour" },
  { id: "games", label: "Game segments", desc: "Joins by title" },
  { id: "countries", label: "Geography", desc: "Signups by country" },
  { id: "acquisition", label: "Acquisition channels", desc: "Referral source breakdown" },
  { id: "tournaments", label: "Tournament revenue", desc: "Top tournaments by revenue" },
  { id: "spenders", label: "Top spenders", desc: "Lifetime verified spend" },
  { id: "health", label: "Data-layer health", desc: "Table latency and row counts" },
  { id: "telemetry", label: "Client telemetry", desc: "Web vitals, network, device" },
];

export function ReportsTab({ kpis, trends, retention, hourly, segments, leaders, dataHealth, telemetry, days }: any) {
  const [selected, setSelected] = useState<string[]>(["kpis", "revenue", "retention"]);
  const [done, setDone] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const sources: Record<string, any> = {
    kpis: kpis ? [kpis] : [],
    revenue: trends?.revenue ?? [],
    growth: trends?.growth ?? [],
    retention: retention ? [retention] : [],
    hourly: hourly ?? [],
    games: segments?.games ?? [],
    countries: segments?.countries ?? [],
    acquisition: segments?.acquisition ?? [],
    tournaments: leaders?.tournaments ?? [],
    spenders: leaders?.spenders ?? [],
    health: dataHealth ?? [],
    telemetry: [
      {
        ...telemetry?.vitals,
        ...telemetry?.nav,
        totalKb: telemetry?.totalKb,
        heapUsedMb: telemetry?.memory?.usedMb,
        longTasks: telemetry?.longTasks?.count,
        connection: telemetry?.network?.effectiveType,
        rttMs: telemetry?.network?.rttMs,
        formFactor: telemetry?.device?.formFactor,
        cores: telemetry?.device?.cores,
      },
    ],
  };

  const stamp = new Date().toISOString().slice(0, 10);

  const runExport = (fmt: "csv" | "json") => {
    if (!selected.length) return;
    if (fmt === "json") {
      const payload = {
        generatedAt: new Date().toISOString(),
        windowDays: days,
        datasets: Object.fromEntries(selected.map((id) => [id, sources[id]])),
      };
      exportAsJSON(payload, `gameflex_analytics_${stamp}.json`);
    } else {
      selected.forEach((id) => {
        const rows = sources[id];
        if (rows?.length) exportAsCSV(rows, `gameflex_${id}_${stamp}.csv`);
      });
    }
    setDone(fmt);
    window.setTimeout(() => setDone(null), 2500);
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Custom report builder"
        subtitle={`Pick datasets, then export the current ${days}-day window`}
        icon={FileDown}
        action={
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
            {selected.length} selected
          </span>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {DATASETS.map((d) => {
            const rows = sources[d.id]?.length ?? 0;
            const on = selected.includes(d.id);
            return (
              <label
                key={d.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  on ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/30 hover:border-border"
                }`}
              >
                <Checkbox checked={on} onCheckedChange={() => toggle(d.id)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{d.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{d.desc}</span>
                  <span className="mt-1 block text-[11px] font-mono text-muted-foreground/70">{rows} rows</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => runExport("csv")} disabled={!selected.length} className="gap-2">
            {done === "csv" ? <Check className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => runExport("json")}
            disabled={!selected.length}
            className="gap-2"
          >
            {done === "json" ? <Check className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
            Export JSON bundle
          </Button>
          <Button variant="ghost" onClick={() => setSelected(DATASETS.map((d) => d.id))}>
            Select all
          </Button>
          <Button variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          CSV exports one file per dataset for spreadsheet pivoting; the JSON bundle keeps every selected dataset in a
          single warehouse-ready payload with the reporting window attached.
        </p>
      </Panel>
    </div>
  );
}
