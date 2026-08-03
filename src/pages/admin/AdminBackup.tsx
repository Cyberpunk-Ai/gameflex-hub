import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCode,
  FileJson,
  HardDrive,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Copy,
  Table as TableIcon,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadFile, exportAsCSV, exportAsJSON, getExportFilename } from "@/utils/export";
import {
  BACKUP_TABLES,
  buildSnapshot,
  normalizePayload,
  restorePayload,
  summarizePayload,
  toFullSqlDump,
} from "@/lib/backup/engine";
import { sqlDumpToPayload } from "@/lib/backup/sql-parser";
import { PLATFORM_MIGRATIONS, buildPlatformSchemaSql } from "@/lib/backup/schema-sql";
import {
  MAX_SNAPSHOTS,
  dayKey,
  deleteSnapshot,
  getSnapshot,
  listSnapshots,
} from "@/lib/backup/snapshot-store";
import type { BackupSnapshot, RestoreMode, RestoreResult } from "@/lib/backup/types";

const AUTO_KEY = "gameflex_auto_backup_enabled";
const LAST_EXPORT_KEY = "gameflex_last_export";
const CONFIRM_PHRASE = "REPLACE DATA";

const TABLE_LABELS: Record<string, string> = {
  profiles: "Users / Profiles",
  tournaments: "Tournaments",
  matches: "Matches",
  payments: "Payments",
  registrations: "Registrations",
  user_statuses: "Posts / Statuses",
  status_comments: "Comments",
  status_likes: "Likes",
  marketplace_listings: "Marketplace Listings",
  achievements: "Achievements",
  user_achievements: "User Achievements",
  notifications: "Notifications",
  support_tickets: "Support Tickets",
  game_rooms: "Game Rooms / Lobbies",
  referrals: "Referrals",
  rewards: "Rewards & Redemptions",
  user_follows: "Follows",
  user_roles: "Roles & Permissions",
  squads: "Squads",
  squad_members: "Squad Rosters",
  squad_invites: "Squad Invites",
  squad_messages: "Squad Chat",
};

const label = (table: string) => TABLE_LABELS[table] ?? table;

type PendingRestore = {
  source: string;
  payload: BackupSnapshot["payload"];
};

