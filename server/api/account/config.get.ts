// Phase 17B: what the Account area may offer on this server: Google only when its keys are set, email verification and reset only when a mailer is, the
// photo only when Cloudinary is. No secret is returned. 404 while the flag is off.
import { googleKeys } from "../../utils/authConfig";
import { cloudinaryKeys } from "../../utils/avatar";
import { mailerKind } from "../../utils/mailer";
import { requireEnabled } from "../../utils/session";

export default defineEventHandler((event) => {
  requireEnabled(event);
  const cloud = cloudinaryKeys(process.env);
  const mail = mailerKind(process.env) !== null;
  return { google: Boolean(googleKeys(process.env)), email: { verification: mail, reset: mail }, avatar: cloud ? { cloudName: cloud.cloudName } : null };
});
