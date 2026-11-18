// Phase 17B and C: the browser side of Account & Sync, as one reactive object (`account`) and the actions on it. It is loaded only through a dynamic import,
// and only when the flag is on (app/plugins/sync.client.ts, the Account components), so with the flag off no byte of it is fetched and no request is made.
//
//   - Accounts talk to Better Auth's REST endpoints (/api/auth/*) with plain fetch: the session is an httpOnly cookie that the browser sends by itself.
//   - Sync runs `syncOnce` (engine.ts) when someone signs in, a moment after a synced key changes, when the tab regains focus or goes online, and every
//     couple of minutes while it is open. One tab at a time (navigator.locks).
//   - Nothing here ever reads or writes a key outside the adapters and the `quran:sync-prefs:v1` toggles.
import { toast } from "vue-sonner";
import { reactive } from "vue";
import { clearSnapshot, closeSyncDb, loadSnapshot, loadSyncState, saveSnapshot, saveSyncState, SYNC_DB_NAME } from "~/db/syncDb";
import { deleteDatabase } from "~/db/revampDb";
import { SYNCED_KEYS } from "./adapters";
import { syncApi } from "./api";
import { categoriesAdapter, CATEGORIES, enabledCategories, readChoice, SYNC_PREFS_KEY, writeChoice, type Choice } from "./categories";
import { emptyState, syncOnce, type SyncReport } from "./engine";
import type { Category } from "./namespaces";
import { realStore } from "./realStore";
import { setStorageListener } from "../storage";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  avatarPublicId?: string | null;
  avatarVersion?: number | null;
}
export interface AccountConfig {
  google: boolean;
  email: { verification: boolean; reset: boolean };
  avatar: { cloudName: string } | null;
}
export type SyncPhase = "idle" | "syncing" | "unavailable";

export const account = reactive({
  /** loading: not asked yet · off: the server has sync off · signedOut · signedIn · unavailable: the server cannot be reached */
  phase: "loading" as "loading" | "off" | "signedOut" | "signedIn" | "unavailable",
  user: null as AccountUser | null,
  config: null as AccountConfig | null,
  choice: null as Choice | null,
  sync: { phase: "idle" as SyncPhase, lastSyncedAt: null as number | null, usage: null as null | { records: number; bytes: number; limitBytes: number } },
  busy: false,
  error: "",
});

const UNDO_MS = 10_000;
const DEBOUNCE_MS = 2_000;
const INTERVAL_MS = 120_000;

let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;
let again = false;

