import { useEventListener } from "@vueuse/core";
import { opensSearch } from "~/lib/searchShortcut";

/** "/" goes to Search and puts the cursor in the box, on any page, when nothing else is taking keystrokes. */
export function useSearchShortcut() {
  const router = useRouter();
  const route = useRoute();
  onMounted(() => {
    useEventListener(window, "keydown", async (e: KeyboardEvent) => {
      const dialogOpen = !!document.querySelector('[role="dialog"][data-state="open"]');
      if (!opensSearch(e, dialogOpen)) return;
      e.preventDefault();
      if (route.path !== "/search") await router.push("/search");
      await nextTick();
      document.querySelector<HTMLInputElement>('[data-testid="search-input"]')?.focus();
    });
  });
}
