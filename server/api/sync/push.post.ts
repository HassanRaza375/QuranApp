// Phase 17C: a batch of changes. Each op is checked against its namespace's schema and the caps, and refused as stale when the record has moved on since the
// device last saw it (the device then pulls, merges and pushes again). The user comes from the session.
import { createError, getHeader, readBody } from "h3";
import { z } from "zod";
import { LIMITS } from "../../../app/lib/sync/namespaces";
import { allowRequest } from "../../utils/rateLimit";
import { apiHandler, requireUser } from "../../utils/session";
import { push } from "../../utils/syncHandlers";
import { prismaSyncRepo } from "../../utils/syncRepo";

const body = z.object({
  deviceId: z.string().max(64).optional(),
  ops: z
    .array(z.object({ namespace: z.string().max(64), recordKey: z.string().max(LIMITS.keyLength), baseRevision: z.union([z.string(), z.number()]), payload: z.json().nullable() }))
    .max(LIMITS.requestOps),
});

export default apiHandler(async (event) => {
  const user = await requireUser(event);
  const length = Number(getHeader(event, "content-length") ?? 0);
  if (length > LIMITS.requestBytes) throw createError({ statusCode: 413, statusMessage: "Too large", data: { error: "too_large" } });
  if (!(await allowRequest(`sync:push:${user.id}`, 60, LIMITS.pushesPerMinute))) throw createError({ statusCode: 429, statusMessage: "Too many requests", data: { error: "rate_limited" } });
  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Bad request", data: { error: "bad_body" } });
  return push(prismaSyncRepo(), user.id, parsed.data.ops);
});
