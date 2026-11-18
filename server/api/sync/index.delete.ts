// Phase 17C: "Remove synced data": every record of the signed-in user's account, in one transaction. The account itself stays.
import { apiHandler, requireUser } from "../../utils/session";
import { prismaSyncRepo } from "../../utils/syncRepo";

export default apiHandler(async (event) => {
  const user = await requireUser(event);
  return { ok: true, ...(await prismaSyncRepo().removeAll(user.id)) };
});
