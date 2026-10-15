import { NAV_OPEN_KEY, normalizeNavOpen, type NavOpen } from "~/lib/navState";
import { getJSON, setJSON } from "~/lib/storage";

export const useNavOpen = () => {
  const open = useState<NavOpen>("nav-open", () => normalizeNavOpen(null));
  const loaded = useState<boolean>("nav-open-loaded", () => false);

  const load = () => {
    if (loaded.value) return;
    open.value = normalizeNavOpen(getJSON<unknown>(NAV_OPEN_KEY, null));
    loaded.value = true;
  };
  const set = (id: string, value: boolean) => {
    open.value = { ...open.value, [id]: value };
    setJSON(NAV_OPEN_KEY, open.value);
  };
  /** Opens a group without remembering it (used so the current page is never hidden). */
  const reveal = (id: string | null) => {
    if (id && !open.value[id]) open.value = { ...open.value, [id]: true };
  };
  return { open, load, set, reveal };
};
