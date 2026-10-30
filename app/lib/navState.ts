// Which nav groups are open. A per-viewer convenience kept in `quran:nav-open:v1` (new, additive). Read is open by
// default; the group that holds the current page is always opened so the active item is never hidden.
export const NAV_OPEN_KEY = "quran:nav-open:v1";
export const NAV_GROUP_IDS = ["read", "study", "knowledge", "worship"] as const;

export type NavOpen = Record<string, boolean>;

export function normalizeNavOpen(raw: unknown): NavOpen {
  const out: NavOpen = { read: true };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const id of NAV_GROUP_IDS) {
      const v = (raw as Record<string, unknown>)[id];
      if (typeof v === "boolean") out[id] = v;
    }
  }
  return out;
}
