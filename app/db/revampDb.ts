// The revamp's own IndexedDB database. ALL new IndexedDB data lives here, never in the legacy `quran-app-db`:
// that database is not opened, changed or version-bumped by the revamp, so rolling back to the legacy app stays safe
// (CLAUDE.md rule 9). Its version is the revamp's own and only ever goes up through `upgrade`.
import { openDB, type IDBPDatabase } from "idb";
import type { PrayerMonthRecord } from "~/lib/prayerMonth";

export const REVAMP_DB_NAME = "quran-revamp-db";
// Version 2 (Phase 4A) adds the reader's text caches; version 3 (Phase 6) adds `ayah-text`, the Library's ayah snippets. Upgrades only ever create stores; nothing is changed or removed.
export const REVAMP_DB_VERSION = 3;
export const PRAYER_MONTHS = "prayer-months";
export const CHAPTERS = "chapters"; // key: surah number
export const TAFSIRS = "tafsirs"; // key: "<surah>_<ayah>"
export const AYAH_TEXT = "ayah-text"; // key: "<surah>:<ayah>", value: the Arabic text of that one ayah

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getRevampDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(REVAMP_DB_NAME, REVAMP_DB_VERSION, {
    upgrade(db) {
      for (const name of [PRAYER_MONTHS, CHAPTERS, TAFSIRS, AYAH_TEXT]) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
    },
    // Another tab asked to delete or upgrade the database (Clear all data): let go of it so that request is not blocked.
    blocking() {
      void closeRevampDb();
    },
  });
  return dbPromise;
}

/** Closes and forgets the cached connection (before deleting the database, and in tests). */
export async function closeRevampDb() {
  const p = dbPromise;
  dbPromise = null;
  if (p) (await p.catch(() => null))?.close();
}
export const resetRevampDbForTests = closeRevampDb;

/** Deletes a whole database by name. Resolves when done, when it errors, or after a short wait if another tab still holds it. */
export function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      const done = () => resolve();
      req.onsuccess = req.onerror = done;
      req.onblocked = () => setTimeout(done, 3000);
    } catch {
      resolve();
    }
  });
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

// ---- the reader's text caches (immutable text: fetched once, read from here afterwards). Never load-bearing: every
// read returns undefined and every write is dropped quietly when IndexedDB is unavailable or full.
export async function getCached<T>(store: typeof CHAPTERS | typeof TAFSIRS | typeof AYAH_TEXT, key: number | string): Promise<T | undefined> {
  try {
    return (await (await getRevampDb()).get(store, key)) as T | undefined;
  } catch {
    return undefined;
  }
}

export async function putCached(store: typeof CHAPTERS | typeof TAFSIRS | typeof AYAH_TEXT, key: number | string, value: unknown): Promise<void> {
  try {
    await (await getRevampDb()).put(store, value, key);
  } catch {
    /* best effort */
  }
}
