<script setup lang="ts">
// A counter. The count button is the main control: a real button, Space and Enter count (a held key does not run the count up), and the
// count is announced politely. Reset and a new goal have Undo. Vibration is on by default where the browser can, with a switch here, and
// never while Reduce motion is on. See docs/pages/tasbeeh.md.
import names from "@legacy/assets/data/names.json";
import { typeset, type AsmaName } from "~/lib/asma";
import {
  CYCLE_PATTERN, countAnnouncement, cycleAnnouncement, fraction, GOALS, parseNameCounterId, presetOf, readEntry, readPrefs, REDUCED_MOTION_NOTE, resetCount, RESET_ANNOUNCEMENT,
  restoreEntry, setTarget, setVibrate, TAP_PATTERN, tap, vibrateWanted, vibrationOn, type TasbeehEntry, type TasbeehPrefs,
} from "~/lib/tasbeeh";

const route = useRoute();
const undo = useUndoToast();

const id = computed(() => String(route.params.id));
const nameNo = computed(() => parseNameCounterId(id.value, (names as AsmaName[]).length));
const nameData = computed(() => (nameNo.value ? (names as AsmaName[])[nameNo.value - 1]! : null));
const preset = computed(() => presetOf(id.value));
// what is shown: a preset, a name of Asma-ul-Husna, or (as the legacy page does) a counter named by its id
const arabic = computed(() => nameData.value?.arabic ?? preset.value?.arabic ?? "");
const title = computed(() => (nameData.value ? typeset(nameData.value.transliteration) : (preset.value?.transliteration ?? id.value)));
const meaning = computed(() => (nameData.value ? typeset(nameData.value.english) : (preset.value?.meaning ?? "")));

useSeoMeta({ title: () => `${title.value} · Tasbeeh · Quran App`, robots: "noindex" });

const entry = ref<TasbeehEntry>(readEntry(id.value));
const live = ref("");
const prefs = ref<TasbeehPrefs>({});
const supported = ref(false);
const reduced = ref(false);
const refresh = () => (entry.value = readEntry(id.value));

onMounted(() => {
  refresh();
  prefs.value = readPrefs();
  supported.value = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  reduced.value = document.documentElement.dataset.reducedMotion === "true";
});
watch(id, refresh);

const buzz = (pattern: number | number[]) => {
  if (vibrationOn(prefs.value, { supported: supported.value, reducedMotion: reduced.value })) navigator.vibrate(pattern);
};

function onTap() {
  const r = tap(id.value);
  entry.value = r.entry;
  if (r.cycled) {
    live.value = cycleAnnouncement(r.entry);
    buzz(CYCLE_PATTERN);
  } else {
    live.value = countAnnouncement(r.entry);
    buzz(TAP_PATTERN);
  }
}
// Enter held down repeats keydown; Space counts on release. Neither runs the count up by holding.
const onKeydown = (e: KeyboardEvent) => {
  if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault();
};

function onReset() {
  if (entry.value.count === 0) return;
  const { before, entry: next } = resetCount(id.value);
  entry.value = next;
  live.value = RESET_ANNOUNCEMENT;
  undo.withUndo(`Count reset to 0 for ${title.value}`, () => {
    restoreEntry(id.value, before);
    refresh();
    live.value = countAnnouncement(before);
  });
}
function onGoal(t: number) {
  if (entry.value.target === t) return;
  const { before, entry: next } = setTarget(id.value, t);
  entry.value = next;
  live.value = `Goal ${t}. ${RESET_ANNOUNCEMENT}`;
  undo.withUndo(before.count ? `Goal set to ${t}. The count went back to 0.` : `Goal set to ${t}.`, () => {
    restoreEntry(id.value, before);
    refresh();
    live.value = `Goal ${before.target}. ${countAnnouncement(before)}`;
  });
}
function onVibrate(on: boolean) {
  setVibrate(on);
  prefs.value = readPrefs();
  if (on) buzz(TAP_PATTERN); // a short buzz so the switch can be felt
}

const R = 100;
const C = 2 * Math.PI * R;
const dash = computed(() => C * (1 - fraction(entry.value)));
</script>

