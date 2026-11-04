// Phase 17: unit tests never see a real service credential, even if the shell that runs them has one. Nothing here may open a
// database or call Cloudinary, Google or Resend; tests/syncFoundation.test.ts checks these are unset.
for (const k of [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CLOUDINARY_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
]) {
  Reflect.deleteProperty(process.env, k);
}
