<script setup lang="ts">
// "Add surahs": filter the 114, tick some, choose whether to include tafsir (off unless asked) and audio (your Settings reciter), see the total
// before pressing Download. Surahs whose chosen parts are all saved are disabled. A side panel on desktop, a bottom sheet on mobile.
import { useMediaQuery } from "@vueuse/core";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { formatBytes } from "~/lib/downloadPlan";
import { normalize } from "~/lib/listingSearch";

const open = defineModel<boolean>("open", { required: true });
const store = useDownloadsStore();
const isDesktop = useMediaQuery("(min-width: 768px)");

const filter = ref("");
const selected = ref<Set<number>>(new Set());
const tafsir = ref(false);
const audio = ref(true);

const rowsShown = computed(() => {
  const q = normalize(filter.value);
  return SURAH_ROWS.filter((r) => !q || normalize(`${r.name} ${r.en} ${r.n}`).includes(q));
});
const savedAll = (n: number) => store.estimate([n], { tafsir: tafsir.value, audio: audio.value }) === 0;
const rowBytes = (n: number) => store.estimate([n], { tafsir: tafsir.value, audio: audio.value });
const total = computed(() => store.estimate([...selected.value], { tafsir: tafsir.value, audio: audio.value }));

function toggle(n: number) {
  const next = new Set(selected.value);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  selected.value = next;
}
async function start() {
  const list = [...selected.value].sort((a, b) => a - b);
  open.value = false;
  selected.value = new Set();
  await store.addMany(list, { tafsir: tafsir.value, audio: audio.value });
}
// every opening starts from the defaults: tafsir is opt-in, so it is never left on from the last time
watch(open, (v) => {
  if (!v) return;
  filter.value = "";
  selected.value = new Set();
  tafsir.value = false;
  audio.value = true;
});
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="flex max-h-[90vh] flex-col p-5 md:max-h-none md:w-[440px] md:max-w-none" data-testid="dl-sheet">
      <SheetHeader class="p-0 pr-10">
        <SheetTitle class="text-[17px]">Add surahs</SheetTitle>
        <SheetDescription class="text-[13px]">The text is always included. Sizes are for your reciter, {{ store.reciter }}.</SheetDescription>
      </SheetHeader>

      <label class="block text-[13px] font-medium">Filter
        <input v-model="filter" type="search" placeholder="Name or number" class="mt-1.5 h-11 w-full rounded-lg border bg-transparent px-3 text-[15px] font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-[14px]" data-testid="dl-filter" />
      </label>

      <div class="flex items-center gap-2" role="group" aria-label="Include">
        <span class="flex-1 text-[13px] text-ink-2">Include</span>
        <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] md:min-h-9" :class="tafsir ? 'border-brand text-brand' : ''" :aria-pressed="tafsir" data-testid="dl-include-tafsir" @click="tafsir = !tafsir">Tafsir</button>
        <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] md:min-h-9" :class="audio ? 'border-brand text-brand' : ''" :aria-pressed="audio" data-testid="dl-include-audio" @click="audio = !audio">Audio</button>
      </div>

      <ul class="min-h-0 flex-1 divide-y overflow-y-auto border-y" data-testid="dl-list">
        <li v-for="r in rowsShown" :key="r.n">
          <label class="flex min-h-11 cursor-pointer items-center gap-3 py-1.5" :class="savedAll(r.n) ? 'opacity-60' : ''">
            <input type="checkbox" class="size-5 shrink-0 accent-[var(--brand)]" :checked="selected.has(r.n)" :disabled="savedAll(r.n)" :aria-label="`${r.n}. ${r.name}`" :data-testid="`dl-check-${r.n}`" @change="toggle(r.n)" />
            <span class="w-7 shrink-0 text-right text-[13px] tabular-nums text-ink-2">{{ r.n }}</span>
            <span class="min-w-0 flex-1 text-[14.5px]">{{ r.name }} <span class="text-[12.5px] text-ink-2">{{ r.ayahs }} ayahs</span></span>
            <span class="text-[12.5px] tabular-nums text-ink-2">{{ savedAll(r.n) ? "Saved" : `about ${formatBytes(rowBytes(r.n))}` }}</span>
          </label>
        </li>
        <li v-if="!rowsShown.length" class="py-4 text-[14px] text-ink-2">No surah matches “{{ filter }}”.</li>
      </ul>

      <p v-if="audio && store.knowsConnection && store.cellular" class="text-[12.5px] text-ink-2" data-testid="dl-sheet-wifi">You’re on mobile data. If “Download on Wi-Fi only” is on, audio waits for Wi-Fi.</p>
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1 text-[13px] tabular-nums text-ink-2" data-testid="dl-sum">{{ selected.size ? `${selected.size} selected · about ${formatBytes(total)}` : "Select surahs to download" }}</div>
        <Button class="min-h-11 gap-2 md:min-h-9" :disabled="!selected.size" data-testid="dl-start" @click="start"><Icon name="lucide:download" size="16" />Download</Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
