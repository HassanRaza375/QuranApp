// Phase 17F: after the browser's upload, remember the photo's version. The version is asked of Cloudinary, never taken from the browser's word.
import { createError } from "h3";
import { avatarPublicId, storedAvatarVersion } from "../../utils/avatar";
import { useDb } from "../../utils/db";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const version = await storedAvatarVersion(user.id);
  if (version === null) throw createError({ statusCode: 400, statusMessage: "Bad request", data: { error: "no_photo" } });
  await useDb().user.update({ where: { id: user.id }, data: { avatarPublicId: avatarPublicId(user.id), avatarVersion: version } });
  return { ok: true, version };
});
