import type { BackupSnapshot, BackupSnapshotMeta } from "./types";

const DB_NAME = "gameflex_backups";
const STORE = "snapshots";
/** Rolling window: three consecutive days of snapshots are retained. */
export const MAX_SNAPSHOTS = 3;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Snapshot storage is unavailable in this browser"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Cannot open snapshot storage"));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Snapshot storage error"));
    transaction.oncomplete = () => db.close();
  });
}

export function dayKey(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export async function listSnapshots(): Promise<BackupSnapshotMeta[]> {
  const all = await tx<BackupSnapshot[]>("readonly", (store) => store.getAll());
  return all
    .map(({ payload: _payload, ...meta }) => meta)
    .sort((a, b) => b.exported_at.localeCompare(a.exported_at));
}

export async function getSnapshot(id: string): Promise<BackupSnapshot | undefined> {
  return tx<BackupSnapshot | undefined>("readonly", (store) => store.get(id));
}

export async function deleteSnapshot(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id));
}

/**
 * Stores a snapshot and prunes the history back to the newest MAX_SNAPSHOTS,
 * keeping at most one snapshot per calendar day so the retained set really is
 * three consecutive days rather than three dumps from the same afternoon.
 */
export async function putSnapshot(snapshot: BackupSnapshot): Promise<BackupSnapshotMeta[]> {
  await tx("readwrite", (store) => store.put(snapshot));

  const metas = await listSnapshots();
  const keptDays = new Set<string>();
  const keep: string[] = [];

  for (const meta of metas) {
    if (keptDays.has(meta.day)) continue;
    if (keep.length >= MAX_SNAPSHOTS) break;
    keptDays.add(meta.day);
    keep.push(meta.id);
  }

  const keepSet = new Set(keep);
  for (const meta of metas) {
    if (!keepSet.has(meta.id)) await deleteSnapshot(meta.id);
  }

  return listSnapshots();
}

export async function hasSnapshotForDay(day: string): Promise<boolean> {
  const metas = await listSnapshots();
  return metas.some((m) => m.day === day);
}
