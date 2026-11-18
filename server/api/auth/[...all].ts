// Phase 17B: Better Auth's endpoints (sign up, sign in, sign out, session, Google, delete account), under /api/auth/*. 404 while the flag is off.
import { toWebRequest } from "h3";
import { useAuth } from "../../utils/auth";
import { requireEnabled } from "../../utils/session";

export default defineEventHandler(async (event) => {
  requireEnabled(event);
  return useAuth().handler(toWebRequest(event));
});
