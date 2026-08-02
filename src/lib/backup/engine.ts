import { supabase } from "@/integrations/supabase/client";
import type {
  BackupSnapshot,
  RestoreMode,
  RestoreResult,
  RestoreTableResult,
} from "./types";
import { dayKey, putSnapshot } from "./snapshot-store";

/** Tables included in a full snapshot. */
export const BACKUP_TABLES = [
  "profiles",
  "tournaments",
  "matches",
  "payments",
  "registrations",
  "user_statuses",
  "status_comments",
  "status_likes",
  "marketplace_listings",
  "achievements",
  "user_achievements",
  "notifications",
  "support_tickets",
  "game_rooms",
  "referrals",
  "rewards",
  "user_follows",
  "user_roles",
] as const;

/**
 * Tables a restore is allowed to write. Anything outside this list in an
 * uploaded dump is reported and skipped rather than written blindly.
 */
export const RESTORABLE_TABLES: readonly string[] = BACKUP_TABLES;

const PAGE_SIZE = 1000;

/** Reads every row of a table, paging past PostgREST's row cap. */
async function fetchAllRows(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function buildSnapshot(
  type: "manual" | "auto",
  onProgress?: (table: string, index: number, total: number) => void,
): Promise<BackupSnapshot> {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const counts: Record<string, number> = {};
  let total = 0;

  for (let i = 0; i < BACKUP_TABLES.length; i++) {
    const table = BACKUP_TABLES[i]!;
    onProgress?.(table, i, BACKUP_TABLES.length);
    try {
      const rows = await fetchAllRows(table);
      tables[table] = rows;
      counts[table] = rows.length;
      total += rows.length;
    } catch {
      // A table the current admin cannot read must not abort the whole backup.
      tables[table] = [];
      counts[table] = 0;
    }
  }

  const exportedAt = new Date().toISOString();
  const payload: BackupSnapshot["payload"] = {
    format: "gameflex-backup",
    version: 2,
    exported_at: exportedAt,
    tables,
  };

  const snapshot: BackupSnapshot = {
    id: `snapshot_${Date.now()}`,
    exported_at: exportedAt,
    day: dayKey(exportedAt),
    type,
    total_records: total,
    tables: counts,
    size_bytes: new Blob([JSON.stringify(payload)]).size,
    payload,
  };

  await putSnapshot(snapshot);
  return snapshot;
}

export function normalizePayload(input: unknown): BackupSnapshot["payload"] | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;

  // v2 snapshot file
  if (record["tables"] && typeof record["tables"] === "object") {
    return {
      format: "gameflex-backup",
      version: 2,
      exported_at: (record["exported_at"] as string) ?? new Date().toISOString(),
      tables: record["tables"] as Record<string, Record<string, unknown>[]>,
      local_data: record["local_data"] as Record<string, unknown> | undefined,
    };
  }
  // v1 snapshot wrapper { payload: { tables } }
  const payload = record["payload"] as Record<string, unknown> | undefined;
  if (payload?.["tables"]) return normalizePayload(payload);

  return null;
}

export function summarizePayload(payload: BackupSnapshot["payload"]) {
  const known: { table: string; rows: number }[] = [];
  const unknown: { table: string; rows: number }[] = [];

  for (const [table, rows] of Object.entries(payload.tables)) {
    const entry = { table, rows: Array.isArray(rows) ? rows.length : 0 };
    (RESTORABLE_TABLES.includes(table) ? known : unknown).push(entry);
  }
  known.sort((a, b) => b.rows - a.rows);
  return {
    known,
    unknown,
    totalRows: [...known, ...unknown].reduce((sum, t) => sum + t.rows, 0),
  };
}

/**
 * Restores a backup payload.
 *
 * "merge" (the default) only ever upserts rows — no statement in this path can
 * remove data, so a mistaken restore cannot lose anything that is not in the
 * backup. "replace" additionally deletes the rows of each restored table that
 * are absent from the backup, and is gated behind a typed confirmation in the
 * UI; it never touches a table the backup has no rows for.
 */
export async function restorePayload(
  payload: BackupSnapshot["payload"],
  options: { mode: RestoreMode; tables?: string[] },
  onProgress?: (table: string, index: number, total: number) => void,
): Promise<RestoreResult> {
  const selected = (options.tables ?? Object.keys(payload.tables)).filter((table) =>
    RESTORABLE_TABLES.includes(table),
  );

  const results: RestoreTableResult[] = [];

  for (let i = 0; i < selected.length; i++) {
    const table = selected[i]!;
    const rows = payload.tables[table];
    onProgress?.(table, i, selected.length);

    if (!Array.isArray(rows) || rows.length === 0) {
      results.push({ table, rows: 0, written: 0, skipped: 0, deleted: 0 });
      continue;
    }

    const result: RestoreTableResult = {
      table,
      rows: rows.length,
      written: 0,
      skipped: 0,
      deleted: 0,
    };

    try {
      for (let from = 0; from < rows.length; from += 200) {
        const chunk = rows.slice(from, from + 200);
        const { error } = await supabase
          .from(table as never)
          .upsert(chunk as never, { onConflict: "id" });
        if (error) throw new Error(error.message);
        result.written += chunk.length;
      }

      if (options.mode === "replace") {
        const ids = rows
          .map((row) => (row as Record<string, unknown>)["id"])
          .filter((id): id is string => typeof id === "string");

        // Only prune when every backed-up row carries an id, otherwise a
        // partial backup would delete rows it simply never captured.
        if (ids.length === rows.length && ids.length > 0) {
          const { data, error } = await supabase
            .from(table as never)
            .delete()
            .not("id", "in", `(${ids.join(",")})`)
            .select("id");
          if (error) throw new Error(error.message);
          result.deleted = (data ?? []).length;
        } else {
          result.skipped = rows.length - ids.length;
        }
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    results.push(result);
  }

  return {
    mode: options.mode,
    tables: results,
    totalWritten: results.reduce((sum, r) => sum + r.written, 0),
    totalRows: results.reduce((sum, r) => sum + r.rows, 0),
    failed: results.filter((r) => r.error).length,
  };
}

export function toFullSqlDump(payload: BackupSnapshot["payload"]): string {
  const lines: string[] = [
    "-- GameFlex complete database dump",
    `-- Generated at: ${payload.exported_at}`,
    "-- Restore-safe: contains INSERT statements only.",
    "",
  ];

  for (const [table, rows] of Object.entries(payload.tables)) {
    if (!Array.isArray(rows) || rows.length === 0) {
      lines.push(`-- Table ${table} is empty`, "");
      continue;
    }
    const columns = Object.keys(rows[0] as Record<string, unknown>);
    const columnList = columns.map((c) => `"${c}"`).join(", ");
    lines.push(`-- ${table} (${rows.length} rows)`);
    for (const row of rows as Record<string, unknown>[]) {
      const values = columns.map((column) => sqlLiteral(row[column])).join(", ");
      lines.push(
        `INSERT INTO "${table}" (${columnList}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
