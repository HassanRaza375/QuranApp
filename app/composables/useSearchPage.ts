// The Search page's behaviour: the typed text and filters (kept in the URL), the instant local groups, the debounced and cancellable ayah
// search, and the recent searches. The rules are in docs/phases/phase-10-search-plan.md and docs/DECISIONS.md:
//  - Surahs, People, Stories and Notes match from one character, at once, with no request;
//  - the ayah search starts at two characters after about 300 ms, cancels the request it replaces, and keeps answers for the session;
//  - a search is saved to the history only after it succeeded (a request that came back with results, or a local result), never after a failure.
import { absolute } from "~/lib/quranMeta";
import { ayahBookmarkKey } from "~/lib/bookmarks";
import { isNumericQuery, parseJump } from "~/lib/ayahJump";
import { createAyahSearcher, MIN_QUERY_CHARS, selectAyahs, type AyahHit } from "~/lib/ayahSearch";
import { addHistory, clearHistory, readHistory, removeHistory, writeHistory } from "~/lib/searchHistory";
import { NO_FILTERS, stateFromQuery, stateToQuery, type SearchState } from "~/lib/searchQuery";
import type { LocalGroup, NoteEntry } from "~/lib/searchLocal";
import { SearchService } from "~/services/search.service";

export type AyahPhase = "idle" | "short" | "loading" | "ok" | "none" | "offline" | "failed";

const DEBOUNCE_MS = 300;
const SETTLE_MS = 1500;

