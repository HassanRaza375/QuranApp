<script setup lang="ts">
// The player sheet (prototype player overlay): now playing, a real slider with a spoken value, previous / back 10 / play / forward 10 / next,
// speed, reciter (with its warning BEFORE it happens), repeat, auto-next, the resume line, "Follow audio" and Save audio (disabled until
// Downloads). 4C: what it shows follows the kind: a surah (previous and next SURAH, repeat, auto-next), an ayah (previous and next AYAH,
// repeat this ayah), a queue (ayah by ayah, "ayah 3 of 13", no repeat, Skip on a failed ayah) and a clip (no reciter, no repeat).
// A bottom sheet on a phone, a side panel on desktop. Space toggles play when focus is not on another control. See docs/pages/player.md.
import { useMediaQuery } from "@vueuse/core";
import { FOLLOW_DESC, FOLLOW_LABEL, FOLLOW_REDUCED_NOTE, RESUME_LABEL, SAVE_AUDIO_REASON, SKIP_AYAH, SPEEDS, clock, followOn, isCustomSpeed, reciterNote, spokenPosition } from "~/lib/audioState";
import { RECITER_NAMES } from "~/lib/surahAudio";

const player = usePlayerStore();
const prefs = usePreferencesStore();
const isDesktop = useMediaQuery("(min-width: 768px)");
const open = computed({ get: () => player.sheetOpen, set: (v) => (v ? player.openSheet() : player.closeSheet()) });
const s = computed(() => player.snap);
const view = computed(() => player.view);
const kind = computed(() => s.value.track?.kind ?? "surah");
const busy = computed(() => player.playing || player.loading);
const rate = computed(() => prefs.prefs.playbackRate);
const reduced = ref(false);
onMounted(() => (reduced.value = document.documentElement.dataset.reducedMotion === "true"));
watch(open, (v) => v && (reduced.value = document.documentElement.dataset.reducedMotion === "true"));

// the words follow what is playing
const unit = computed(() => (kind.value === "surah" ? "surah" : "ayah"));
const showRepeat = computed(() => kind.value === "surah" || kind.value === "ayah");
const repeatLabel = computed(() => (kind.value === "ayah" ? "Repeat this ayah" : "Repeat this recitation"));
const showAuto = computed(() => kind.value === "surah");
const showReciter = computed(() => kind.value !== "clip");
const showFollow = computed(() => kind.value === "ayah" || kind.value === "queue");
const followChecked = computed(() => followOn(player.playerPrefs, reduced.value));

// the slider shows the finger's place while dragging, and the player's place otherwise
const dragging = ref<number | null>(null);
const shownPosition = computed(() => dragging.value ?? s.value.position);
const max = computed(() => (s.value.duration > 0 ? Math.floor(s.value.duration) : 0));
const onInput = (e: Event) => (dragging.value = Number((e.target as HTMLInputElement).value));
const onChange = (e: Event) => {
  player.seek(Number((e.target as HTMLInputElement).value));
  dragging.value = null;
};

const status = computed(() => {
  if (player.error) return player.error;
  if (s.value.status === "loading") return "Loading…";
  if (s.value.status === "buffering") return "Buffering…";
  if (s.value.status === "playing") return "Playing";
  if (s.value.status === "restored" || s.value.status === "paused") return s.value.position > 0 ? `Paused at ${clock(s.value.position)}` : "Paused";
  return "";
});

const onSpeed = (r: number) => {
  prefs.set("playbackRate", r); // the same value as Settings
  player.setRate(r);
};
const onReciter = (name: string) => {
  prefs.set("reciter", { reciter: name } as never); // the preferred reciter, as the reader's menu does
  void player.switchReciter(name);
};
const onAuto = (v: boolean) => prefs.set("autoplay", v);

