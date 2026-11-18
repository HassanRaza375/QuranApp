// Phase 17F: removes the user's photo (Cloudinary, then the record). The account keeps its geometric default.
import { destroyAvatar } from "../../utils/avatar";
import { useDb } from "../../utils/db";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  await destroyAvatar(user.avatarPublicId);
  await useDb().user.update({ where: { id: user.id }, data: { avatarPublicId: null, avatarVersion: null } });
  return { ok: true };
});
