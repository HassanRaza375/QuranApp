<script setup lang="ts">
// The Surah tab: one row per surah. Plain elements and one handler per button keep 114 rows cheap.
import type { SurahRow } from "~/data/quranMeta.generated";
import type { LastRead } from "~/lib/readingMarker";
import { surahHref } from "~/lib/readerLinks";

defineProps<{
  rows: SurahRow[];
  last: LastRead | null;
  saved: Set<string>;
  currentNo: number | null;
  active: boolean;
  error: string | null;
}>();
const emit = defineEmits<{ play: [n: number]; star: [n: number] }>();

// One handler for the whole list (plain elements, no per-row components): play and star buttons carry their surah
// number, and the open links are plain anchors that are routed inside the app.
const onClick = (e: MouseEvent) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!el) return;
  const n = Number(el.dataset.n);
  if (el.dataset.act === "play") emit("play", n);
  else if (el.dataset.act === "star") emit("star", n);
  else if (el.dataset.act === "open" && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    void navigateTo(surahHref(n));
  }
};
</script>

<template>
  <ul class="border-t" data-testid="surah-list" @click="onClick">
    <li
      v-for="s in rows"
      :key="s.n"
      class="listing-row border-b"
      :class="currentNo === s.n ? 'bg-accent' : ''"
      :data-testid="`surah-row-${s.n}`"
      :data-playing="currentNo === s.n && active ? 'true' : undefined"
    >
      <div class="flex items-center gap-2 px-1 md:gap-3 md:px-3">
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full border text-[13px] tabular-nums"
          :class="last?.surahNo === s.n ? 'border-brand font-medium' : 'text-ink-2'"
          :data-testid="last?.surahNo === s.n ? 'last-read-marker' : undefined"
        >
          {{ s.n }}
        </span>
        <a :href="surahHref(s.n)" data-act="open" :data-n="s.n" class="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 py-2" :aria-label="`Open ${s.name}, ${s.en}`">
          <span class="min-w-0">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <span class="font-serif text-[16px] font-medium">{{ s.name }}</span>
              <span class="text-[13px] text-ink-2">{{ s.en }}</span>
            </span>
            <span class="block text-[12.5px] text-ink-2">{{ s.place }} · {{ s.ayahs }} verses</span>
            <span v-if="last?.surahNo === s.n" class="block text-[12.5px] font-medium text-brand" data-testid="last-read-text">
              <span aria-hidden="true" class="mr-1 inline-block size-2.5 rounded-full border border-brand align-[-1px]" style="background: linear-gradient(90deg, var(--accent) 50%, transparent 50%)" />
              Last read: ayah {{ last.ayahNo }} of {{ last.total }}
            </span>
          </span>
          <span class="ar shrink-0 !text-[22px] !leading-normal md:!text-[26px]" lang="ar" dir="rtl">{{ s.ar }}</span>
        </a>
        <button
          type="button"
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-accent md:size-9"
          :class="saved.has(`surah:${s.n}`) ? 'text-brand' : 'text-ink-2'"
          :aria-pressed="saved.has(`surah:${s.n}`)"
          :aria-label="saved.has(`surah:${s.n}`) ? `Remove ${s.name} from saved` : `Save ${s.name}`"
          data-act="star"
          :data-n="s.n"
          data-testid="star"
        >
          <svg viewBox="0 0 24 24" class="pointer-events-none size-[18px]" aria-hidden="true" :fill="saved.has(`surah:${s.n}`) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
          </svg>
        </button>
        <button
          type="button"
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-accent md:size-9"
          :aria-label="currentNo === s.n && active ? `Pause ${s.name}` : `Play ${s.name}`"
          data-act="play"
          :data-n="s.n"
          data-testid="row-play"
        >
          <span v-if="currentNo === s.n && active" class="bars pointer-events-none" aria-hidden="true"><i /><i /><i /></span>
          <svg v-else viewBox="0 0 24 24" class="pointer-events-none size-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
        </button>
      </div>
      <p v-if="currentNo === s.n && error" class="px-14 pb-2 text-[12.5px] text-destructive" role="status" data-testid="row-error">{{ error }}</p>
    </li>
  </ul>
</template>

<style scoped>
.listing-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 64px;
}
.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}
.bars i {
  width: 3px;
  height: 100%;
  background: var(--accent);
  border-radius: 1px;
  transform-origin: bottom;
  animation: bar 0.9s ease-in-out infinite;
}
.bars i:nth-child(2) {
  animation-delay: 0.15s;
}
.bars i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes bar {
  0%,
  100% {
    transform: scaleY(0.35);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
