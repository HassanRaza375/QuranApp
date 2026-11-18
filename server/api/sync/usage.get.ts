// Phase 17C: how much of the account's allowance is used, for the Account area.
import { LIMITS } from "../../../app/lib/sync/namespaces";
import { requireUser } from "../../utils/session";
import { prismaSyncRepo } from "../../utils/syncRepo";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const u = await prismaSyncRepo().usage(user.id);
  return { records: u.records, bytes: u.bytes, limitBytes: LIMITS.userBytes, revision: u.revision.toString() };
});
