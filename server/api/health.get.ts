// Phase 17A: is the sync server reachable? { ok, sync: "off" } while the flag is off (no database touched), otherwise a `SELECT 1`
// whose result is kept for 30 s per server instance (server/utils/health.ts). Cache-Control: no-store comes from the /api/** route rule.
// A failure is logged to the server log only (at most once per 30 s, with the probe), as error codes plus a message with the URI,
// host, user and password removed (dbFailureLine); the answer itself stays { ok, sync, db }.
import { isSyncOn } from "../../app/lib/sync/flag";
import { hasDatabase, useDb } from "../utils/db";
import { dbFailureLine } from "../utils/dbConfig";
import { cachedProbe, healthReport } from "../utils/health";

const probe = cachedProbe(() => useDb().$queryRaw`SELECT 1`, { onError: (err) => console.error(dbFailureLine(err, process.env.DATABASE_URL)) });

export default defineEventHandler(async (event) => {
  const { status, body } = await healthReport({
    enabled: isSyncOn(useRuntimeConfig(event).public.syncEnabled),
    configured: hasDatabase(),
    probe,
  });
  setResponseStatus(event, status);
  return body;
});
