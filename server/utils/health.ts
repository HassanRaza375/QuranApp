// Phase 17A: what GET /api/health reports. Pure apart from the `ping` it is given, so the unit tests run it with fakes and no database.
// With sync off it never touches the database. It names no host, user or error text (the error could carry connection details).

export interface HealthInput {
  enabled: boolean;
  configured: boolean;
  /** resolves when the database answered, rejects otherwise */
  ping: () => Promise<unknown>;
  timeoutMs?: number;
}

export type Health =
  | { status: 200; body: { ok: true; sync: "off" } }
  | { status: 200; body: { ok: true; sync: "on"; db: "up" } }
  | { status: 503; body: { ok: false; sync: "on"; db: "unconfigured" | "down" } };

export async function healthReport({ enabled, configured, ping, timeoutMs = 6000 }: HealthInput): Promise<Health> {
  if (!enabled) return { status: 200, body: { ok: true, sync: "off" } };
  if (!configured) return { status: 503, body: { ok: false, sync: "on", db: "unconfigured" } };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([ping(), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("timeout")), timeoutMs)))]);
    return { status: 200, body: { ok: true, sync: "on", db: "up" } };
  } catch {
    return { status: 503, body: { ok: false, sync: "on", db: "down" } };
  } finally {
    clearTimeout(timer);
  }
}
