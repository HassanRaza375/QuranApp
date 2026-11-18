// Phase 17F: signs one photo upload for the signed-in user (public id fixed to avatars/<their id>, formats and size of the crop fixed). No unsigned preset exists.
import { createError } from "h3";
import { signAvatarUpload } from "../../utils/avatar";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  try {
    return signAvatarUpload(user.id, Date.now());
  } catch {
    throw createError({ statusCode: 503, statusMessage: "Unavailable", data: { error: "not_configured" } });
  }
});
