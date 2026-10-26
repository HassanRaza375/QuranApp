// The Daily Fiqh reader's state: the chosen marja' and the reading language (both on the legacy `quran:fiqh-prefs:v1` record, through the one preferences store) and the
// bookmark of a topic. The data itself comes from `~/lib/fiqh/data`; the rules about what is shown are in `~/lib/fiqh/visibility`.
import type { MarjaId } from "@legacy/data/wajibat/types";
import { getMarjaById } from "~/lib/fiqh/data";
import type { FiqhLang } from "~/lib/fiqh/visibility";

export function useFiqh() {
  const store = usePreferencesStore();
  const marjaId = computed(() => store.prefs.marjaId as MarjaId | null);
  const marja = computed(() => getMarjaById(marjaId.value));
  const lang = computed<FiqhLang>(() => store.prefs.fiqhLang);
  const isSunni = computed(() => store.prefs.fiqh !== "jafari");
  return {
    marjaId,
    marja,
    lang,
    isSunni,
    loaded: computed(() => store.loaded),
    setMarja: (id: MarjaId | null) => store.set("marjaId", id),
    setLang: (l: FiqhLang) => store.set("fiqhLang", l),
  };
}
