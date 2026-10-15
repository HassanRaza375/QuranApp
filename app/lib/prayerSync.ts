// Fetch a prayer month, validate it, and swap it into the cache. Dependencies are injected so the logic is tested
// without a network or a real database.
//
// Guarantees:
//  - nothing is stored unless the response passes every check (`normalizeMonthResponse`);
//  - the swap is one `put` of the whole record (see putPrayerMonth), so the old month is replaced all at once or not at all;
//  - on ANY failure the cached month (if there is one) is returned unchanged;
//  - one request per key at a time.
import { monthUrl, normalizeMonthResponse, prayerMonthKey, type PrayerMonthRecord, type PrayerRequest } from "./prayerMonth";

export const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export interface SyncDeps {
  base: string;
  fetchJson(url: string): Promise<unknown>;
  get(key: string): Promise<PrayerMonthRecord | undefined>;
  put(record: PrayerMonthRecord): Promise<void>;
  now(): number;
}

export type SyncOutcome =
  | { status: "cached"; record: PrayerMonthRecord }
  | { status: "updated"; record: PrayerMonthRecord }
  | { status: "failed"; kind: "offline" | "error"; reason: string; record?: PrayerMonthRecord };

const inflight = new Map<string, Promise<SyncOutcome>>();

export function syncMonth(deps: SyncDeps, req: PrayerRequest, opts: { force?: boolean } = {}): Promise<SyncOutcome> {
  const key = prayerMonthKey(req);
  const running = inflight.get(key);
  if (running) return running;
  const p = run(deps, req, key, !!opts.force).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function run(deps: SyncDeps, req: PrayerRequest, key: string, force: boolean): Promise<SyncOutcome> {
  const cached = await deps.get(key);
  if (cached && !force && deps.now() - cached.fetchedAt < STALE_AFTER_MS) return { status: "cached", record: cached };

  let json: unknown;
  try {
    json = await deps.fetchJson(monthUrl(deps.base, req));
  } catch (e) {
    const offline = (typeof navigator !== "undefined" && navigator.onLine === false) || e instanceof TypeError;
    return { status: "failed", kind: offline ? "offline" : "error", reason: e instanceof Error ? e.message : String(e), record: cached };
  }

  const result = normalizeMonthResponse(json, req, deps.now());
  if (!result.ok) return { status: "failed", kind: "error", reason: result.reason, record: cached };

  try {
    await deps.put(result.record);
  } catch (e) {
    return { status: "failed", kind: "error", reason: `could not save the times (${e instanceof Error ? e.message : String(e)})`, record: cached };
  }
  return { status: "updated", record: result.record };
}
