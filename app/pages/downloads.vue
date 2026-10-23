<script setup lang="ts">
// Downloads (Phase 11), first slice: save a surah's recitation on the device and play it with no connection. The reciter is the one in
// Settings. Saved audio is whatever is in Cache Storage; it plays through the service worker's saved-audio route (nuxt.config.ts). Text, tafsir,
// the whole-Qur'an button, Wi-Fi only and the prototype's remaining parts arrive in the next slice. See docs/phases/phase-11-downloads-plan.md.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { formatBytes, needsHomeScreenNote, RECITER_IDS } from "~/lib/downloadPlan";

useSeoMeta({ title: "Downloads · Quran App", robots: "noindex, follow" });

const store = useDownloadsStore();
const player = usePlayerStore();

const NAME_OF = Object.fromEntries(Object.entries(RECITER_IDS).map(([name, id]) => [id, name]));
const surahName = (n: number) => SURAH_ROWS[n - 1]!.name;

const pick = ref(112);
const options = computed(() => SURAH_ROWS.map((r) => ({ n: r.n, label: `${r.n}. ${r.name} (${r.en})`, size: store.sizeOf(r.n, RECITER_IDS[store.reciter]!) })));
const pickSize = computed(() => options.value[pick.value - 1]?.size ?? null);
const pickState = computed(() => {
  const id = RECITER_IDS[store.reciter]!;
  if (store.visibleSaved.some((s) => s.surah === pick.value && s.reciterId === id)) return "saved";
  if (store.active.some((j) => j.surah === pick.value && j.reciterId === id)) return "queued";
  return "free";
});

