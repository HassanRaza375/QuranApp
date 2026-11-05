// Phase 17: the feature flag for Account & Sync. With it off the app makes no request to /api/sync, /api/auth or /api/avatar and
// /api/health never touches the database. It is read at build time (nuxt.config.ts: the prerendered pages carry the config in their
// HTML) and again by the server at request time, where Nuxt's NUXT_PUBLIC_SYNC_ENABLED override arrives already parsed ("1" becomes 1,
// "true" becomes true). Pure.

/** On only for an explicit 1 or true (string, number or boolean); anything else, including unset, is off. */
export function isSyncOn(value: unknown): boolean {
  if (value === true || value === 1) return true;
  return typeof value === "string" && /^(1|true)$/i.test(value.trim());
}

export const syncEnabled = (env: Record<string, string | undefined>): boolean => isSyncOn(env.NUXT_PUBLIC_SYNC_ENABLED);