type Json = Record<string, unknown> | null;
async function call(method: string, path: string, body?: unknown): Promise<{ status: number; json: Json }> {
  let res: Response;
  try {
    res = await fetch(path, { method, credentials: "same-origin", headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    return { status: 0, json: null };
  }
  let json: Json = null;
  try {
    json = (await res.json()) as Json;
  } catch {
    /* an empty or non-JSON answer */
  }
  return { status: res.status, json };
}

/** A person-readable reason for a failed auth call. Better Auth's own message is used when it is plain; nothing is ever echoed from the server's internals. */
function reason(status: number, json: Json): string {
  if (status === 0) return "Can’t reach the server right now. Check your connection and try again.";
  if (status === 429) return "Too many attempts. Wait a minute and try again.";
  if (status >= 500) return "Can’t reach the server right now. Try again in a moment.";
  const msg = typeof json?.message === "string" ? json.message : "";
  if (/invalid email or password/i.test(msg)) return "That email and password don’t match.";
  if (/already exists|already registered/i.test(msg)) return "An account with this email already exists. Sign in instead.";
  if (/password/i.test(msg) && /short|long|length/i.test(msg)) return "Use a password of 8 to 128 characters.";
  if (/email/i.test(msg) && /invalid/i.test(msg)) return "Enter a valid email address.";
  if (/verif/i.test(msg)) return "Confirm your email first: we sent you a link.";
  return "Something went wrong. Check what you entered and try again.";
}

async function loadSession(): Promise<void> {
  const r = await call("GET", "/api/auth/get-session");
  if (r.status === 404) {
    account.phase = "off";
    return;
  }
  if (r.status === 0 || r.status >= 500) {
    if (account.phase === "loading") account.phase = "unavailable";
    return;
  }
  const user = (r.json?.user ?? null) as AccountUser | null;
  account.user = user;
  account.phase = user ? "signedIn" : "signedOut";
  account.choice = readChoice(realStore);
}

export async function loadConfig(): Promise<void> {
  const r = await call("GET", "/api/account/config");
  if (r.status === 200) account.config = r.json as unknown as AccountConfig;
}

// ---- reloading what is already on screen after a pull
async function reloadStores(keys: string[]): Promise<void> {
  try {
    const { usePreferencesStore } = await import("~/stores/preferences");
    usePreferencesStore().reloadAll();
  } catch {
    /* no store yet */
  }
  if (keys.some((k) => k === "quran:bookmarks:v1" || k === "quran:library:v1" || k === "quran:pins:v1" || k === "quran:reading-progress:v1")) {
    try {
      const { useLibraryStore } = await import("~/stores/library");
      void useLibraryStore().reload();
    } catch {
      /* not loaded */
    }
  }
  if (keys.includes("quran:reading-goals:v1")) {
    try {
      const { useGoalsStore } = await import("~/stores/goals");
      useGoalsStore().refresh();
    } catch {
      /* not loaded */
    }
  }
  if (keys.includes("quran:hifz:v2") || keys.includes("quran:hifz-words:v1")) {
    try {
      const { useHifzStore } = await import("~/stores/hifz");
      void useHifzStore().load();
    } catch {
      /* not loaded */
    }
  }
  window.dispatchEvent(new CustomEvent("quran:sync-applied", { detail: { keys } }));
}

// ---- one sync round
async function runOnce(): Promise<SyncReport | null> {
  const report = await syncOnce({
    store: realStore,
    state: { load: loadSyncState, save: saveSyncState },
    api: syncApi(),
    categories: () => enabledCategories(realStore) as Set<Category>,
    extra: [categoriesAdapter],
    holdFirstPush: true,
    snapshot: async (keys) => {
      const values: Record<string, string | null> = {};
      for (const k of new Set([...keys, ...SYNCED_KEYS, SYNC_PREFS_KEY])) values[k] = realStore.get(k);
      await saveSnapshot({ takenAt: Date.now(), values });
    },
    onChanged: (keys) => void reloadStores(keys),
  });
  return report;
}

export async function syncNow(): Promise<void> {
  if (account.phase !== "signedIn") return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  account.sync.phase = "syncing";
  try {
    const run = async () => {
      let report = await runOnce();
      if (report?.held) {
        account.sync.lastSyncedAt = (await loadSyncState()).lastSyncedAt;
        account.choice = readChoice(realStore);
        offerUndo(report);
        return;
      }
      if (report?.status === "unauthorized") {
        await loadSession();
        report = null;
      }
      account.sync.phase = report && report.status === "unavailable" ? "unavailable" : "idle";
      const st = await loadSyncState();
      account.sync.lastSyncedAt = st.lastSyncedAt;
      account.choice = readChoice(realStore);
    };
    if (typeof navigator !== "undefined" && navigator.locks) await navigator.locks.request("quran-sync", { ifAvailable: true }, async (lock) => (lock ? run() : undefined));
    else await run();
  } finally {
    running = false;
    if (account.sync.phase === "syncing") account.sync.phase = "idle";
    if (again) {
      again = false;
      schedule(500);
    }
  }
}

function schedule(ms = DEBOUNCE_MS) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), ms);
}