const controlled = ref(false);
const homeScreenNote = ref(false);
const usage = ref("");
async function readUsage() {
  try {
    const est = await navigator.storage?.estimate?.();
    usage.value = est?.usage != null ? `About ${formatBytes(est.usage)} used by this site${est.quota ? ` of ${formatBytes(est.quota)} available` : ""}.` : "";
  } catch {
    usage.value = "";
  }
}
onMounted(async () => {
  const sw = navigator.serviceWorker;
  controlled.value = !!sw?.controller;
  sw?.addEventListener("controllerchange", () => (controlled.value = !!sw.controller));
  homeScreenNote.value = needsHomeScreenNote({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone: (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches,
  });
  await store.init();
  await readUsage();
});
watch(
  () => [store.saved.length, store.active.length],
  () => void readUsage(),
);

const pct = (j: { done: number; expected: number }) => (j.expected ? Math.min(100, Math.floor((j.done / j.expected) * 100)) : 0);
const playingThis = (surah: number, reciterId: string) => player.nowPlaying?.surahNo === surah && player.nowPlaying.reciter === NAME_OF[reciterId] && player.playing;
function play(surah: number, reciterId: string) {
  const reciter = NAME_OF[reciterId]!;
  if (playingThis(surah, reciterId)) return player.pause();
  void player.playSurah({ surahNo: surah, title: surahName(surah), reciter });
}
const label = (s: { surah: number }) => surahName(s.surah);
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="downloads-page">
    <h1 class="font-serif text-[26px] font-medium">Downloads</h1>
    <p class="mt-1 text-[15px] text-ink-2">Save a surah’s recitation to listen with no connection.</p>
    <p class="mt-2 text-[13.5px] text-ink-2" data-testid="dl-reciter">
      Reciter: <span class="font-medium text-foreground">{{ store.reciter }}</span> ·
      <NuxtLink to="/settings?section=audio" class="text-brand underline">Change in Settings</NuxtLink>
    </p>

    <p v-if="homeScreenNote" class="mt-4 rounded-[10px] bg-sunken px-4 py-3 text-[13px] text-ink-2" role="note" data-testid="dl-home-note">
      Safari can clear a website’s saved data after a week without a visit. Add this app to your Home Screen to keep what you save.
    </p>
    <p v-if="!store.supported" class="mt-4 rounded-[10px] border border-dashed px-4 py-6 text-[14px]" role="status" data-testid="dl-unsupported">
      This browser can’t keep files for this site (it needs a secure page and normal, non-private storage), so audio can’t be saved here.
    </p>

    <template v-else>
      <div class="mt-6 border-t pt-5" data-testid="dl-add">
        <label for="dl-surah" class="text-[12px] font-medium uppercase tracking-wide text-ink-2">Surah</label>
        <div class="mt-1.5 flex flex-wrap items-center gap-2">
          <select id="dl-surah" v-model.number="pick" class="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-[14px] md:h-9" data-testid="dl-select">
            <option v-for="o in options" :key="o.n" :value="o.n">{{ o.label }}{{ o.size ? ` · ${formatBytes(o.size)}` : "" }}</option>
          </select>
          <Button class="min-h-11 gap-2 md:min-h-9" :disabled="pickState !== 'free'" data-testid="dl-start" @click="store.add(pick)">
            <Icon name="lucide:download" size="16" />{{ pickState === "saved" ? "Saved" : pickState === "queued" ? "Queued" : pickSize ? `Download · ${formatBytes(pickSize)}` : "Download" }}
          </Button>
        </div>
      </div>

      <div v-if="store.active.length" class="mt-6" data-testid="dl-queue">
        <h2 class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Downloading</h2>
        <ul class="mt-2 divide-y border-y">
          <li v-for="j in store.active" :key="j.id" class="py-3" :data-testid="`dl-job-${j.surah}`" :data-status="j.status">
            <div class="flex items-center gap-3">
              <div class="min-w-0 flex-1">
                <div class="text-[15px] font-medium">{{ surahName(j.surah) }}</div>
                <div class="text-[13px] text-ink-2" role="status" data-testid="dl-job-state">
                  <template v-if="j.status === 'waiting'">Waiting…</template>
                  <template v-else-if="j.status === 'downloading'">{{ pct(j) }}% · {{ formatBytes(j.done) }} of {{ formatBytes(j.expected) }}</template>
                  <template v-else-if="j.status === 'space'">{{ j.message }}</template>
                  <template v-else-if="j.status === 'failed'">Failed · {{ j.message }}</template>
                </div>
              </div>
              <Button v-if="j.status === 'failed'" variant="outline" class="min-h-11 md:min-h-9" data-testid="dl-retry" @click="store.retry(j.id)">Retry</Button>
              <Button v-if="j.status === 'space'" variant="outline" class="min-h-11 md:min-h-9" data-testid="dl-proceed" @click="store.proceed(j.id)">Download anyway</Button>
              <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Cancel ${surahName(j.surah)}`" data-testid="dl-cancel" @click="store.cancel(j.id)">
                <Icon name="lucide:x" size="16" />
              </Button>
            </div>
            <div v-if="j.status === 'downloading'" class="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" :aria-valuenow="pct(j)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Downloading ${surahName(j.surah)}`">
              <div class="h-full bg-brand" :style="{ width: `${pct(j)}%` }" />
            </div>
          </li>
        </ul>
      </div>

      <div class="mt-6" data-testid="dl-saved">
        <h2 class="text-[13px] font-medium uppercase tracking-wide text-ink-2">On this device</h2>
        <p v-if="store.ready && !store.visibleSaved.length" class="mt-2 text-[14px] text-ink-2" data-testid="dl-empty">Nothing saved yet. Choose a surah above.</p>
        <ul v-else class="mt-2 divide-y border-y">
          <li v-for="s in store.visibleSaved" :key="`${s.surah}/${s.reciterId}`" class="flex items-center gap-3 py-3" :data-testid="`dl-saved-${s.surah}`">
            <span class="w-8 text-right text-[13px] tabular-nums text-ink-2">{{ s.surah }}</span>
            <div class="min-w-0 flex-1">
              <div class="text-[15px] font-medium">{{ label(s) }}</div>
              <div class="text-[13px] text-ink-2">{{ NAME_OF[s.reciterId] }} · {{ store.sizeOf(s.surah, s.reciterId) ? formatBytes(store.sizeOf(s.surah, s.reciterId)!) : "" }}</div>
            </div>
            <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-label="`${playingThis(s.surah, s.reciterId) ? 'Pause' : 'Play'} ${label(s)}`" data-testid="dl-play" @click="play(s.surah, s.reciterId)">
              <Icon :name="playingThis(s.surah, s.reciterId) ? 'lucide:pause' : 'lucide:play'" size="16" />{{ playingThis(s.surah, s.reciterId) ? "Pause" : "Play" }}
            </Button>
            <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Remove ${label(s)}`" data-testid="dl-remove" @click="store.remove(s, `${label(s)} (${NAME_OF[s.reciterId]})`)">
              <Icon name="lucide:trash-2" size="16" />
            </Button>
          </li>
        </ul>
      </div>

      <p class="mt-6 text-[13px] text-ink-2" data-testid="dl-status">
        {{ usage }}
        <span v-if="store.persisted === true"> The browser will keep what you save.</span>
        <span v-else-if="store.persisted === false"> The browser may remove saved files if the device runs low on space.</span>
      </p>
      <p class="mt-1 text-[13px] text-ink-2" data-testid="dl-sw">
        {{ controlled ? "Offline playback is ready." : "Offline playback needs one more page load before it can start." }}
        A saved surah plays the whole recitation. Playing a single ayah still needs a connection unless you played it before.
      </p>
    </template>
  </section>
</template>
