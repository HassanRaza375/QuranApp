<script setup lang="ts">
// Hifz home (Phase 14; prototype `#/`): one plan and one Start button, then My surahs. The plan is the session's own queue (tricky ayahs first, then
// reviews, then new ayahs; new ayahs wait while 3 or more need work), with "about N minutes". No score, no streak, nothing about yesterday.
// See docs/pages/hifz.md.
import { cellsFor, counts } from "~/lib/hifz/overview";
import { surahLabel } from "~/lib/hifz/queue";
import type { HifzTarget } from "~/lib/hifz/engine";
import { SURAH_ROWS } from "~/data/quranMeta.generated";

useSeoMeta({ title: "Hifz · Quran App", description: "Memorise the Qur’an at your own pace. Your progress stays on this device.", robots: "noindex" });

const store = useHifzStore();
const undo = useUndoToast();
const addOpen = ref(false);
const practiceOpen = ref(false);

onMounted(async () => {
  store.load();
  await store.ensureLengths();
});

const ready = computed(() => store.loaded && !!store.lengths);
const plan = computed(() => store.plan);
const resume = computed(() => store.resumable);
const resumeLabel = computed(() => {
  const s = resume.value;
  if (!s) return "";
  return s.mode === "check" ? "Recite to someone" : s.kind === "assessment" ? "Check the whole surah" : "Today’s session";
});
const ICON = { tricky: "lucide:circle-alert", review: "lucide:repeat", new: "lucide:plus" } as const;

const rows = computed(() =>
  store.surahs.map((t) => {
    const cells = cellsFor(store.data, t);
    const c = counts(cells);
    const whole = t.startAyah === 1 && t.endAyah === (SURAH_ROWS[t.surahNo - 1]?.ayahs ?? t.endAyah);
    return { t, cells, started: c.started, total: cells.length, label: `${surahLabel(t.surahNo)}${whole ? "" : ` ${t.startAyah}–${t.endAyah}`}` };
  }),
);
const minutes = computed(() => (plan.value ? `About ${plan.value.minutes} ${plan.value.minutes === 1 ? "minute" : "minutes"}` : ""));

function startOver() {
  store.abandon();
}
function added(name: string) {
  undo.info(`${name} added. Its first ayah is in your plan.`);
}
const quiet = (t: HifzTarget) => t.status !== "active";
</script>