<template>
  <section class="mx-auto max-w-xl text-center" data-testid="counter-page">
    <NuxtLink to="/tasbeeh" class="inline-flex min-h-11 items-center text-[12.5px] text-ink-2 hover:text-foreground md:min-h-0" data-testid="back-link">‹ All dhikr</NuxtLink>
    <p v-if="arabic" class="ar !text-[32px] !leading-[2]" lang="ar" dir="rtl" data-testid="counter-arabic">{{ arabic }}</p>
    <h1 class="font-serif text-[24px] font-medium" data-testid="counter-title">{{ title }}</h1>
    <p v-if="meaning" class="text-[14px] text-ink-2" data-testid="counter-meaning">{{ meaning }}</p>
    <p v-if="nameNo" class="mt-1 text-[13px]"><NuxtLink :to="`/asma-ul-husna#name-${nameNo}`" class="inline-flex min-h-11 items-center text-brand underline md:min-h-9" data-testid="open-name">Name {{ nameNo }} of {{ (names as AsmaName[]).length }}</NuxtLink></p>

    <div class="mt-5 flex justify-center">
      <button
        type="button"
        class="tap relative grid size-[240px] place-items-center rounded-full outline-offset-4 focus-visible:outline-2"
        :aria-label="`${countAnnouncement(entry)}, tap to count`"
        data-testid="tap"
        @click="onTap"
        @keydown="onKeydown"
      >
        <svg viewBox="0 0 240 240" class="absolute inset-0 size-full -rotate-90" aria-hidden="true" data-testid="ring">
          <circle cx="120" cy="120" :r="R" fill="none" stroke="var(--border)" stroke-width="14" />
          <circle class="ring-bar" cx="120" cy="120" :r="R" fill="none" stroke="var(--primary)" stroke-width="14" stroke-linecap="round" :stroke-dasharray="C" :stroke-dashoffset="dash" />
        </svg>
        <span class="relative flex flex-col items-center" aria-hidden="true">
          <span class="text-[52px] font-semibold leading-none tabular-nums" data-testid="count-value">{{ entry.count }}</span>{{ " " }}
          <span class="mt-1 text-[15px] text-ink-2" data-testid="count-target">of {{ entry.target }}</span>
        </span>
      </button>
    </div>
    <p class="mt-3 text-[12.5px] text-ink-2">Tap the circle, or press Space or Enter, to count.</p>
    <p class="sr-only" role="status" aria-live="polite" data-testid="count-live">{{ live }}</p>

    <div class="mt-5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Goal">
      <Button
        v-for="g in GOALS"
        :key="g"
        variant="outline"
        class="min-h-11 min-w-14 rounded-full md:min-h-9"
        :class="entry.target === g ? 'border-brand text-brand' : ''"
        :aria-pressed="entry.target === g"
        :data-testid="`goal-${g}`"
        @click="onGoal(g)"
      >{{ g }}</Button>
    </div>

    <dl class="mt-6 grid grid-cols-2 gap-3">
      <div class="rounded-[10px] border p-3"><dt class="text-[12.5px] text-ink-2">Cycles completed</dt><dd class="text-[20px] font-semibold tabular-nums" data-testid="cycles">{{ entry.cycles }}</dd></div>
      <div class="rounded-[10px] border p-3"><dt class="text-[12.5px] text-ink-2">Lifetime count</dt><dd class="text-[20px] font-semibold tabular-nums" data-testid="lifetime">{{ entry.lifetime }}</dd></div>
    </dl>

    <div class="mt-5 flex flex-col items-center gap-3">
      <Button variant="ghost" class="min-h-11 gap-1.5 md:min-h-9" :aria-disabled="entry.count === 0" data-testid="reset" @click="onReset"><Icon name="lucide:rotate-ccw" size="16" />Reset count</Button>
      <div v-if="supported" class="flex flex-col items-center gap-1" data-testid="vibrate-row">
        <label class="inline-flex min-h-11 items-center gap-3 text-[14px]">
          <span id="vibrate-label">Vibrate on count</span>
          <Switch :model-value="vibrateWanted(prefs)" aria-labelledby="vibrate-label" data-testid="vibrate" @update:model-value="(v) => onVibrate(!!v)" />
        </label>
        <p v-if="reduced" class="text-[12.5px] text-ink-2" data-testid="vibrate-note">{{ REDUCED_MOTION_NOTE }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ring-bar {
  transition: stroke-dashoffset 0.15s ease;
}
:global([data-reduced-motion="true"]) .ring-bar {
  transition: none;
}
.tap:active {
  transform: scale(0.98);
}
:global([data-reduced-motion="true"]) .tap:active {
  transform: none;
}
</style>
