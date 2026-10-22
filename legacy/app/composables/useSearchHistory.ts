const STORAGE_KEY = "quran:search-history:v1";
const MAX_HISTORY = 15;

export const useSearchHistory = () => {
  const history = useState<string[]>("search-history", () => []);

  const getStorage = () => useNuxtApp().$storage;

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    history.value = $storage.get(STORAGE_KEY, []);
  };

  const persist = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    $storage.set(STORAGE_KEY, history.value);
  };

  const addToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    history.value = [
      trimmed,
      ...history.value.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_HISTORY);
    persist();
  };

  const removeFromHistory = (query: string) => {
    history.value = history.value.filter((q) => q !== query);
    persist();
  };

  const clearHistory = () => {
    history.value = [];
    persist();
  };

  return { history, load, addToHistory, removeFromHistory, clearHistory };
};
