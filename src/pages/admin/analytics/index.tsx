// @ts-nocheck
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useKpis,
  useTrends,
  useRetention,
  useHourlyActivity,
  useSegments,
  useRevenueLeaders,
  useDataHealth,
} from "./queries";
import { useTelemetry } from "./useTelemetry";
import { OverviewTab } from "./tabs/OverviewTab";
import { AudienceTab } from "./tabs/AudienceTab";
import { PerformanceTab } from "./tabs/PerformanceTab";
import { NetworkTab } from "./tabs/NetworkTab";
import { BusinessTab } from "./tabs/BusinessTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { ReportsTab } from "./tabs/ReportsTab";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "audience", label: "Audience" },
  { value: "performance", label: "Performance" },
  { value: "network", label: "Network & Devices" },
  { value: "business", label: "Business" },
  { value: "insights", label: "AI Insights" },
  { value: "reports", label: "Reports" },
];

export default function AdminAnalytics() {
  const [range, setRange] = useState("30");
  const days = Number(range);
  const qc = useQueryClient();

  const kpisQ = useKpis(days);
  const trendsQ = useTrends(days);
  const retentionQ = useRetention();
  const hourlyQ = useHourlyActivity();
  const segmentsQ = useSegments(days);
  const leadersQ = useRevenueLeaders();
  const healthQ = useDataHealth();
  const telemetry = useTelemetry();

  const refreshing = [kpisQ, trendsQ, retentionQ, segmentsQ, leadersQ, healthQ].some((q) => q.isFetching);

  const shared = {
    kpis: kpisQ.data,
    trends: trendsQ.data,
    retention: retentionQ.data,
    hourly: hourlyQ.data,
    segments: segmentsQ.data,
    leaders: leadersQ.data,
    dataHealth: healthQ.data,
    telemetry,
    days,
    loading: kpisQ.isLoading,
  };

  return (
    <div className="min-w-0">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            Data &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time and historical intelligence across players, revenue, performance and infrastructure.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh analytics"
            onClick={() => qc.invalidateQueries({ queryKey: ["analytics"] })}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab {...shared} />
        </TabsContent>
        <TabsContent value="audience">
          <AudienceTab {...shared} />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceTab {...shared} />
        </TabsContent>
        <TabsContent value="network">
          <NetworkTab {...shared} />
        </TabsContent>
        <TabsContent value="business">
          <BusinessTab {...shared} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab {...shared} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab {...shared} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
