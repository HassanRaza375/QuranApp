<script setup lang="ts">
// The strip across the knowledge modules (prototype `ktabs`): one link per module whose pages exist, the current one marked. When the strip is wider than
// the screen it scrolls sideways smoothly, fades at the edge that has more to show, and starts with the current tab in view.
import { KNOWLEDGE_READY, MODULE_ORDER, MODULES } from "~/lib/knowledge/modules";
import type { KnowledgeModuleId } from "~/lib/knowledge/types";

const props = defineProps<{ current: KnowledgeModuleId }>();
const tabs = MODULE_ORDER.filter((m) => KNOWLEDGE_READY[m]).map((m) => MODULES[m]);

const strip = ref<HTMLElement | null>(null);
const more = reactive({ left: false, right: false });
const measure = () => {
  const el = strip.value;
  if (!el) return;
  more.left = el.scrollLeft > 4;
  more.right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
};
/** Puts the current tab in the middle of the strip when the strip overflows (the page itself is never scrolled). */
function showCurrent(behavior: ScrollBehavior) {
  const el = strip.value;
  const tab = el?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!el || !tab) return;
  const left = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
  el.scrollTo({ left: Math.max(0, left), behavior });
}
let watcher: ResizeObserver | null = null;
onMounted(() => {
  showCurrent("instant" as ScrollBehavior); // no animation on arrival
  measure();
  window.addEventListener("resize", measure, { passive: true });
  // the icons and the font settle after the first paint and change the tabs' widths: the current tab is placed again until the strip stops changing
  if (strip.value && typeof ResizeObserver !== "undefined") {
    let settled = 0;
    watcher = new ResizeObserver(() => {
      if (settled++ < 4) showCurrent("instant" as ScrollBehavior);
      measure();
    });
    watcher.observe(strip.value);
    for (const child of Array.from(strip.value.children)) watcher.observe(child);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", measure);
  watcher?.disconnect();
});
watch(() => props.current, () => nextTick(() => showCurrent("smooth")));
</script>

<template>
  <nav
    ref="strip"
    class="k-tabs relative -mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 md:mx-0 md:px-0"
    :data-more-left="more.left || undefined"
    :data-more-right="more.right || undefined"
    aria-label="Knowledge base"
    data-testid="knowledge-tabs"
    @scroll.passive="measure"
  >
    <NuxtLink
      v-for="m in tabs"
      :key="m.id"
      :to="m.route"
      class="inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-[14px] text-ink-2 hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:font-medium aria-[current=page]:text-foreground"
      :aria-current="m.id === current ? 'page' : undefined"
      :data-testid="`ktab-${m.id}`"
    >
      <Icon :name="m.icon" size="16" />{{ m.title }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.k-tabs {
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.k-tabs::-webkit-scrollbar {
  display: none;
}
/* a fade where the strip goes on; the tabs under it stay reachable by scrolling */
.k-tabs[data-more-right] {
  mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
}
.k-tabs[data-more-left] {
  mask-image: linear-gradient(to left, #000 calc(100% - 40px), transparent);
}
.k-tabs[data-more-left][data-more-right] {
  mask-image: linear-gradient(to right, transparent, #000 40px, #000 calc(100% - 40px), transparent);
}
@media (prefers-reduced-motion: reduce) {
  .k-tabs {
    scroll-behavior: auto;
  }
}
</style>
