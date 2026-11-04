// Phase 17A: is the sync server reachable? { ok, sync: "off" } while the flag is off (no database touched), otherwise a `SELECT 1`
// whose result is kept for 30 s per server instance (server/utils/health.ts). Cache-Control: no-store comes from the /api/** route rule.
import { isSyncOn } from "../../app/lib/sync/flag";
import { hasDatabase, useDb } from "../utils/db";
import { cachedProbe, healthReport } from "../utils/health";

const probe = cachedProbe(() => useDb().$queryRaw`SELECT 1`);

export default defineEventHandler(async (event) => {
  const { status, body } = await healthReport({
    enabled: isSyncOn(useRuntimeConfig(event).public.syncEnabled),
    configured: hasDatabase(),
    probe,
  });
  setResponseStatus(event, status);
  return body;
});
