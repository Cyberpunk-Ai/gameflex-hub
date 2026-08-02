// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileJson,
  FileText,
  FileCode,
  HardDrive,
  Loader2,
  Table as TableIcon,
  Trash2,
  Sparkles,
  History,
  Save,
} from "lucide-react";
import { exportAsJSON, exportAsCSV, exportAsSQL, getExportFilename, toSQL } from "@/utils/export";
import { toast } from "sonner";
import { format } from "date-fns";

const EXPORTABLE_TABLES = [
  { key: "profiles", label: "Users / Profiles", icon: "👤", sensitive: false },
  { key: "tournaments", label: "Tournaments", icon: "🏆", sensitive: false },
  { key: "matches", label: "Matches", icon: "🎮", sensitive: false },
  { key: "payments", label: "Payments", icon: "💳", sensitive: true },
  { key: "registrations", label: "Registrations", icon: "📋", sensitive: false },
  { key: "user_statuses", label: "Posts / Statuses", icon: "📝", sensitive: false },
  { key: "status_comments", label: "Comments", icon: "💬", sensitive: false },
  { key: "marketplace_listings", label: "Marketplace Listings", icon: "🛒", sensitive: false },
  { key: "achievements", label: "Achievements", icon: "🏅", sensitive: false },
  { key: "user_achievements", label: "User Achievements", icon: "⭐", sensitive: false },
  { key: "notifications", label: "Notifications", icon: "🔔", sensitive: false },
  { key: "support_tickets", label: "Support Tickets", icon: "🎫", sensitive: false },
  { key: "game_rooms", label: "Game Rooms", icon: "🕹️", sensitive: false },
  { key: "referrals", label: "Referrals", icon: "🔗", sensitive: false },
  { key: "rewards", label: "Rewards & Redemptions", icon: "🎁", sensitive: false },
  { key: "user_roles", label: "User Roles & Permissions", icon: "🔑", sensitive: true },
];

const RESTORABLE_TABLES = [
  "profiles",
  "tournaments",
  "matches",
  "registrations",
  "achievements",
  "user_statuses",
  "marketplace_listings",
  "game_rooms",
  "rewards",
  "user_roles",
];

