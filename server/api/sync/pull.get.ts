// Phase 17C: the records that changed after `since`, oldest first. The user comes from the session; nothing in the request names one.
import { createError, getQuery } from "h3";
import { LIMITS } from "../../../app/lib/sync/namespaces";
import { allowRequest } from "../../utils/rateLimit";
import { requireUser } from "../../utils/session";
import { parseRevision, pull } from "../../utils/syncHandlers";
import { prismaSyncRepo } from "../../utils/syncRepo";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  if (!(await allowRequest(`sync:pull:${user.id}`, 60, LIMITS.pullsPerMinute))) throw createError({ statusCode: 429, statusMessage: "Too many requests", data: { error: "rate_limited" } });
  const q = getQuery(event);
  const since = parseRevision(q.since ?? "0");
  if (since === null) throw createError({ statusCode: 400, statusMessage: "Bad request", data: { error: "bad_since" } });
  const limit = Math.max(1, Math.min(Number(q.limit) || LIMITS.pullLimit, LIMITS.pullLimit));
  return pull(prismaSyncRepo(), user.id, since, limit);
});
