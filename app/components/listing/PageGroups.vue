<script setup lang="ts">
// The Page tab: the 604 mushaf pages in 30 groups (one per juz). A juz that starts partway down a page shares that page
// with the juz before it, so the page appears in both groups. One delegated click handler serves every chip.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { JUZ, pageStart } from "~/lib/quranMeta";
import { pageHref } from "~/lib/readerLinks";

const props = defineProps<{ currentPage: number | null }>();

const label = (p: number) => {
  const s = pageStart(p)!;
  return `Page ${p}, begins at ${SURAH_ROWS[s[0] - 1]!.name} ${s[0]}:${s[1]}`;
};
const groups = JUZ.map((j) => ({ ...j, pages: Array.from({ length: j.lastPage - j.firstPage + 1 }, (_, i) => j.firstPage + i) }));

const onClick = (e: MouseEvent) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-page]");
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  void navigateTo(pageHref(Number(a.dataset.page)));
};
</script>

<template>
  <div data-testid="page-groups" @click="onClick">
    <section v-for="g in groups" :key="g.n" class="page-group mb-5" :aria-labelledby="`pg-h-${g.n}`" :data-testid="`page-group-${g.n}`">
      <h2 :id="`pg-h-${g.n}`" class="mb-2 flex items-baseline justify-between text-[12px] font-medium uppercase tracking-wide text-ink-2">
        <span>Juz {{ g.n }}</span>
        <span>Pages {{ g.firstPage }}–{{ g.lastPage }}</span>
      </h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
        <a
          v-for="p in g.pages"
          :key="p"
          :href="pageHref(p)"
          :data-page="p"
          :title="label(p)"
          :aria-label="label(p)"
          :aria-current="p === props.currentPage ? 'true' : undefined"
          class="page-chip flex h-11 items-center justify-center rounded-md border text-[13px] tabular-nums hover:bg-accent md:h-10"
          :class="p === props.currentPage ? 'border-dashed border-brand font-medium text-brand' : 'text-ink-2'"
        >
          {{ p }}
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-group {
  content-visibility: auto;
  contain-intrinsic-size: auto 240px;
}
.page-chip.flash {
  background: var(--accent-soft);
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
</style>
