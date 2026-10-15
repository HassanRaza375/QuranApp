// The one place that touches localStorage. Never call `localStorage` directly elsewhere.
//
// The legacy app stores most values as JSON but six keys as RAW strings (`prayerFiqh`, `themeMode`,
// `preferredVerseDisplay`, `translationDefaultLang`, `tafsirDefaultAuthor`, and the value of any future
// raw key). Reading a raw string through JSON.parse would silently fail, so JSON and raw access are
// separate on purpose (see docs/phases/phase-00-foundation.md, "Storage key inventory").
//
// Every call is wrapped: storage can throw (private mode, blocked site data, quota) and must never
// break the page.

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Optional on fakes; the real localStorage is listed with Object.keys. */
  keys?(): string[];
  clear?(): void;
}

let override: KeyValueStore | null = null;

/** Tests inject a fake store; production uses window.localStorage. */
export function setStorageBackend(store: KeyValueStore | null) {
  override = store;
}

function backend(): KeyValueStore | null {
  if (override) return override;
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function getRaw(key: string): string | null {
  try {
    return backend()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function setRaw(key: string, value: string): boolean {
  try {
    const b = backend();
    if (!b) return false;
    b.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Every key currently stored (used by Export). Empty when storage is unavailable. */
export function listKeys(): string[] {
  try {
    const b = backend();
    if (!b) return [];
    return typeof b.keys === "function" ? b.keys() : Object.keys(b);
  } catch {
    return [];
  }
}

/** Removes every key: exactly what the legacy "Clear all" does (`localStorage.clear()`). Returns false if storage is unavailable. */
export function clearAllKeys(): boolean {
  try {
    const b = backend();
    if (!b) return false;
    if (typeof b.clear === "function") b.clear();
    else for (const k of listKeys()) b.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    backend()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Same behaviour as the legacy `$storage.get`: parsed JSON, or the fallback when absent or unparseable. */
export function getJSON<T>(key: string, fallback: T): T {
  const raw = getRaw(key);
  if (raw === null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): boolean {
  return setRaw(key, JSON.stringify(value));
}

/**
 * Read-merge-write for a JSON object shared by several settings (e.g. `quran:accessibility:v1`,
 * `quran:audio-prefs:v1`): fields this app does not know about are kept, never dropped.
 */
export function mergeJSON(key: string, patch: Record<string, unknown>): boolean {
  const current = getJSON<Record<string, unknown> | null>(key, null);
  const base = current && typeof current === "object" && !Array.isArray(current) ? current : {};
  return setJSON(key, { ...base, ...patch });
}
