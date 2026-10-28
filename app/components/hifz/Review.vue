<script setup lang="ts">
// The recite screen (Phase 14; prototype `recite()`): the previous ayah's last words as the prompt, the ayah hidden word by word. Tap a hidden word
// to reveal it, and that counts as a slip on it (you needed it); "First word" is a cue and is not a slip; "Reveal all" is for checking. Then tap the
// words you slipped on. In check mode (Recite to someone) nothing is hidden: a listener taps the slips. The grade is decided in `lib/hifz/grading.ts`.
import { canOfferEasy, gradeFor, type Recitation } from "~/lib/hifz/grading";
import { lastWords } from "~/lib/hifz/words";

const props = defineProps<{
  words: string[];
  /** the ayah before, for the prompt; null for the first ayah of a surah */
  prev: string[] | null;
  /** nothing is hidden; a listener taps the slips */
  check?: boolean;
  /** free practice: shown, but nothing is recorded */
  free?: boolean;
  /** words that were slipped on more than one day, shown as a reminder */
  tricky?: Array<{ index: number; word: string }>;
  /** the stage name when this is the last step of learning a new ayah */
  continueLabel?: string;
}>();
const emit = defineEmits<{ done: [Recitation] }>();

const shown = ref<Set<number>>(new Set());
const slips = ref<Set<number>>(new Set());
const cue = ref(false);
const easy = ref(false);
const finished = ref(false);

const hidden = computed<Set<number>>(() => (props.check ? new Set() : new Set(props.words.map((_, i) => i).filter((i) => !shown.value.has(i)))));
const allShown = computed(() => !!props.check || props.words.every((_, i) => shown.value.has(i)));
const rec = computed<Recitation>(() => ({ slips: [...slips.value].sort((a, b) => a - b), cue: cue.value, easy: easy.value }));
const n = computed(() => slips.value.size);

function toggleSlip(i: number) {
  const next = new Set(slips.value);
  if (next.has(i)) next.delete(i);
  else next.add(i);
  slips.value = next;
}
function pick(i: number) {
  if (finished.value) return;
  if (!props.check && !shown.value.has(i)) {
    // revealing a hidden word is a slip on it
    shown.value = new Set(shown.value).add(i);
    slips.value = new Set(slips.value).add(i);
    return;
  }
  toggleSlip(i);
}
function firstWord() {
  cue.value = true;
  shown.value = new Set(shown.value).add(0);
}
function revealAll() {
  shown.value = new Set(props.words.map((_, i) => i));
}
const say = computed(() =>
  props.check ? "Tap a word once to mark a slip, again to clear it." : allShown.value ? "Tap any word you slipped on." : "Recite it aloud. Tap a word to reveal it (that counts as a slip), or reveal all to check.",
);
const verdict = computed(() => {
  if (n.value === 0) return props.free ? "Nice. Free practice doesn’t change your schedule." : "Clean. This ayah waits longer before coming back.";
  const slipText = `${n.value} ${n.value === 1 ? "slip" : "slips"}`;
  return props.free ? `${slipText}. Free practice doesn’t change your schedule.` : `${slipText}. This ayah comes back tomorrow.`;
});
const grade = computed(() => gradeFor(rec.value).grade);
</script>

<template>
  <div data-testid="hifz-review">
    <p v-if="prev" class="ar text-center text-ink-2" dir="rtl" lang="ar" data-testid="hifz-prompt">… {{ lastWords(prev).join(" ") }}</p>
    <p v-else class="text-center text-[14px] text-ink-2" data-testid="hifz-prompt">Start of the surah</p>

    <p v-if="check" class="mt-3 rounded-[10px] bg-accent px-3 py-2 text-center text-[13px] text-brand" data-testid="hifz-listener-note">Hand the phone to your listener. They tap any word you slip on.</p>
    <p v-if="tricky?.length && !finished" class="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px] text-ink-2" data-testid="hifz-tricky-cue">
      You slipped on these before:
      <span v-for="t in tricky" :key="t.index" class="ar !text-[20px] !leading-[1.6] rounded-md bg-weak/15 px-2 text-weak" dir="rtl" lang="ar">{{ t.word }}</span>
    </p>

    <div class="mt-3 min-h-[150px] py-2">
      <HifzWords :words="words" :hidden="hidden" :slips="slips" :interactive="!finished" @pick="pick" />
    </div>
    <p v-if="!finished" class="mt-1 text-center text-[14px] text-ink-2" data-testid="hifz-say">{{ say }}</p>

    <div v-if="!finished" class="mt-5 flex gap-2.5">
      <template v-if="!allShown">
        <Button variant="outline" class="h-12 min-h-12 flex-1" data-testid="hifz-first-word" :disabled="cue || shown.has(0)" @click="firstWord">First word</Button>
        <Button class="h-12 min-h-12 flex-1" data-testid="hifz-reveal-all" @click="revealAll">Reveal all</Button>
      </template>
      <Button v-else class="h-12 min-h-12 flex-1" data-testid="hifz-finish" @click="finished = true">{{ n ? `Done · ${n} ${n === 1 ? "slip" : "slips"}` : "Done · no slips" }}</Button>
    </div>

    <div v-else data-testid="hifz-verdict" :data-grade="grade">
      <p class="mt-4 flex items-center gap-3 rounded-xl px-4 py-3.5 text-[14.5px]" :class="n ? 'bg-weak/10 text-foreground' : 'bg-accent'" role="status">
        <Icon :name="n ? 'lucide:circle-alert' : 'lucide:check'" size="18" :class="n ? 'text-weak' : 'text-brand'" />
        <span class="flex-1">{{ verdict }}</span>
      </p>
      <p v-if="cue && !n" class="mt-2 text-center text-[12.5px] text-ink-2" data-testid="hifz-cue-note">You used the first-word cue, so this counts as good, not easy.</p>
      <div class="mt-4 flex gap-2.5">
        <Button v-if="!free && canOfferEasy(rec)" variant="outline" class="h-12 min-h-12 flex-1" :aria-pressed="easy" :class="easy ? 'border-brand text-brand' : ''" data-testid="hifz-easy" @click="easy = !easy">This was easy</Button>
        <Button class="h-12 min-h-12 flex-1" data-testid="hifz-continue" @click="emit('done', rec)">{{ continueLabel ?? "Continue" }}</Button>
      </div>
    </div>
  </div>
</template>