export default function AdminBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ label: string; value: number } | null>(null);
  const [snapshots, setSnapshots] = useState<
    Awaited<ReturnType<typeof listSnapshots>>
  >([]);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("merge");
  const [confirmText, setConfirmText] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [lastResult, setLastResult] = useState<RestoreResult | null>(null);

  useEffect(() => {
    setAutoEnabled(localStorage.getItem(AUTO_KEY) !== "false");
    setLastExport(localStorage.getItem(LAST_EXPORT_KEY));
    listSnapshots().then(setSnapshots).catch(() => setSnapshots([]));
  }, []);

  const { data: counts = {}, refetch: refetchCounts, isFetching: countsLoading } = useQuery({
    queryKey: ["admin-table-counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        BACKUP_TABLES.map(async (table) => {
          const { count } = await supabase
            .from(table as never)
            .select("*", { count: "exact", head: true });
          return [table, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const totalRows = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts],
  );

  const runSnapshot = useCallback(async (type: "manual" | "auto") => {
    const snapshot = await buildSnapshot(type, (table, index, total) => {
      setProgress({ label: `Reading ${label(table)}`, value: Math.round((index / total) * 100) });
    });
    setProgress(null);
    localStorage.setItem(LAST_EXPORT_KEY, snapshot.exported_at);
    setLastExport(snapshot.exported_at);
    setSnapshots(await listSnapshots());
    return snapshot;
  }, []);

  // One automatic snapshot per calendar day; the store keeps the newest three days.
  useEffect(() => {
    if (!autoEnabled) return;
    let cancelled = false;

    (async () => {
      const existing = await listSnapshots();
      if (cancelled || existing.some((s) => s.day === dayKey())) return;
      try {
        const snapshot = await runSnapshot("auto");
        toast.success(
          `Daily backup captured — ${snapshot.total_records.toLocaleString()} records safe`,
        );
      } catch {
        // Never block the admin UI on an automatic backup.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoEnabled, runSnapshot]);

  const toggleAuto = (checked: boolean) => {
    setAutoEnabled(checked);
    localStorage.setItem(AUTO_KEY, String(checked));
    toast[checked ? "success" : "info"](
      checked ? "Daily automatic backups enabled" : "Daily automatic backups paused",
    );
  };

  const handleManualSnapshot = async () => {
    setBusy("snapshot");
    try {
      const snapshot = await runSnapshot("manual");
      toast.success(`Snapshot saved — ${snapshot.total_records.toLocaleString()} records`);
    } catch (error) {
      toast.error(`Snapshot failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const handleExport = async (kind: "json" | "sql") => {
    setBusy(kind);
    try {
      const snapshot = await runSnapshot("manual");
      if (kind === "json") {
        exportAsJSON(snapshot.payload, getExportFilename("gameflex_full_backup", "json"));
        toast.success("Full JSON backup downloaded");
      } else {
        downloadFile(
          toFullSqlDump(snapshot.payload),
          getExportFilename("gameflex_full_backup", "sql"),
          "application/sql",
        );
        toast.success("Full SQL dump downloaded");
      }
    } catch (error) {
      toast.error(`Export failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const handleTableExport = async (table: string, kind: "json" | "csv") => {
    setBusy(`${table}_${kind}`);
    try {
      const { data, error } = await supabase.from(table as never).select("*");
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Record<string, unknown>[];
      const filename = getExportFilename(table, kind);
      if (kind === "json") exportAsJSON(rows, filename);
      else exportAsCSV(rows, filename);
      toast.success(`Exported ${rows.length.toLocaleString()} rows from ${label(table)}`);
    } catch (error) {
      toast.error(`Export failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadSnapshot = async (id: string) => {
    const snapshot = await getSnapshot(id);
    if (!snapshot) {
      toast.error("Snapshot no longer available");
      return;
    }
    exportAsJSON(snapshot.payload, getExportFilename("gameflex_snapshot", "json"));
  };

  const handleRestoreFromSnapshot = async (id: string) => {
    const snapshot = await getSnapshot(id);
    if (!snapshot) {
      toast.error("Snapshot no longer available");
      return;
    }
    openRestore(
      `${snapshot.type === "auto" ? "Daily" : "Manual"} snapshot — ${format(
        new Date(snapshot.exported_at),
        "MMM d, HH:mm",
      )}`,
      snapshot.payload,
    );
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteSnapshot(id);
    setSnapshots(await listSnapshots());
    toast.success("Snapshot removed from history (database untouched)");
  };

  const openRestore = (source: string, payload: BackupSnapshot["payload"]) => {
    setPending({ source, payload });
    setRestoreMode("merge");
    setConfirmText("");
    setLastResult(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const payload = file.name.toLowerCase().endsWith(".sql")
        ? sqlDumpToPayload(text)
        : normalizePayload(JSON.parse(text));

      if (!payload || Object.keys(payload.tables).length === 0) {
        toast.error("No restorable rows found in that file");
        return;
      }
      openRestore(file.name, payload);
    } catch {
      toast.error("Could not read that file — expected a GameFlex .json or .sql backup");
    }
  };

  const summary = pending ? summarizePayload(pending.payload) : null;
  const replaceBlocked = restoreMode === "replace" && confirmText.trim() !== CONFIRM_PHRASE;

  const handleRestore = async () => {
    if (!pending || !summary) return;
    setRestoring(true);
    try {
      const result = await restorePayload(
        pending.payload,
        { mode: restoreMode, tables: summary.known.map((t) => t.table) },
        (table, index, total) => {
          setProgress({
            label: `Restoring ${label(table)}`,
            value: Math.round((index / total) * 100),
          });
        },
      );
      setLastResult(result);
      setProgress(null);
      setPending(null);
      refetchCounts();

      if (result.failed > 0) {
        toast.warning(
          `Restored ${result.totalWritten.toLocaleString()} rows — ${result.failed} table(s) reported errors`,
        );
      } else {
        toast.success(`Restored ${result.totalWritten.toLocaleString()} rows successfully`);
      }
    } catch (error) {
      toast.error(`Restore failed: ${(error as Error).message}`);
    } finally {
      setRestoring(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display flex items-center gap-2 text-2xl font-bold">
            <Database className="h-6 w-6 text-primary" /> Backup &amp; Restore
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Three rolling days of automatic snapshots, exportable JSON/SQL dumps, and a restore
            path that cannot delete data unless you explicitly ask it to.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastExport && (
            <span className="mr-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Last backup {format(new Date(lastExport), "MMM d, HH:mm")}
            </span>
          )}
          <Button variant="outline" onClick={() => handleExport("sql")} disabled={busy !== null}>
            {busy === "sql" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCode className="mr-2 h-4 w-4" />
            )}
            SQL dump
          </Button>
          <Button onClick={() => handleExport("json")} disabled={busy !== null}>
            {busy === "json" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Full JSON backup
          </Button>
        </div>
      </header>

      {progress && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {progress.label}
              </span>
              <span className="text-muted-foreground">{progress.value}%</span>
            </div>
            <Progress value={progress.value} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-7 w-7 text-primary" />}
          value={countsLoading ? "…" : totalRows.toLocaleString()}
          caption="Live database records"
        />
        <StatCard
          icon={<TableIcon className="h-7 w-7 text-primary" />}
          value={String(BACKUP_TABLES.length)}
          caption="Tables covered"
        />
        <StatCard
          icon={<HardDrive className="h-7 w-7 text-primary" />}
          value={`${snapshots.length}/${MAX_SNAPSHOTS}`}
          caption="Daily snapshots stored"
        />
        <StatCard
          icon={<ShieldCheck className="h-7 w-7 text-primary" />}
          value={restoreMode === "replace" ? "Guarded" : "Safe mode"}
          caption="Restores upsert by default"
        />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Shield className="mt-1 h-8 w-8 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-lg font-bold">Automatic daily snapshots</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                One snapshot is captured per day when an admin opens this page, and the newest{" "}
                {MAX_SNAPSHOTS} days are retained — so you can always roll back to yesterday, or
                the day before. Snapshots live in this browser's secure local storage; download
                them for off-site copies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="auto-backup" checked={autoEnabled} onCheckedChange={toggleAuto} />
              <Label htmlFor="auto-backup" className="text-sm font-medium">
                {autoEnabled ? "Enabled" : "Paused"}
              </Label>
            </div>
            <Button variant="outline" onClick={handleManualSnapshot} disabled={busy !== null}>
              {busy === "snapshot" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Snapshot now
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" /> Snapshot history
            </CardTitle>
            <CardDescription>
              Restore straight from a stored day, or download it as a file first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.length === 0 && (
              <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No snapshots yet. Use “Snapshot now” to capture the first one.
              </p>
            )}
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {format(new Date(snapshot.exported_at), "EEE d MMM, HH:mm")}
                    </span>
                    <Badge variant={snapshot.type === "auto" ? "secondary" : "default"}>
                      {snapshot.type === "auto" ? "Daily" : "Manual"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {snapshot.total_records.toLocaleString()} records ·{" "}
                    {(snapshot.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreFromSnapshot(snapshot.id)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Download snapshot"
                    onClick={() => handleDownloadSnapshot(snapshot.id)}
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete snapshot"
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" /> Restore from a file
            </CardTitle>
            <CardDescription>
              Accepts a GameFlex JSON backup or a SQL dump. Only INSERT statements are read — any
              DROP, DELETE or TRUNCATE lines in a dump are ignored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.sql"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Choose backup file
            </Button>

            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Safe by default
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Restores insert missing rows and update existing ones by id. Nothing is deleted
                unless you switch on replace mode and type the confirmation phrase.
              </p>
            </div>

            {lastResult && (
              <div className="space-y-2 rounded-lg border border-border/60 p-4">
                <p className="text-sm font-semibold">
                  Last restore · {lastResult.totalWritten.toLocaleString()} rows written
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {lastResult.tables
                    .filter((t) => t.rows > 0)
                    .map((t) => (
                      <div key={t.table} className="flex items-center justify-between gap-2">
                        <span className="truncate">{label(t.table)}</span>
                        <span className={t.error ? "text-destructive" : "text-muted-foreground"}>
                          {t.error
                            ? t.error
                            : `${t.written} written${t.deleted ? `, ${t.deleted} removed` : ""}`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Per-table export</CardTitle>
            <CardDescription>Download any single table as JSON or CSV.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetchCounts()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${countsLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {BACKUP_TABLES.map((table) => (
            <div
              key={table}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{label(table)}</p>
                <p className="text-xs text-muted-foreground">
                  {(counts[table] ?? 0).toLocaleString()} rows
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => handleTableExport(table, "json")}
                >
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => handleTableExport(table, "csv")}
                >
                  CSV
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review restore</DialogTitle>
            <DialogDescription className="truncate">{pending?.source}</DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
                <span className="font-semibold">{summary.totalRows.toLocaleString()}</span> rows
                across <span className="font-semibold">{summary.known.length}</span> restorable
                table(s).
              </div>

              <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
                {summary.known.map((t) => (
                  <div key={t.table} className="flex items-center justify-between gap-2">
                    <span className="truncate">{label(t.table)}</span>
                    <span className="text-muted-foreground">{t.rows.toLocaleString()} rows</span>
                  </div>
                ))}
              </div>

              {summary.unknown.length > 0 && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  Skipping unrecognised table(s):{" "}
                  {summary.unknown.map((t) => t.table).join(", ")}
                </p>
              )}

              <div className="space-y-3 rounded-lg border border-border/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="replace-mode" className="text-sm font-semibold">
                      Replace mode
                    </Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Off: only insert and update (nothing can be lost). On: also delete rows
                      missing from this backup, in the restored tables only.
                    </p>
                  </div>
                  <Switch
                    id="replace-mode"
                    checked={restoreMode === "replace"}
                    onCheckedChange={(checked) => {
                      setRestoreMode(checked ? "replace" : "merge");
                      setConfirmText("");
                    }}
                  />
                </div>

                {restoreMode === "replace" && (
                  <div className="space-y-2">
                    <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      This deletes live rows that are not in the backup. Take a fresh snapshot
                      first — then type <strong>{CONFIRM_PHRASE}</strong> to unlock.
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      placeholder={CONFIRM_PHRASE}
                      aria-label="Confirmation phrase"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoring || replaceBlocked || (summary?.known.length ?? 0) === 0}
              variant={restoreMode === "replace" ? "destructive" : "default"}
            >
              {restoring ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {restoreMode === "replace" ? "Replace and restore" : "Restore safely"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  value,
  caption,
}: {
  icon: React.ReactNode;
  value: string;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="font-display truncate text-lg font-bold">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{caption}</div>
        </div>
      </CardContent>
    </Card>
  );
}