// ---- first merge: what was added, with Undo; the push waits until the window closes
function offerUndo(report: SyncReport) {
  const fm = report.firstMerge ?? { fromDevice: 0, fromAccount: 0 };
  const parts = [`${fm.fromAccount} from your account`, `${fm.fromDevice} from this device`];
  const id = toast(`Added ${parts.join(" and ")}`, {
    duration: UNDO_MS,
    action: { label: "Undo", onClick: () => void undoFirstMerge() },
    onDismiss: () => schedule(100),
    onAutoClose: () => schedule(100),
  });
  void id;
}

export async function undoFirstMerge(): Promise<void> {
  const snap = await loadSnapshot();
  if (!snap) return;
  const { silently } = await import("../storage");
  silently(() => {
    for (const [k, v] of Object.entries(snap.values)) {
      if (v === null) realStore.remove(k);
      else realStore.set(k, v);
    }
  });
  writeChoice(realStore, null); // sync is off on this device again; the account was never changed (nothing was pushed)
  await saveSyncState(emptyState((await loadSyncState()).deviceId));
  await clearSnapshot();
  account.choice = null;
  await reloadStores(Object.keys(snap.values));
  toast("Undone. This device is as it was, and sync is off here.");
}

// ---- the three toggles
export async function setCategory(cat: Category, on: boolean): Promise<void> {
  const cur = readChoice(realStore) ?? { library: false, progress: false, settings: false };
  writeChoice(realStore, { ...cur, [cat]: on });
  account.choice = readChoice(realStore);
  schedule(100);
}
export async function chooseCategories(choice: Choice): Promise<void> {
  writeChoice(realStore, choice);
  account.choice = readChoice(realStore);
  schedule(100);
}

// ---- accounts
async function after(status: number, json: Json): Promise<boolean> {
  if (status !== 200) {
    account.error = reason(status, json);
    return false;
  }
  account.error = "";
  await loadSession();
  schedule(300);
  return true;
}

export async function signUp(name: string, email: string, password: string): Promise<boolean> {
  account.busy = true;
  try {
    const r = await call("POST", "/api/auth/sign-up/email", { name, email, password });
    return await after(r.status, r.json);
  } finally {
    account.busy = false;
  }
}
export async function signIn(email: string, password: string): Promise<boolean> {
  account.busy = true;
  try {
    const r = await call("POST", "/api/auth/sign-in/email", { email, password });
    return await after(r.status, r.json);
  } finally {
    account.busy = false;
  }
}
export async function signInWithGoogle(): Promise<void> {
  const r = await call("POST", "/api/auth/sign-in/social", { provider: "google", callbackURL: `${location.origin}/settings?section=account` });
  const url = (r.json as { url?: string } | null)?.url;
  if (r.status === 200 && url) location.assign(url);
  else account.error = reason(r.status, r.json);
}
export async function requestReset(email: string): Promise<boolean> {
  const r = await call("POST", "/api/auth/request-password-reset", { email, redirectTo: `${location.origin}/settings?section=account` });
  account.error = r.status === 200 ? "" : reason(r.status, r.json);
  return r.status === 200;
}

/** Forget this device's sync bookkeeping (not the data): the queue, the cursor, the toggles. */
async function forgetSyncState() {
  clearTimeout(timer);
  writeChoice(realStore, null);
  await closeSyncDb();
  await deleteDatabase(SYNC_DB_NAME);
  account.choice = null;
  account.sync.lastSyncedAt = null;
  account.sync.usage = null;
}

export async function signOut(): Promise<void> {
  await call("POST", "/api/auth/sign-out", {});
  await forgetSyncState();
  account.user = null;
  account.phase = "signedOut";
}

/** For "Clear all data": the device signs out too (DECISIONS.md, Phase 17 decision 3). Never throws. */
export async function signOutDevice(): Promise<void> {
  try {
    await call("POST", "/api/auth/sign-out", {});
  } catch {
    /* offline: the cookie ends by itself */
  }
}