<template>
  <section class="mx-auto max-w-[640px]" data-testid="hifz-home">
    <div v-if="!ready" class="space-y-3" role="status" aria-label="Loading Hifz">
      <Skeleton class="h-56 w-full rounded-2xl" />
      <Skeleton class="h-20 w-full" />
    </div>

    <template v-else>
      <p v-if="store.damaged" class="mb-5 rounded-[10px] border border-dashed px-4 py-3 text-[13.5px]" role="status" data-testid="hifz-damaged">
        The Hifz data on this device could not be read, so it is shown as empty. Nothing was changed. If you add a surah now, the unreadable data is replaced.
      </p>

      <!-- no surah yet -->
      <div v-if="!rows.length" class="rounded-2xl border p-6 text-center" data-testid="hifz-empty">
        <h1 class="font-serif text-[28px] font-medium">Hifz</h1>
        <p class="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-2">Pick a surah and a pace. Each day you review what you have learned, fix the words you stumble on, and learn a little new. It all stays on this device.</p>
        <Button class="mt-5 h-12 min-h-12 px-8" data-testid="hifz-add-first" @click="addOpen = true"><Icon name="lucide:plus" size="16" />Add a surah</Button>
        <div class="mt-3"><Button variant="ghost" class="min-h-11 text-brand" data-testid="hifz-practice" @click="practiceOpen = true">Practise anything, no grading</Button></div>
      </div>

      <template v-else>
        <!-- a session in progress -->
        <div v-if="resume" class="rounded-2xl border bg-surface p-5 md:p-6" data-testid="hifz-resume">
          <div class="text-[13px] text-ink-2">In progress</div>
          <h1 class="mt-1 font-serif text-[28px] font-medium leading-tight">{{ resumeLabel }}</h1>
          <p class="mt-1 text-[14px] text-ink-2" data-testid="hifz-resume-count">{{ resume.currentIndex }} of {{ resume.items.length }} done</p>
          <Button as-child class="mt-5 h-[54px] min-h-[54px] w-full text-[16px]"><NuxtLink :to="{ path: '/hifz/session', query: { resume: '1' } }" data-testid="hifz-resume-go"><Icon name="lucide:play" size="18" />Resume</NuxtLink></Button>
          <div class="mt-2 text-center"><Button variant="ghost" class="min-h-11" data-testid="hifz-start-over" @click="startOver">Start over</Button></div>
        </div>

        <!-- today's plan -->
        <div v-else-if="plan && !plan.empty" class="rounded-2xl border bg-surface p-5 md:p-6" data-testid="hifz-plan">
          <div class="text-[13px] text-ink-2">Today</div>
          <h1 class="mt-1 font-serif text-[28px] font-medium leading-tight md:text-[30px]" data-testid="hifz-minutes">{{ minutes }}</h1>
          <ol class="mb-5 mt-4">
            <li v-for="l in plan.lines" :key="l.kind" class="flex items-center gap-3 border-t py-3" :data-kind="l.kind" data-testid="hifz-plan-line">
              <span class="grid size-[34px] shrink-0 place-items-center rounded-[10px]" :class="l.kind === 'tricky' ? 'bg-weak/15 text-weak' : l.kind === 'new' ? 'bg-accent text-brand' : 'bg-sunken text-ink-2'"><Icon :name="ICON[l.kind]" size="17" /></span>
              <div class="min-w-0 flex-1"><b class="font-medium">{{ l.title }}</b><div class="text-[13px] text-ink-2">{{ l.detail }}</div></div>
            </li>
          </ol>
          <Button as-child class="h-[54px] min-h-[54px] w-full text-[16px]"><NuxtLink :to="{ path: '/hifz/session' }" data-testid="hifz-start"><Icon name="lucide:play" size="18" />Start</NuxtLink></Button>
          <p class="mt-3 text-center text-[13px] text-ink-2">Tricky ayahs come first. New ayahs wait while 3 or more need work.</p>
        </div>

        <!-- nothing due -->
        <div v-else-if="plan" class="rounded-2xl border bg-surface p-6 text-center" data-testid="hifz-caught-up">
          <div class="text-[13px] text-ink-2">Today</div>
          <h1 class="mt-1 font-serif text-[28px] font-medium">You’re caught up</h1>
          <p class="mx-auto mt-2 max-w-[44ch] text-[14.5px] text-ink-2">Nothing is due. You can still practise, or recite to someone.</p>
        </div>
        <Skeleton v-else class="h-56 w-full rounded-2xl" />

        <!-- My surahs -->
        <div class="mt-9">
          <div class="mb-1 flex items-center">
            <h2 class="flex-1 font-serif text-[21px] font-medium">My surahs</h2>
            <Button variant="ghost" class="min-h-11 text-brand md:min-h-9" data-testid="hifz-add" @click="addOpen = true"><Icon name="lucide:plus" size="16" />Add</Button>
          </div>
          <ul class="border-t">
            <li v-for="r in rows" :key="r.t.id">
              <NuxtLink :to="`/hifz/surah/${r.t.surahNo}`" class="flex min-h-11 items-center gap-3.5 border-b py-4" :data-testid="`hifz-surah-${r.t.surahNo}`">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2"><span class="font-serif text-[18px] font-medium">{{ r.label }}</span><span v-if="quiet(r.t)" class="rounded bg-sunken px-2 py-0.5 text-[12px] text-ink-2" data-testid="hifz-paused">Paused</span></div>
                  <div class="text-[13px] text-ink-2" data-testid="hifz-started">{{ r.started }} of {{ r.total }} ayahs started</div>
                  <div class="mt-2"><HifzStrip :cells="r.cells" size="sm" /></div>
                </div>
                <Icon name="lucide:chevron-right" size="18" class="shrink-0 text-ink-3" />
              </NuxtLink>
            </li>
          </ul>
          <div class="mt-3"><HifzKey /></div>
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-2">
          <Button as-child variant="outline" class="min-h-11"><NuxtLink :to="{ path: '/hifz/session', query: { mode: 'check' } }" data-testid="hifz-recite"><Icon name="lucide:users" size="16" />Recite to someone</NuxtLink></Button>
          <Button variant="ghost" class="min-h-11 text-brand" data-testid="hifz-practice" @click="practiceOpen = true">Practise anything, no grading</Button>
        </div>
      </template>
    </template>

    <HifzAddSheet v-model:open="addOpen" @added="added" />
    <HifzPracticeSheet v-model:open="practiceOpen" />
  </section>
</template>
