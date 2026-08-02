export type BackupSnapshotMeta = {
  id: string;
  exported_at: string;
  /** Calendar day key (YYYY-MM-DD) — one auto snapshot per day is kept. */
  day: string;
  type: "manual" | "auto";
  total_records: number;
  tables: Record<string, number>;
  size_bytes: number;
};

export type BackupSnapshot = BackupSnapshotMeta & {
  payload: {
    format: "gameflex-backup";
    version: 2;
    exported_at: string;
    tables: Record<string, Record<string, unknown>[]>;
    local_data?: Record<string, unknown>;
  };
};

export type RestoreMode = "merge" | "replace";

export type RestoreTableResult = {
  table: string;
  rows: number;
  written: number;
  skipped: number;
  deleted: number;
  error?: string;
};

export type RestoreResult = {
  mode: RestoreMode;
  tables: RestoreTableResult[];
  totalWritten: number;
  totalRows: number;
  failed: number;
};
