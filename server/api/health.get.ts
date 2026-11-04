// Phase 17A: is the sync server reachable? { ok, sync: "off" } while the flag is off (no database touched), otherwise a `SELECT 1`.
// Cache-Control: no-store comes from the /api/** route rule (nuxt.config.ts).
import { isSyncOn } from "../../app/lib/sync/flag";
import { hasDatabase, useDb } from "../utils/db";
import { healthReport } from "../utils/health";

export default defineEventHandler(async (event) => {
  const { status, body } = await healthReport({
    enabled: isSyncOn(useRuntimeConfig(event).public.syncEnabled),
    configured: hasDatabase(),
    ping: () => useDb().$queryRaw`SELECT 1`,
  });
  setResponseStatus(event, status);
  return body;
});
