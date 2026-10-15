// The revamp's own IndexedDB database. ALL new IndexedDB data lives here, never in the legacy `quran-app-db`:
// that database is not opened, changed or version-bumped by the revamp, so rolling back to the legacy app stays safe
// (CLAUDE.md rule 9). Its version is the revamp's own and only ever goes up through `upgrade`.
import { openDB, type IDBPDatabase } from "idb";
import type { PrayerMonthRecord } from "~/lib/prayerMonth";

export const REVAMP_DB_NAME = "quran-revamp-db";
export const REVAMP_DB_VERSION = 1;
export const PRAYER_MONTHS = "prayer-months";

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getRevampDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(REVAMP_DB_NAME, REVAMP_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PRAYER_MONTHS)) db.createObjectStore(PRAYER_MONTHS);
    },
  });
  return dbPromise;
}

/** Tests: close and forget the cached connection so a fresh database can be opened. */
export async function resetRevampDbForTests() {
  const p = dbPromise;
  dbPromise = null;
  if (p) (await p.catch(() => null))?.close();
}

export async function getPrayerMonth(key: string): Promise<PrayerMonthRecord | undefined> {
  try {
    return (await (await getRevampDb()).get(PRAYER_MONTHS, key)) as PrayerMonthRecord | undefined;
  } catch {
    return undefined; // IndexedDB can be unavailable (private mode, blocked data): the cache is never load-bearing
  }
}

/**
 * Stores a complete month under its key in ONE readwrite transaction: the new record replaces the old one in a single
 * step, or (if the transaction fails or aborts) the old record stays exactly as it was. Throws on failure.
 */
export async function putPrayerMonth(record: PrayerMonthRecord): Promise<void> {
  const db = await getRevampDb();
  const tx = db.transaction(PRAYER_MONTHS, "readwrite");
  await Promise.all([tx.store.put(record, record.key), tx.done]);
}

/** Removes cached months older than `keepFromMonth` ("YYYY-MM"). Best effort. */
export async function pruneOldPrayerMonths(keepFromMonth: string): Promise<number> {
  try {
    const db = await getRevampDb();
    const tx = db.transaction(PRAYER_MONTHS, "readwrite");
    let removed = 0;
    let cursor = await tx.store.openCursor();
    while (cursor) {
      const rec = cursor.value as PrayerMonthRecord;
      if (typeof rec.month === "string" && rec.month < keepFromMonth) {
        await cursor.delete();
        removed++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return removed;
  } catch {
    return 0;
  }
}
