<script setup lang="ts">
// One surah in Hifz (Phase 14; prototype `#/surah/<n>`; the legacy has no such page): a row per ayah with its strength and the words you slipped on,
// the tricky words, Check the whole surah (the legacy full range test: every started ayah, then each join, all graded), the pace, Pause or Resume,
// and Remove with Undo. "Practise" on a row is free practice of that ayah: nothing is recorded. The list is plain elements with one click handler,
// not a component per row (a long surah has hundreds). See docs/pages/hifz.md.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { CELL_LABEL, cellsFor, counts } from "~/lib/hifz/overview";
import { surahLabel } from "~/lib/hifz/queue";
import { ayahKey, slippedIn, trickyOfSurah } from "~/lib/hifz/slips";

const props = defineProps<{ surah: number }>();
const name = props.surah ? surahLabel(props.surah) : "This surah";
const store = useHifzStore();
const undo = useUndoToast();
const router = useRouter();

useSeoMeta({ title: `${name} · Hifz · Quran App`, robots: "noindex" });
onMounted(() => store.load());

const target = computed(() => store.surahs.find((t) => t.surahNo === props.surah) ?? null);
const cells = computed(() => (target.value ? cellsFor(store.data, target.value) : []));
const summary = computed(() => counts(cells.value));
const total = computed(() => SURAH_ROWS[props.surah - 1]?.ayahs ?? 0);
const tricky = computed(() => trickyOfSurah(store.words, props.surah));
const PACES = [
  { perDay: 1, label: "Gentle", note: "1 a day" },
  { perDay: 2, label: "Steady", note: "2 a day" },
  { perDay: 3, label: "Faster", note: "3 a day" },
];
const customPace = computed(() => (target.value && !PACES.some((p) => p.perDay === target.value!.dailyNewTarget) ? target.value.dailyNewTarget : null));

const rows = computed(() =>
  cells.value.map((c) => {
    const slipped = c.s === "none" ? [] : slippedIn(store.words, ayahKey(props.surah, c.ayah));
    return { ...c, label: CELL_LABEL[c.s], slipped };
  }),
);

function onList(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-practise]");
  if (!el) return;
  const ayah = el.dataset.practise!;
  void router.push({ path: "/hifz/session", query: { mode: "free", surah: String(props.surah), from: ayah, to: ayah } });
}

function remove() {
  const t = target.value;
  if (!t) return;
  const snap = store.removeSurah(t.id);
  if (!snap) return;
  undo.withUndo(`${name} removed from My surahs.`, () => store.restoreSurah(snap));
  void router.push("/hifz");
}
function toggleStatus() {
  const t = target.value;
  if (!t) return;
  const pause = t.status === "active";
  store.setStatus(t.id, pause ? "paused" : "active");
  undo.info(pause ? "Paused. Nothing is lost." : "Resumed.");
}
</script>

