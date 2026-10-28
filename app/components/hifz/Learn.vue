<script setup lang="ts">
// Learning a new ayah (Phase 14; prototype `learn`): Listen (3 plays), Read along (the whole ayah is lit while it plays: the app has one recording per
// ayah, so there are no word timings), Fade (hide more words each time), Recite (the review screen). Then, where there is an ayah before it, Join: the
// ayah before, this one, the two together, and everything from the first ayah of the plan. Joins here are practice, not graded. The grade of the ayah
// is given when the whole step ends. A resumed step starts again at Listen.
import type { Recitation } from "~/lib/hifz/grading";

const props = defineProps<{
  surah: number;
  ayah: number;
  startAyah: number;
  words: string[];
  prev: string[] | null;
  tricky?: Array<{ index: number; word: string }>;
}>();
const emit = defineEmits<{ done: [Recitation] }>();

const STAGES = ["Listen", "Read along", "Fade", "Recite"] as const;
const stage = ref(0);
const fade = ref(0);
const rec = ref<Recitation | null>(null);
const joinStep = ref(0);

const { plays, active, failed, play } = useAyahPlays(
  () => props.surah,
  () => props.ayah,
);

const hasJoin = computed(() => props.ayah > props.startAyah);
const joinSteps = computed(() => {
  const n = props.ayah;
  const steps = [`${n - 1}`, `${n}`, `${n - 1} + ${n}`];
  if (props.startAyah < n - 1) steps.push(`${props.startAyah} to ${n}`);
  return steps;
});

// the order the words are hidden in is fixed, so "hide more" only ever adds
const order = computed(() => props.words.map((_, i) => i).sort((a, b) => ((a * 7) % 5) - ((b * 7) % 5) || a - b));
const hiddenWords = computed(() => new Set(order.value.slice(0, Math.round((fade.value / 100) * props.words.length))));

function onFade(v: number[] | undefined) {
  fade.value = v?.[0] ?? 0;
}
function recited(r: Recitation) {
  rec.value = r;
  if (hasJoin.value) stage.value = 4;
  else emit("done", r);
}
function joined() {
  if (joinStep.value + 1 < joinSteps.value.length) joinStep.value++;
  else emit("done", rec.value!);
}
const notYet = ref(false);
</script>