// Space plays or pauses when focus is on the sheet itself or the slider (not on a button, switch or link, which keep their own Space)
function onKey(e: KeyboardEvent) {
  if (e.key !== " " || e.repeat) return;
  const t = e.target as HTMLElement | null;
  if (t?.closest("button, a, [role='switch'], [role='radio']")) return;
  e.preventDefault();
  void player.toggle();
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[92vh] overflow-y-auto p-5 md:max-h-none md:w-[420px] md:max-w-none" data-testid="player-sheet" @keydown="onKey">
      <template v-if="view">
        <SheetHeader class="p-0 pr-10">
          <SheetTitle class="text-[20px]" data-testid="player-title">{{ view.title }}</SheetTitle>
          <SheetDescription class="text-[13px] text-ink-2" data-testid="player-sub">{{ view.reciterLine }}</SheetDescription>
        </SheetHeader>
        <p v-if="kind === 'queue'" class="text-[13px] text-ink-2" data-testid="player-queue-line">{{ view.line }}</p>

        <p class="text-[13px]" :class="player.error ? 'text-destructive' : 'text-ink-2'" role="status" aria-live="polite" data-testid="player-status">{{ status }}</p>
        <div v-if="s.status === 'error'" class="flex flex-wrap gap-2">
          <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="player-retry" @click="player.retry()">Try again</Button>
          <Button v-if="s.error?.canSkip" variant="outline" class="min-h-11 md:min-h-9" data-testid="player-skip" @click="player.skipAyah()">{{ SKIP_AYAH }}</Button>
        </div>
        <Button v-if="s.status === 'restored'" variant="outline" class="min-h-11 justify-start gap-2 self-stretch text-left md:min-h-9" data-testid="resume-line" @click="player.toggle()">
          <Icon name="lucide:history" size="16" />{{ RESUME_LABEL }} · {{ view.title }}{{ kind === "queue" ? ` · ${view.line.split(" · ").pop()}` : "" }} · {{ clock(s.position) }}
        </Button>

        <div>
          <input
            type="range"
            class="h-11 w-full accent-[var(--primary)]"
            min="0"
            :max="max"
            step="1"
            :value="Math.floor(shownPosition)"
            :disabled="!s.seekable"
            aria-label="Position"
            :aria-valuetext="spokenPosition(shownPosition, s.duration)"
            data-testid="player-slider"
            @input="onInput"
            @change="onChange"
          />
          <div class="flex justify-between text-[12px] tabular-nums text-ink-2" aria-hidden="true"><span data-testid="player-time">{{ clock(shownPosition) }}</span><span data-testid="player-duration">{{ clock(s.duration) }}</span></div>
        </div>

        <div class="flex items-center justify-center gap-2" role="group" aria-label="Playback">
          <Button variant="ghost" size="icon" class="size-11 rounded-full" :aria-disabled="!s.canPrevious" :aria-label="`Previous ${unit}`" data-testid="player-prev" @click="s.canPrevious && player.previous()"><Icon name="lucide:skip-back" size="20" /></Button>
          <Button variant="ghost" size="icon" class="size-11 rounded-full" :aria-disabled="!s.seekable" aria-label="Back 10 seconds" data-testid="player-back" @click="player.skipBack()"><Icon name="lucide:rotate-ccw" size="20" /></Button>
          <Button size="icon" class="size-14 rounded-full" :aria-label="busy ? 'Pause' : 'Play'" data-testid="player-toggle" @click="player.toggle()"><Icon :name="busy ? 'lucide:pause' : 'lucide:play'" size="24" /></Button>
          <Button variant="ghost" size="icon" class="size-11 rounded-full" :aria-disabled="!s.seekable" aria-label="Forward 10 seconds" data-testid="player-forward" @click="player.skipForward()"><Icon name="lucide:rotate-cw" size="20" /></Button>
          <Button variant="ghost" size="icon" class="size-11 rounded-full" :aria-disabled="!s.canNext" :aria-label="`Next ${unit}`" data-testid="player-next" @click="s.canNext && player.next()"><Icon name="lucide:skip-forward" size="20" /></Button>
        </div>

        <section aria-labelledby="speed-h">
          <h3 id="speed-h" class="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-2">Speed</h3>
          <div class="flex flex-wrap gap-2" role="group" aria-labelledby="speed-h">
            <Button v-for="r in SPEEDS" :key="r" variant="outline" class="min-h-11 min-w-14 rounded-full md:min-h-9" :class="rate === r ? 'border-brand text-brand' : ''" :aria-pressed="rate === r" :data-testid="`speed-${r}`" @click="onSpeed(r)">{{ r }}×</Button>
            <Button v-if="isCustomSpeed(rate)" variant="outline" class="min-h-11 rounded-full border-brand text-brand md:min-h-9" aria-pressed="true" data-testid="speed-custom">{{ rate }}× (set in Settings)</Button>
          </div>
        </section>

        <section v-if="showReciter && s.track" aria-labelledby="reciter-h">
          <h3 id="reciter-h" class="mb-1 text-[12px] font-medium uppercase tracking-wide text-ink-2">Reciter</h3>
          <p class="mb-2 text-[12.5px] text-ink-2" data-testid="reciter-note">{{ reciterNote(kind) }}</p>
          <div class="flex flex-wrap gap-2" role="group" aria-labelledby="reciter-h">
            <Button v-for="n in RECITER_NAMES" :key="n" variant="outline" class="min-h-11 rounded-full md:min-h-9" :class="s.track.reciter === n ? 'border-brand text-brand' : ''" :aria-pressed="s.track.reciter === n" data-testid="reciter-chip" @click="onReciter(n)">{{ n }}</Button>
          </div>
        </section>

        <section class="space-y-1" aria-label="Playback options">
          <label v-if="showRepeat" class="flex min-h-11 items-center justify-between gap-3 text-[14px]"><span id="repeat-l">{{ repeatLabel }}</span><Switch :model-value="s.repeat" aria-labelledby="repeat-l" data-testid="player-repeat" @update:model-value="(v) => player.setRepeat(!!v)" /></label>
          <label v-if="showAuto" class="flex min-h-11 items-center justify-between gap-3 text-[14px]"><span id="auto-l">Play the next surah automatically<small class="block text-[12px] text-ink-2">Same setting as in Settings</small></span><Switch :model-value="prefs.prefs.autoplay" aria-labelledby="auto-l" data-testid="player-auto" @update:model-value="(v) => onAuto(!!v)" /></label>
          <label v-if="showFollow" class="flex min-h-11 items-center justify-between gap-3 text-[14px]">
            <span id="follow-l">{{ FOLLOW_LABEL }}<small class="block text-[12px] text-ink-2">{{ FOLLOW_DESC }}</small><small v-if="reduced" class="block text-[12px] text-ink-2" data-testid="follow-note">{{ FOLLOW_REDUCED_NOTE }}</small></span>
            <Switch :model-value="followChecked" :disabled="reduced" aria-labelledby="follow-l" data-testid="player-follow" @update:model-value="(v) => player.setFollow(!!v)" />
          </label>
        </section>

        <div>
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" aria-disabled="true" aria-describedby="save-why" data-testid="player-save" @click.prevent><Icon name="lucide:download" size="16" />Save audio to device</Button>
          <p id="save-why" class="mt-1 text-[12px] text-ink-2" data-testid="save-why">{{ SAVE_AUDIO_REASON }}</p>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