export function useSearchPage() {
  const route = useRoute();
  const router = useRouter();
  const library = useLibraryStore();
  const undo = useUndoToast();

  const state = reactive<SearchState>({ ...stateFromQuery(route.query) });
  const ayah = reactive<{ phase: AyahPhase; hits: AyahHit[]; forQuery: string }>({ phase: "idle", hits: [], forQuery: "" });
  const history = ref<string[]>([]);
  const local = shallowRef<typeof import("~/lib/searchLocal") | null>(null);
  const knowledgeTick = ref(0); // the Duas and Knowledge base groups arrive after the first groups: the list is computed again when they do

  const searcher = createAyahSearcher((q, signal) => SearchService.search(q, signal), () => typeof navigator === "undefined" || navigator.onLine !== false);

  // ---------------------------------------------------------------- local groups (instant)
  const notes = computed<NoteEntry[]>(() =>
    library.notes.map((key) => {
      const item = library.describe(key);
      const m = library.meta(key);
      return { key, title: item.title, note: m.note, tags: m.tags, href: item.href };
    }),
  );
  const localGroups = computed<LocalGroup[]>(() => (local.value && knowledgeTick.value >= 0 && state.q.trim() ? local.value.searchLocal(state.q, { notes: notes.value }) : []));

  // ---------------------------------------------------------------- the ayah search
  const query = computed(() => state.q.trim());
  const jump = computed(() => parseJump(query.value));
  const wantsAyahSearch = (q: string) => [...q].length >= MIN_QUERY_CHARS && !isNumericQuery(q) && !parseJump(q);

  const saved = computed(() => new Set(library.lib.bookmarks));
  const isSaved = (surah: number, a: number) => saved.value.has(ayahBookmarkKey(surah, a));
  const view = computed(() => selectAyahs(ayah.hits, { juz: state.juz, bookmarkedOnly: state.bookmarked }, isSaved));
  /** where the shown ayahs fall in the Qur'an, for the strip */
  const positions = computed(() => view.value.shown.map((h) => absolute(h.surah, h.ayah)));

  let debounce: ReturnType<typeof setTimeout> | undefined;
  let settle: ReturnType<typeof setTimeout> | undefined;

  async function runNow() {
    clearTimeout(debounce);
    const q = query.value;
    if (!q) {
      searcher.cancel();
      Object.assign(ayah, { phase: "idle", hits: [], forQuery: "" });
      return;
    }
    if (!wantsAyahSearch(q)) {
      searcher.cancel();
      Object.assign(ayah, { phase: [...q].length < MIN_QUERY_CHARS ? "short" : "idle", hits: [], forQuery: q });
      armSettle();
      return;
    }
    ayah.phase = "loading";
    const outcome = await searcher.run({ text: q, scope: state.surah ?? "all", edition: state.edition });
    if (!outcome) return; // replaced by a newer search: that one will report
    ayah.forQuery = q;
    ayah.hits = outcome.kind === "ok" ? outcome.hits : [];
    ayah.phase = outcome.kind;
    armSettle();
  }

  function schedule() {
    clearTimeout(debounce);
    clearTimeout(settle);
    const q = query.value;
    if (!wantsAyahSearch(q)) {
      void runNow(); // nothing to wait for
      return;
    }
    ayah.phase = "loading";
    debounce = setTimeout(() => void runNow(), DEBOUNCE_MS);
  }

  // ---------------------------------------------------------------- history: only after a search succeeded
  /** The search finished and found something: an ayah answer with results, or a local result, a typed reference that opens. Never after a failure. */
  function succeeded(): boolean {
    const q = query.value;
    if (!q || [...q].length < MIN_QUERY_CHARS) return false;
    if (ayah.phase === "loading" || ayah.phase === "failed" || ayah.phase === "offline") return false;
    if (ayah.phase === "ok" && ayah.forQuery === q) return true;
    return localGroups.value.length > 0 || jump.value?.kind === "open";
  }
  function remember() {
    if (succeeded()) history.value = addHistory(query.value);
  }
  function armSettle() {
    clearTimeout(settle);
    settle = setTimeout(remember, SETTLE_MS);
  }

  function removeEntry(q: string) {
    const before = history.value;
    history.value = removeHistory(q);
    undo.withUndo(`Removed “${q}”`, () => {
      writeHistory(before);
      history.value = before;
    });
  }
  function clearEntries() {
    const before = history.value;
    if (!before.length) return;
    history.value = clearHistory();
    undo.withUndo("Search history cleared", () => {
      writeHistory(before);
      history.value = before;
    });
  }

  // ---------------------------------------------------------------- the URL
  const sameQuery = (a: Record<string, unknown>, b: Record<string, unknown>) => JSON.stringify(a) === JSON.stringify(b);
  let urlTimer: ReturnType<typeof setTimeout> | undefined;
  // A router.replace while a navigation to another page is still loading cancels that navigation: a result opened within about 400 ms of typing
  // (on a slow phone the reader's code takes longer than that to arrive) was turned back into /search?q=... by this timer. Once a navigation away
  // has started, the URL is no longer written; if it is cancelled or fails, writing resumes.
  let leaving = false;
  const offGuard = router.beforeEach((to) => {
    if (to.path !== "/search") {
      leaving = true;
      clearTimeout(urlTimer);
    }
  });
  const offAfter = router.afterEach(() => {
    leaving = false;
  });
  function syncUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      if (leaving) return;
      const next = stateToQuery(state);
      if (!sameQuery(next, stateToQuery(stateFromQuery(route.query)))) void router.replace({ query: next });
    }, DEBOUNCE_MS);
  }
  watch(state, syncUrl);
  watch(
    () => [state.q, state.edition, state.surah] as const,
    () => schedule(),
  );
  watch(
    () => route.query,
    (q) => {
      const n = stateFromQuery(q);
      if (!sameQuery(stateToQuery(n), stateToQuery(state))) Object.assign(state, n); // the header's link, Back and Forward
    },
  );

  // ---------------------------------------------------------------- actions
  const setGroup = (group: SearchState["group"], edition: string) => {
    state.group = group;
    state.edition = edition;
  };
  const resetFilters = () => Object.assign(state, NO_FILTERS);
  function pickEntry(q: string) {
    state.q = q;
  }
  function retry() {
    searcher.clear();
    void runNow();
  }
  /** Enter, or opening a result: the user has settled on this search. */
  function commit() {
    clearTimeout(settle);
    remember();
  }

  const onOnline = () => {
    if (ayah.phase === "offline") retry();
  };

  onMounted(async () => {
    history.value = readHistory();
    if (!library.loaded) library.reload();
    void library.ensureProviders();
    window.addEventListener("online", onOnline);
    if (query.value) schedule();
    local.value = await import("~/lib/searchLocal");
    void local.value.loadKnowledgeGroups().then(() => knowledgeTick.value++).catch((e) => console.debug("knowledge groups of Search not loaded", e));
    if (query.value) void runNow(); // an opened ?q= link searches at once
  });
  onBeforeUnmount(() => {
    clearTimeout(debounce);
    clearTimeout(settle);
    clearTimeout(urlTimer);
    offGuard();
    offAfter();
    searcher.cancel();
    window.removeEventListener("online", onOnline);
  });

  return { state, ayah, view, positions, localGroups, query, jump, history, setGroup, resetFilters, pickEntry, removeEntry, clearEntries, retry, commit, ready: computed(() => !!local.value) };
}