<template>
  <section class="mx-auto max-w-[640px]" data-testid="hifz-surah-page">
    <div class="mb-4 flex items-center gap-2">
      <NuxtLink to="/hifz" class="grid size-11 place-items-center rounded-lg text-ink-2 hover:bg-accent" aria-label="Back to Hifz" data-testid="hifz-back"><Icon name="lucide:chevron-left" size="20" /></NuxtLink>
      <h1 class="flex-1 font-serif text-[24px] font-medium" data-testid="hifz-surah-name">{{ name }}</h1>
    </div>

    <p v-if="!store.loaded" class="py-8 text-center text-[14px] text-ink-2" role="status">Loading…</p>

    <div v-else-if="!target" class="rounded-[10px] border border-dashed px-4 py-8 text-center" data-testid="hifz-not-added">
      <p class="text-[14.5px]">{{ name }} is not in My surahs.</p>
      <Button as-child class="mt-4 min-h-11"><NuxtLink to="/hifz">Back to Hifz</NuxtLink></Button>
    </div>

    <template v-else>
      <p class="text-[14px] text-ink-2" data-testid="hifz-surah-started">
        {{ summary.started }} of {{ cells.length }} ayahs started<template v-if="target.startAyah !== 1 || target.endAyah !== total"> · ayahs {{ target.startAyah }} to {{ target.endAyah }} of {{ total }}</template><template v-if="target.status !== 'active'"> · Paused</template>
      </p>
      <div class="mt-3"><HifzStrip :cells="cells" /></div>
      <div class="mt-3"><HifzKey /></div>

      <div class="mt-6 flex flex-wrap gap-2">
        <Button v-if="summary.started" as-child class="min-h-11"><NuxtLink :to="{ path: '/hifz/session', query: { mode: 'full', target: target.id } }" data-testid="hifz-check-whole">Check the whole surah</NuxtLink></Button>
        <Button v-else class="min-h-11" disabled data-testid="hifz-check-whole">Check the whole surah</Button>
        <Button as-child variant="outline" class="min-h-11"><NuxtLink :to="{ path: '/hifz/session', query: { mode: 'check', surah: String(surah) } }" data-testid="hifz-recite-surah"><Icon name="lucide:users" size="16" />Recite to someone</NuxtLink></Button>
      </div>
      <p v-if="!summary.started" class="mt-2 text-[13px] text-ink-2">Nothing is started yet. The first ayah is in your plan for today.</p>

      <!-- the ayahs -->
      <h2 class="mb-1 mt-8 font-serif text-[20px] font-medium">Ayahs</h2>
      <ul class="border-t" data-testid="hifz-rows" @click="onList">
        <li v-for="r in rows" :key="r.ayah" class="flex items-center gap-3.5 border-b px-1 py-3 [content-visibility:auto] [contain-intrinsic-size:auto_56px]" :data-ayah="r.ayah" :data-s="r.s">
          <span class="grid size-[30px] shrink-0 place-items-center rounded-lg bg-sunken text-[13px] tabular-nums text-ink-2">{{ r.ayah }}</span>
          <div class="min-w-0 flex-1">
            <div class="font-medium" data-testid="hifz-row-state">{{ r.label }}</div>
            <div v-for="w in r.slipped" :key="w.index" class="text-[13px] text-ink-2" data-testid="hifz-row-slip">Slipped on <span class="ar !text-[16px] !leading-[1.8]" dir="rtl" lang="ar">{{ w.word }}</span> on {{ w.days }} {{ w.days === 1 ? "day" : "days" }}</div>
            <div v-if="r.joinWeak" class="text-[13px] text-ink-2" data-testid="hifz-row-join">The join from ayah {{ r.ayah - 1 }} needs work</div>
          </div>
          <button v-if="r.s !== 'none'" type="button" class="inline-flex min-h-11 items-center rounded-lg px-3 text-[13.5px] text-brand hover:bg-accent md:min-h-9" :data-practise="r.ayah" :aria-label="`Practise ayah ${r.ayah}, no grading`">Practise</button>
        </li>
      </ul>
      <p class="mt-2 text-[12.5px] text-ink-2">Practising here is free practice: it does not change your schedule.</p>

      <!-- tricky words -->
      <h2 class="mb-2 mt-8 font-serif text-[20px] font-medium">Tricky words</h2>
      <ul v-if="tricky.length" class="flex flex-wrap gap-2" data-testid="hifz-tricky">
        <li v-for="w in tricky" :key="`${w.ayah}-${w.index}`" class="rounded-lg bg-weak/15 px-3 text-weak">
          <span class="ar !text-[22px] !leading-[1.7]" dir="rtl" lang="ar">{{ w.word }}</span>
          <span class="ml-1.5 text-[12px] text-ink-2">ayah {{ w.ayah }}</span>
        </li>
      </ul>
      <p v-else class="text-[14px] text-ink-2" data-testid="hifz-no-tricky">None yet.</p>
      <p class="mt-2 text-[13px] text-ink-2">A word you slip on, on more than one day, is marked tricky, and shown to you before you recite its ayah. It clears after three days in which you recite that ayah without slipping on it.</p>

      <!-- pace, pause, remove -->
      <h2 class="mb-2 mt-8 font-serif text-[20px] font-medium">This surah</h2>
      <fieldset>
        <legend class="text-[13px] font-medium">New ayahs a day</legend>
        <div class="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="New ayahs a day">
          <button v-for="p in PACES" :key="p.perDay" type="button" role="radio" :aria-checked="target.dailyNewTarget === p.perDay" class="min-h-11 rounded-[10px] border px-3.5 text-left md:min-h-9" :class="target.dailyNewTarget === p.perDay ? 'border-brand shadow-[inset_0_0_0_1px_var(--accent)]' : ''" :data-testid="`hifz-pace-${p.perDay}`" @click="store.setPace(target.id, p.perDay)">
            <span class="text-[14px] font-medium">{{ p.label }}</span> <span class="text-[12.5px] text-ink-2">{{ p.note }}</span>
          </button>
          <span v-if="customPace" class="inline-flex min-h-11 items-center rounded-[10px] border border-brand px-3.5 text-[13.5px] shadow-[inset_0_0_0_1px_var(--accent)] md:min-h-9" role="radio" aria-checked="true" data-testid="hifz-pace-custom">{{ customPace }} a day (set earlier)</span>
        </div>
      </fieldset>
      <div class="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" class="min-h-11" data-testid="hifz-pause" @click="toggleStatus">{{ target.status === "active" ? "Pause" : "Resume" }}</Button>
        <Button variant="ghost" class="min-h-11 text-destructive" data-testid="hifz-remove" @click="remove">Remove from My surahs</Button>
      </div>
      <p class="mt-2 text-[12.5px] text-ink-2">Pausing keeps everything and takes this surah out of the plan. Removing can be undone for a few seconds.</p>
    </template>
  </section>
</template>
