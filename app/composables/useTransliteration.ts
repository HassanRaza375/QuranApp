// The reader's transliteration: the on/off setting (`quran:reader-prefs:v1`, field `transliteration`), the lines of every surah the open view needs, and a lookup
// by ayah key, so the Surah reader and the Page reader share one implementation (a page can hold the end of one surah and the start of the next).
// The data is loaded only while the setting is on, one request per surah, cache first (quran-revamp-db `transliterations`). Rules and failures: `lib/transliteration.ts`.
import { getCached, putCached, TRANSLITERATIONS } from "~/db/revampDb";
import { loadTransliteration, transliterationOf, type SurahTransliteration, type TransliterationDeps } from "~/lib/transliteration";
import { readReaderPrefs, setTransliterationOn } from "~/lib/readerPrefs";
import { TransliterationService } from "~/services/transliteration.service";

const deps: TransliterationDeps = {
  read: (n) => getCached(TRANSLITERATIONS, n),
  write: (n, lines) => putCached(TRANSLITERATIONS, n, lines),
  fetch: (n) => TransliterationService.surah(n),
};

// Shared by every view in the visit (module state; the app is a single-page app, and the setting is read on the client only).
const enabled = ref(false);
const lines = shallowRef<Record<number, SurahTransliteration | undefined>>({});
const pending = ref(0);
const failed = ref(false);
const inFlight = new Map<number, Promise<void>>();
let hydrated = false;

async function loadSurah(n: number): Promise<void> {
  if (lines.value[n]) return;
  let p = inFlight.get(n);
  if (!p) {
    p = loadTransliteration(n, deps)
      .then((r) => {
        lines.value = { ...lines.value, [n]: r.value };
      })
      .finally(() => inFlight.delete(n)); // a failure is not remembered: the next try asks again
    inFlight.set(n, p);
  }
  return p;
}

export const useTransliteration = () => {
  if (import.meta.client && !hydrated) {
    hydrated = true;
    enabled.value = readReaderPrefs().transliteration === true;
  }

  /** Loads the given surahs when the setting is on (does nothing when it is off). Never throws: a failure sets `unavailable`. */
  async function ensure(surahs: number[]): Promise<void> {
    if (!enabled.value) return;
    const wanted = [...new Set(surahs)].filter((n) => !lines.value[n]);
    if (!wanted.length) {
      failed.value = false;
      return;
    }
    pending.value += 1;
    try {
      const results = await Promise.allSettled(wanted.map(loadSurah));
      failed.value = results.some((r) => r.status === "rejected");
    } finally {
      pending.value -= 1;
    }
  }

  return {
    enabled: readonly(enabled),
    /** the lines loaded so far, by surah number (a lookup for views that pass a whole surah down) */
    lines: readonly(lines) as Readonly<Ref<Record<number, SurahTransliteration | undefined>>>,
    /** a request is in flight */
    loading: computed(() => pending.value > 0),
    /** the last attempt could not load (offline, a server error): the view says so and offers to try again by toggling or reloading */
    unavailable: computed(() => enabled.value && failed.value && pending.value === 0),
    /** one ayah's line, null when its surah is not loaded or it has no text */
    get: (surah: number, ayah: number): string | null => transliterationOf(lines.value, surah, ayah),
    ensure,
    /** turns it on or off, saves the choice, and (on) loads the surahs the view needs */
    async setEnabled(on: boolean, surahs: number[] = []): Promise<void> {
      enabled.value = on;
      setTransliterationOn(on);
      if (!on) failed.value = false;
      await ensure(surahs);
    },
  };
};