<template>
  <div data-testid="hifz-learn" :data-stage="stage">
    <ol v-if="stage < 4" class="mb-6 flex gap-1" aria-label="Steps for a new ayah">
      <li v-for="(name, i) in STAGES" :key="name" class="flex-1 text-center text-[12px]" :class="i === stage ? 'font-semibold text-foreground' : 'text-ink-2'" :aria-current="i === stage ? 'step' : undefined">
        <i class="mb-1.5 block h-1 rounded-sm" :class="i <= stage ? 'bg-brand' : 'bg-sunken'" />{{ name }}
      </li>
    </ol>

    <!-- 1. Listen -->
    <div v-if="stage === 0">
      <div class="min-h-[150px] py-2"><HifzWords :words="words" /></div>
      <div class="my-2 flex items-center justify-center gap-4">
        <button type="button" class="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground" :aria-label="active ? 'Pause' : 'Play'" data-testid="hifz-play" @click="play">
          <Icon :name="active ? 'lucide:pause' : 'lucide:play'" size="24" />
        </button>
        <div>
          <div class="flex gap-1.5" role="img" :aria-label="`Played ${Math.min(plays, 3)} of 3 times`" data-testid="hifz-reps">
            <i v-for="i in 3" :key="i" class="size-2.5 rounded-full" :class="i <= plays ? 'bg-brand' : 'ring-[1.5px] ring-inset ring-border'" />
          </div>
          <div class="mt-1.5 text-[13px] text-ink-2">Listen 3 times</div>
        </div>
      </div>
      <p v-if="failed" class="mt-2 text-center text-[13px] text-ink-2" role="status" data-testid="hifz-audio-note">Audio needs a connection unless the surah is downloaded. You can go on without it.</p>
      <Button class="mt-4 h-12 min-h-12 w-full" data-testid="hifz-next" @click="stage = 1">{{ plays < 3 ? "Skip ahead" : "Next: read along" }}</Button>
    </div>

    <!-- 2. Read along: the whole ayah is lit while it plays -->
    <div v-else-if="stage === 1">
      <div class="min-h-[150px] py-2"><HifzWords :words="words" :lit="active" /></div>
      <p class="text-center text-[14px] text-ink-2">Read aloud with the reciter. The ayah is lit while it plays.</p>
      <div class="my-3 flex justify-center">
        <button type="button" class="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground" :aria-label="active ? 'Pause' : 'Play and read along'" data-testid="hifz-play" @click="play">
          <Icon :name="active ? 'lucide:pause' : 'lucide:play'" size="24" />
        </button>
      </div>
      <p v-if="failed" class="text-center text-[13px] text-ink-2" role="status" data-testid="hifz-audio-note">Audio needs a connection unless the surah is downloaded. You can go on without it.</p>
      <Button class="mt-4 h-12 min-h-12 w-full" data-testid="hifz-next" @click="stage = 2">Next: fade</Button>
    </div>

    <!-- 3. Fade -->
    <div v-else-if="stage === 2">
      <div class="min-h-[150px] py-2"><HifzWords :words="words" :hidden="hiddenWords" /></div>
      <p class="text-center text-[14px] text-ink-2">Recite it each time, hiding a few more words.</p>
      <div class="mx-auto mt-3 flex max-w-sm items-center gap-3">
        <span class="text-[13px] text-ink-2">Show all</span>
        <Slider class="min-h-11 flex-1" :model-value="[fade]" :min="0" :max="100" :step="25" thumb-label="How much to hide" :thumb-value-text="`${fade} percent hidden`" @update:model-value="onFade" />
        <span class="text-[13px] text-ink-2">Hide all</span>
      </div>
      <div class="mt-4 flex gap-2.5">
        <Button variant="outline" class="h-12 min-h-12 flex-1" :disabled="fade >= 100" data-testid="hifz-hide-more" @click="fade = Math.min(100, fade + 25)">Hide more</Button>
        <Button class="h-12 min-h-12 flex-1" data-testid="hifz-next" @click="stage = 3">Next: recite</Button>
      </div>
    </div>

    <!-- 4. Recite -->
    <HifzReview v-else-if="stage === 3" :words="words" :prev="prev" :tricky="tricky" :continue-label="hasJoin ? 'Next: join' : 'Continue'" @done="recited" />

    <!-- 5. Join -->
    <div v-else data-testid="hifz-learn-join">
      <h2 class="text-center font-serif text-[22px] font-medium">Join it to what you know</h2>
      <ol class="my-3 flex flex-wrap justify-center gap-1.5" aria-label="Join steps">
        <li v-for="(s, i) in joinSteps" :key="s" class="inline-flex h-[26px] items-center rounded-full border px-2.5 text-[12px]" :class="i === joinStep ? 'border-brand bg-accent text-brand' : i < joinStep ? 'border-transparent bg-sunken' : 'text-ink-2'" :aria-current="i === joinStep ? 'step' : undefined">{{ s }}</li>
      </ol>
      <p v-if="prev" class="ar text-center text-ink-2" dir="rtl" lang="ar">… {{ prev.slice(-3).join(" ") }}</p>
      <p class="mt-2 text-center text-[14px] text-ink-2">Recite {{ joinSteps[joinStep]!.includes("+") || joinSteps[joinStep]!.includes("to") ? "ayahs" : "ayah" }} {{ joinSteps[joinStep]!.replace(" + ", " and ") }} from memory, aloud.</p>
      <p v-if="notYet" class="mt-2 text-center text-[13px] text-ink-2" role="status">Take your time. Say it once more.</p>
      <div class="mt-5 flex gap-2.5">
        <Button variant="outline" class="h-12 min-h-12 flex-1" data-testid="hifz-join-repeat" @click="notYet = true">Not yet, repeat</Button>
        <Button class="h-12 min-h-12 flex-1" data-testid="hifz-join-said" @click="notYet = false; joined()">I said it</Button>
      </div>
    </div>
  </div>
</template>
