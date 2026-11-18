// Phase 17C: the sync engine's own IndexedDB, `quran-sync-db` (version 1). It is NOT `quran-revamp-db` (whose version stays 5 so that an Instant Rollback keeps
// opening it) and never `quran-app-db`. Two stores: `state` (the cursor, the per-record bases, the device id) and `snapshot` (the local values kept before the
// first merge, for Undo). Never load-bearing: every read that fails is "no saved state", every write that fails is dropped (the next round redoes the work).
import { openDB, type IDBPDatabase } from "idb";
import { emptyState, type SyncState } from "~/lib/sync/engine";

export const SYNC_DB_NAME = "quran-sync-db";
const STATE = "state";
const SNAPSHOT = "snapshot";

let dbPromise: Promise<IDBPDatabase> | null = null;
export function getSyncDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(SYNC_DB_NAME, 1, {
    upgrade(db) {
      for (const n of [STATE, SNAPSHOT]) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n);
    },
    blocking() {
      void closeSyncDb();
    },
  });
  return dbPromise;
}
export async function closeSyncDb() {
  const p = dbPromise;
  dbPromise = null;
  if (p) (await p.catch(() => null))?.close();
}

const newDeviceId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `d${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);

export async function loadSyncState(): Promise<SyncState> {
  try {
    const v = (await (await getSyncDb()).get(STATE, "main")) as SyncState | undefined;
    if (v && typeof v.cursor === "string" && v.records && typeof v.deviceId === "string") return { ...emptyState(v.deviceId), ...v };
  } catch {
    /* fall through to a fresh state */
  }
  return emptyState(newDeviceId());
}

export async function saveSyncState(s: SyncState): Promise<void> {
  try {
    await (await getSyncDb()).put(STATE, s, "main");
  } catch {
    /* best effort */
  }
}

export interface Snapshot {
  takenAt: number;
  /** storage key -> its raw value before the merge, or null when it was absent */
  values: Record<string, string | null>;
}
export async function saveSnapshot(s: Snapshot): Promise<void> {
  try {
    await (await getSyncDb()).put(SNAPSHOT, s, "first");
  } catch {
    /* best effort */
  }
}
export async function loadSnapshot(): Promise<Snapshot | null> {
  try {
    return ((await (await getSyncDb()).get(SNAPSHOT, "first")) as Snapshot | undefined) ?? null;
  } catch {
    return null;
  }
}
export async function clearSnapshot(): Promise<void> {
  try {
    await (await getSyncDb()).delete(SNAPSHOT, "first");
  } catch {
    /* best effort */
  }
}
