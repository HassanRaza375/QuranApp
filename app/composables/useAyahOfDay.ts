// Ayah of the day for Home. Same storage key and shape as the legacy app (see app/lib/ayahOfDay.ts), chosen
// deterministically from the local date, text from the existing verse service only.
import { AYAH_OF_DAY_KEY, buildPool, dataFromVerse, isEntryFor, makeEntry, pickAyahForDate, readEntry, type AyahOfDayEntry } from "~/lib/ayahOfDay";
import { addBookmark, ayahBookmarkKey, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { localDateKey } from "~/lib/dates";
import { getJSON, setJSON } from "~/lib/storage";
import { VerseService } from "~/services/verse.service";

type Status = "loading" | "ready" | "stale" | "unavailable";

export const useAyahOfDay = () => {
  const status = useState<Status>("ayah-status", () => "loading");
  const entry = useState<AyahOfDayEntry | null>("ayah-entry", () => null);
  const saved = useState<boolean>("ayah-saved", () => false);

  const refreshSaved = () => {
    saved.value = entry.value ? hasBookmark(ayahBookmarkKey(entry.value.data.surah_number, entry.value.data.ayah_number)) : false;
  };

  async function load() {
    status.value = "loading";
    const today = localDateKey(new Date());
    const stored = readEntry(getJSON<unknown>(AYAH_OF_DAY_KEY, null));
    if (stored && isEntryFor(stored, today)) {
      entry.value = stored;
      status.value = "ready";
      refreshSaved();
      return;
    }
    try {
      const { AYAH_LENGTHS } = await import("~/data/ayahLengths.generated");
      const { surah, ayah } = pickAyahForDate(today, AYAH_LENGTHS, buildPool(AYAH_LENGTHS));
      const json = (await VerseService.getVerseByNumber(surah, ayah)) as Record<string, unknown>;
      const fresh = makeEntry(dataFromVerse(json, surah, ayah), new Date());
      if (!fresh.data.arabic || !fresh.data.translation) throw new Error("the verse came back empty");
      setJSON(AYAH_OF_DAY_KEY, fresh);
      entry.value = fresh;
      status.value = "ready";
    } catch (e) {
      console.debug("[ayah-of-day] could not load today's ayah:", e);
      // Offline or the service failed: show the last saved ayah, clearly marked, or say a connection is needed.
      entry.value = stored;
      status.value = stored ? "stale" : "unavailable";
    }
    refreshSaved();
  }

  /** Adds or removes the bookmark. Returns what happened so the caller can offer Undo. */
  function toggleSaved(): "added" | "removed" | null {
    if (!entry.value) return null;
    const key = ayahBookmarkKey(entry.value.data.surah_number, entry.value.data.ayah_number);
    if (hasBookmark(key)) {
      removeBookmark(key);
      saved.value = false;
      return "removed";
    }
    addBookmark(key);
    saved.value = true;
    return "added";
  }

  function setSaved(on: boolean) {
    if (!entry.value) return;
    const key = ayahBookmarkKey(entry.value.data.surah_number, entry.value.data.ayah_number);
    if (on) addBookmark(key);
    else removeBookmark(key);
    saved.value = on;
  }

  return { status, entry, saved, load, toggleSaved, setSaved };
};