export async function deleteAccount(password: string | undefined): Promise<boolean> {
  account.busy = true;
  try {
    const r = await call("POST", "/api/auth/delete-user", password ? { password } : {});
    if (r.status !== 200) {
      account.error = r.status === 400 || r.status === 401 ? "That password doesn’t match." : reason(r.status, r.json);
      return false;
    }
    await forgetSyncState();
    account.user = null;
    account.phase = "signedOut";
    account.error = "";
    return true;
  } finally {
    account.busy = false;
  }
}

export async function removeSyncedData(): Promise<boolean> {
  const r = await call("DELETE", "/api/sync");
  if (r.status !== 200) {
    account.error = reason(r.status, r.json);
    return false;
  }
  // the device keeps its own data; its bookkeeping starts over, so a later sync re-uploads from here
  await saveSyncState(emptyState((await loadSyncState()).deviceId));
  account.sync.usage = null;
  await loadUsage();
  return true;
}

export async function loadUsage(): Promise<void> {
  const r = await call("GET", "/api/sync/usage");
  if (r.status === 200) account.sync.usage = r.json as unknown as { records: number; bytes: number; limitBytes: number };
}

// ---- profile photo (17F)
export interface UploadTicket {
  cloudName: string;
  apiKey: string;
  signature: string;
  fields: Record<string, string>;
}
export async function uploadAvatar(file: Blob): Promise<boolean> {
  account.busy = true;
  try {
    const t = await call("POST", "/api/avatar/sign", {});
    if (t.status !== 200) {
      account.error = t.status === 503 ? "Profile photos aren’t set up on this server." : reason(t.status, t.json);
      return false;
    }
    const ticket = t.json as unknown as UploadTicket;
    const form = new FormData();
    for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
    form.append("api_key", ticket.apiKey);
    form.append("signature", ticket.signature);
    form.append("file", file);
    let up: Response;
    try {
      up = await fetch(`https://api.cloudinary.com/v1_1/${ticket.cloudName}/image/upload`, { method: "POST", body: form });
    } catch {
      account.error = "Couldn’t upload the photo. Check your connection and try again.";
      return false;
    }
    if (!up.ok) {
      account.error = "The photo was not accepted. Use a JPG, PNG or WebP under 2 MB.";
      return false;
    }
    const c = await call("POST", "/api/avatar", {});
    if (c.status !== 200) {
      account.error = reason(c.status, c.json);
      return false;
    }
    await loadSession();
    return true;
  } finally {
    account.busy = false;
  }
}
export async function removeAvatar(): Promise<boolean> {
  const r = await call("DELETE", "/api/avatar");
  if (r.status !== 200) {
    account.error = reason(r.status, r.json);
    return false;
  }
  await loadSession();
  return true;
}

/** The photo's address, or null for the geometric default. The version is part of the URL, so a new photo is a new address. */
export const avatarSrc = (u: AccountUser | null, cloudName: string | undefined): string | null =>
  u?.avatarPublicId && u.avatarVersion && cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/v${u.avatarVersion}/${u.avatarPublicId}` : null;

/** After "can't reach the server": ask again. */
export async function reconnect(): Promise<void> {
  account.phase = "loading";
  await loadConfig();
  await loadSession();
  if (account.phase === "signedIn") schedule(100);
}

// ---- start (once)
export async function startAccount(): Promise<void> {
  if (started) return;
  started = true;
  await loadConfig();
  await loadSession();
  if (account.phase === "off") return;
  setStorageListener((key) => {
    if (account.phase !== "signedIn") return;
    if (key === null || SYNCED_KEYS.includes(key) || key === SYNC_PREFS_KEY) schedule();
  });
  const poke = () => {
    if (document.visibilityState === "visible" && account.phase === "signedIn") schedule(300);
  };
  window.addEventListener("focus", poke);
  window.addEventListener("online", poke);
  document.addEventListener("visibilitychange", poke);
  setInterval(() => {
    if (document.visibilityState === "visible") schedule(100);
  }, INTERVAL_MS);
  if (account.phase === "signedIn") schedule(500);
}

export { CATEGORIES };
