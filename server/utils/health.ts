// Phase 17A: what GET /api/health reports. Pure apart from the probe it is given, so the unit tests run it with fakes and no database.
// With sync off it never touches the database. It names no host, user or error text (the error could carry connection details).

export type DbState = "up" | "down";

export interface HealthInput {
  enabled: boolean;
  configured: boolean;
  /** is the database answering? (cached: see `cachedProbe`) */
  probe: () => Promise<DbState>;
}

export type Health =
  | { status: 200; body: { ok: true; sync: "off" } }
  | { status: 200; body: { ok: true; sync: "on"; db: "up" } }
  | { status: 503; body: { ok: false; sync: "on"; db: "unconfigured" | "down" } };

export async function healthReport({ enabled, configured, probe }: HealthInput): Promise<Health> {
  if (!enabled) return { status: 200, body: { ok: true, sync: "off" } };
  if (!configured) return { status: 503, body: { ok: false, sync: "on", db: "unconfigured" } };
  return (await probe()) === "up" ? { status: 200, body: { ok: true, sync: "on", db: "up" } } : { status: 503, body: { ok: false, sync: "on", db: "down" } };
}

/** One ping with a time limit: "up" when it resolves in time, "down" when it rejects or does not answer (the error goes to `onError`). Never throws. */
export async function pingOnce(ping: () => Promise<unknown>, timeoutMs = 6000, onError?: (err: unknown) => void): Promise<DbState> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([ping(), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("timeout")), timeoutMs)))]);
    return "up";
  } catch (err) {
    try {
      onError?.(err);
    } catch {
      /* logging must never change the answer */
    }
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

export const HEALTH_CACHE_MS = 30_000;

/**
 * The probe the route uses: the last result ("up" or "down") is kept for `ttlMs` per server instance, and requests that arrive while a
 * ping is running share it, so repeated or concurrent requests open no extra connections (the Aiven free plan allows 20).
 */
export function cachedProbe(
  ping: () => Promise<unknown>,
  { ttlMs = HEALTH_CACHE_MS, timeoutMs = 6000, now = Date.now, onError }: { ttlMs?: number; timeoutMs?: number; now?: () => number; onError?: (err: unknown) => void } = {},
) {
  let last: { at: number; db: DbState } | null = null;
  let running: Promise<DbState> | null = null;
  return (): Promise<DbState> => {
    if (last && now() - last.at < ttlMs) return Promise.resolve(last.db);
    running ??= pingOnce(ping, timeoutMs, onError).then((db) => {
      last = { at: now(), db };
      running = null;
      return db;
    });
    return running;
  };
}