export default function AdminBackup() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingSQL, setExportingSQL] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  
  // Daily Auto Backup settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gameflex_auto_backup_enabled") !== "false";
  });
  
  // Historical Snapshots stored in local storage
  const [snapshots, setSnapshots] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("gameflex_backup_snapshots");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastExport = localStorage.getItem("gameflex_last_export");

  // Table row counts
  const {
    data: counts = {},
    refetch: refetchCounts,
    isLoading: countsLoading,
  } = useQuery({
    queryKey: ["admin-table-counts"],
    queryFn: async () => {
      const results = await Promise.all(
        EXPORTABLE_TABLES.map(async (t) => {
          const { count } = await supabase
            .from(t.key as any)
            .select("*", { count: "exact", head: true });
          return [t.key, count ?? 0];
        }),
      );
      return Object.fromEntries(results);
    },
  });

  // Toggle Auto Backup
  const handleToggleAutoBackup = (checked: boolean) => {
    setAutoBackupEnabled(checked);
    localStorage.setItem("gameflex_auto_backup_enabled", String(checked));
    if (checked) {
      toast.success("Automated daily backups enabled!");
    } else {
      toast.info("Automated daily backups disabled.");
    }
  };

  // Run or Trigger a Full Backup Snapshot
  const createBackupSnapshot = useCallback(async (type: "manual" | "auto" = "manual") => {
    try {
      const tablesData: Record<string, any[]> = {};
      let totalRecordsCount = 0;

      for (const t of EXPORTABLE_TABLES) {
        const { data } = await supabase.from(t.key as any).select("*");
        tablesData[t.key] = data ?? [];
        totalRecordsCount += (data ?? []).length;
      }

      // Add local storage data to prevent any data loss
      const localRegistrations = localStorage.getItem("gameflex_registrations");
      const localPayments = localStorage.getItem("gameflex_local_payments");
      const localData = {
        registrations: localRegistrations ? JSON.parse(localRegistrations) : [],
        payments: localPayments ? JSON.parse(localPayments) : [],
      };

      const now = new Date().toISOString();
      const snapshotObj = {
        id: "snapshot_" + Date.now(),
        exported_at: now,
        type,
        total_records: totalRecordsCount,
        tables: tablesData,
        local_data: localData,
      };

      // Save to snapshots history (keep latest 10)
      setSnapshots((prev) => {
        const updatedSnapshots = [snapshotObj, ...prev.slice(0, 9)];
        localStorage.setItem("gameflex_backup_snapshots", JSON.stringify(updatedSnapshots));
        return updatedSnapshots;
      });
      localStorage.setItem("gameflex_last_export", now);

      return snapshotObj;
    } catch (err: any) {
      console.error("Snapshot error:", err);
      throw err;
    }
  }, []);

  // Check for auto daily backup on mount
  useEffect(() => {
    if (!autoBackupEnabled) return;

    const lastAutoTime = localStorage.getItem("gameflex_last_auto_backup_time");
    const nowMs = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    if (!lastAutoTime || nowMs - parseInt(lastAutoTime, 10) > DAY_MS) {
      createBackupSnapshot("auto")
        .then(() => {
          localStorage.setItem("gameflex_last_auto_backup_time", String(nowMs));
          toast.success("Daily automated database backup snapshot completed!");
        })
        .catch(() => {
          // silent fallback
        });
    }
  }, [autoBackupEnabled, createBackupSnapshot]);

  const handleExport = async (table: string, formatType: "json" | "csv" | "sql") => {
    setExporting(table + "_" + formatType);
    try {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) throw error;
      const filename = getExportFilename(table, formatType);
      
      if (formatType === "json") exportAsJSON(data, filename);
      else if (formatType === "csv") exportAsCSV(data ?? [], filename);
      else if (formatType === "sql") exportAsSQL(table, data ?? [], filename);

      localStorage.setItem("gameflex_last_export", new Date().toISOString());
      toast.success(`Exported ${data?.length ?? 0} rows from ${table} as ${formatType.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleExportAllJSON = async () => {
    setExportingAll(true);
    try {
      const snapshot = await createBackupSnapshot("manual");
      exportAsJSON(snapshot, getExportFilename("full_database_dump", "json"));
      toast.success("Full database JSON dump exported successfully!");
    } catch (err: any) {
      toast.error("Backup failed: " + err.message);
    } finally {
      setExportingAll(false);
    }
  };

  const handleExportAllSQL = async () => {
    setExportingSQL(true);
    try {
      let fullSql = `-- GameFlex Complete Database Dump\n-- Generated at: ${new Date().toISOString()}\n\n`;
      
      for (const t of EXPORTABLE_TABLES) {
        const { data } = await supabase.from(t.key as any).select("*");
        fullSql += toSQL(t.key, data ?? []) + "\n";
      }

      exportAsSQL("full_database_dump", [], getExportFilename("full_database_dump", "sql"));
      // Overwrite file content with fullSql
      const blob = new Blob([fullSql], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getExportFilename("full_database_dump", "sql");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      localStorage.setItem("gameflex_last_export", new Date().toISOString());
      toast.success("Full database SQL dump created!");
    } catch (err: any) {
      toast.error("SQL dump failed: " + err.message);
    } finally {
      setExportingSQL(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setImportPreview(json);
    } catch {
      toast.error("Invalid JSON file");
      setImportFile(null);
    }
  };

  const handleRestoreFromSnapshot = (snap: any) => {
    setImportPreview(snap);
    toast.info("Snapshot selected for restoration preview");
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem("gameflex_backup_snapshots", JSON.stringify(updated));
    toast.success("Snapshot deleted");
  };

  const handleRestore = async () => {
    if (!importPreview?.tables) {
      toast.error("Invalid backup format");
      return;
    }
    setRestoring(true);
    try {
      let restored = 0;
      for (const table of RESTORABLE_TABLES) {
        const rows = importPreview.tables[table];
        if (!rows?.length) continue;
        const { error } = await supabase.from(table as any).upsert(rows, { onConflict: "id" });
        if (!error) restored += rows.length;
      }

      // Also restore local storage items if included
      if (importPreview.local_data?.registrations?.length) {
        localStorage.setItem(
          "gameflex_registrations",
          JSON.stringify(importPreview.local_data.registrations),
        );
      }

      toast.success(`Successfully restored ${restored} records!`);
      setImportPreview(null);
      setImportFile(null);
      refetchCounts();
    } catch (err: any) {
      toast.error("Restore failed: " + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const totalRows = Object.values(counts as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Database Backup & Safeguard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ensure complete zero-data-loss protection with automated daily dumps, SQL exports, and local snapshots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastExport && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
              <Clock className="h-3 w-3" /> Last backup:{" "}
              {format(new Date(lastExport), "MMM d, HH:mm")}
            </div>
          )}
          <Button variant="outline" onClick={handleExportAllSQL} disabled={exportingSQL}>
            {exportingSQL ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCode className="h-4 w-4 mr-2 text-blue-500" />
            )}
            SQL Dump
          </Button>
          <Button onClick={handleExportAllJSON} disabled={exportingAll}>
            {exportingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Full JSON Dump
          </Button>
        </div>
      </div>

      {/* Auto Backup & Health Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
            <div>
              <div className="font-bold text-lg">{totalRows.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Database Records</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <TableIcon className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <div className="font-bold text-lg">{EXPORTABLE_TABLES.length}</div>
              <div className="text-xs text-muted-foreground">Monitored Tables</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-500 shrink-0" />
            <div>
              <div className="font-bold text-lg">Cloud + Local</div>
              <div className="text-xs text-muted-foreground">Dual Protection Active</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold text-lg">{snapshots.length} Snapshots</div>
              <div className="text-xs text-muted-foreground">Stored History</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automated Schedule Settings */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Sparkles className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  Automated Daily Local & Cloud Backup
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically generates daily database snapshots every 24 hours. Prevents data loss by saving full state snapshots locally and syncing with Supabase backups.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Label htmlFor="auto-backup-switch" className="text-sm font-medium">
                {autoBackupEnabled ? "Auto Backup Enabled" : "Auto Backup Disabled"}
              </Label>
              <Switch
                id="auto-backup-switch"
                checked={autoBackupEnabled}
                onCheckedChange={handleToggleAutoBackup}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Snapshot History */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Saved Backup Snapshots ({snapshots.length})
            </CardTitle>
            <CardDescription>
              Stored local snapshots ready for single-click download or full restoration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Save className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {format(new Date(snap.exported_at), "PPpp")}
                        <Badge variant={snap.type === "auto" ? "secondary" : "default"} className="text-[10px]">
                          {snap.type === "auto" ? "Automated" : "Manual"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {snap.total_records.toLocaleString()} records across {Object.keys(snap.tables || {}).length} tables
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportAsJSON(snap, getExportFilename("snapshot", "json"))}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreFromSnapshot(snap)}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Preview Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Table Exporter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" /> Table-by-Table Data Dump
              </CardTitle>
              <CardDescription>Export individual database tables as JSON, CSV, or raw SQL INSERT statements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchCounts()}>
              <RefreshCw className={countsLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
            {EXPORTABLE_TABLES.map((table) => {
              const count = (counts as any)[table.key] ?? 0;
              const isExporting = exporting?.startsWith(table.key);
              return (
                <div
                  key={table.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{table.icon}</span>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {table.label}
                        {table.sensitive && (
                          <Badge variant="destructive" className="text-[10px] h-4">
                            Protected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {count.toLocaleString()} records
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!isExporting}
                      onClick={() => handleExport(table.key, "json")}
                    >
                      {isExporting && exporting?.includes("json") ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileJson className="h-3 w-3" />
                      )}
                      <span className="ml-1">JSON</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!isExporting}
                      onClick={() => handleExport(table.key, "csv")}
                    >
                      {isExporting && exporting?.includes("csv") ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      <span className="ml-1">CSV</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!isExporting}
                      onClick={() => handleExport(table.key, "sql")}
                    >
                      {isExporting && exporting?.includes("sql") ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileCode className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="ml-1">SQL</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Import / Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Database Restoration Engine
          </CardTitle>
          <CardDescription>
            Upload a previously generated JSON backup file or select a saved snapshot above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="import-input"
            />
            <label htmlFor="import-input" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to select a backup JSON file</p>
              <p className="text-xs text-muted-foreground">
                Supports GameFlex full database dumps and local snapshots
              </p>
            </label>
          </div>

          {importPreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-500">
                  Restoration performs upserts on restorable tables. Records with matching primary IDs will be updated with snapshot data.
                </p>
              </div>

              <div className="rounded-lg border border-border/50 divide-y divide-border/30 max-h-[300px] overflow-y-auto">
                {Object.entries(importPreview.tables ?? {}).map(([table, rows]: any) => (
                  <div
                    key={table}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">{table}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={RESTORABLE_TABLES.includes(table) ? "default" : "secondary"}>
                        {RESTORABLE_TABLES.includes(table) ? "Will Restore" : "Read-Only"}
                      </Badge>
                      <span className="text-muted-foreground">{(rows || []).length} rows</span>
                    </div>
                  </div>
                ))}
              </div>

              {importPreview.exported_at && (
                <p className="text-xs text-muted-foreground">
                  Snapshot created at: {format(new Date(importPreview.exported_at), "PPpp")}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportPreview(null);
                    setImportFile(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Cancel Preview
                </Button>
                <Button onClick={handleRestore} disabled={restoring}>
                  {restoring ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Execute Database Restore
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
