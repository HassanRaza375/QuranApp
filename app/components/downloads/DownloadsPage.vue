<script setup lang="ts">
// Downloads (Phase 11; prototype `#/downloads`): what is saved on this device (text, tafsir, one reciter's audio per surah), the queue, quick picks,
// the Add sheet, and the few preferences. What is listed is read from the device, not remembered: a part the device lost shows "Not saved" with a
// one-tap repair. Saved audio plays through the service worker. See docs/pages/downloads.md.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { formatBytes, needsHomeScreenNote, RECITER_IDS, TEXT_BYTES_PER_AYAH } from "~/lib/downloadPlan";
import type { SavedRow } from "~/lib/downloadRows";
import type { Job } from "~/lib/downloadManager";
import { TOTAL_AYAHS_IN_QURAN } from "~/lib/quranCounts";

useSeoMeta({ title: "Downloads · Quran App", robots: "noindex, follow" });

const store = useDownloadsStore();
const player = usePlayerStore();
const prefs = usePreferencesStore();

const NAME_OF = Object.fromEntries(Object.entries(RECITER_IDS).map(([name, id]) => [id, name]));
const surahName = (n: number) => SURAH_ROWS[n - 1]!.name;
const sheetOpen = ref(false);
const homeScreenNote = ref(false);
const controlled = ref(false);
const show = ref("all");
const SHOW = [
  { value: "all", label: "All" },
  { value: "audio", label: "With audio" },
];

onMounted(async () => {
  const sw = navigator.serviceWorker;
  controlled.value = !!sw?.controller;
  sw?.addEventListener("controllerchange", () => (controlled.value = !!sw.controller));
  homeScreenNote.value = needsHomeScreenNote({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone: (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches,
  });
  await store.start();
  await store.readUsage();
});
watch(
  () => [store.rows.length, store.active.length],
  () => void store.readUsage(),
);

// ---- the meter
const quota = computed(() => store.usage?.quota ?? 0);
const used = computed(() => store.usage?.used ?? 0);
const other = computed(() => Math.max(0, used.value - store.savedBytes.audio - store.savedBytes.text));
const pctOf = (n: number) => (quota.value ? Math.min(100, (n / quota.value) * 100) : 0);

// ---- quick picks: Juz 30 is named by its number (Juz names are a recorded content gap); the five surahs are our choice
const PICKS = [
  { id: "juz30", label: "Juz 30", surahs: Array.from({ length: 37 }, (_, i) => 78 + i) },
  ...[18, 36, 67, 56, 55].map((n) => ({ id: String(n), label: surahName(n), surahs: [n] })),
];
const pickBytes = (surahs: number[]) => store.estimate(surahs, { tafsir: false, audio: true });

// ---- jobs
const jobName = (j: Job) => (j.kind === "text-all" ? "Text of the whole Qur’an" : surahName(j.surah));
const pct = (j: Job) => (j.total ? Math.min(100, Math.floor((j.done / j.total) * 100)) : 0);
const jobId = (j: Job) => (j.kind === "text-all" ? "all" : String(j.surah));

// ---- rows
const rowsShown = computed(() => store.visibleRows.filter((r) => show.value === "all" || r.audio.some((a) => a.state === "saved")));
const ayahsOf = (n: number) => SURAH_ROWS[n - 1]!.ayahs;
const savedAudioOf = (r: SavedRow) => r.audio.find((a) => a.state === "saved");
const hasReciterAudio = (r: SavedRow) => r.audio.some((a) => a.reciterId === store.reciterId && a.state === "saved");
const playingThis = (surah: number, id: string) => player.nowPlaying?.surahNo === surah && player.nowPlaying.reciter === NAME_OF[id] && player.playing;
function play(r: SavedRow) {
  const a = savedAudioOf(r);
  if (!a) return;
  if (playingThis(r.surah, a.reciterId)) return player.pause();
  void player.playSurah({ surahNo: r.surah, title: surahName(r.surah), reciter: NAME_OF[a.reciterId]! });
}

// ---- the Add sheet
const wholeQuranBytes = computed(() => TOTAL_AYAHS_IN_QURAN * TEXT_BYTES_PER_AYAH);
const allTextSaved = computed(() => store.visibleRows.filter((r) => r.text === "saved").length === 114);
const allTextJob = computed(() => store.active.find((j) => j.kind === "text-all"));
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="downloads-page">
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="font-serif text-[26px] font-medium">Downloads</h1>
        <p class="mt-1 text-[15px] text-ink-2">Save surahs to read and listen with no connection.</p>
      </div>
      <Button class="min-h-11 gap-2 md:min-h-9" data-testid="dl-add" @click="sheetOpen = true"><Icon name="lucide:plus" size="16" />Add surahs</Button>
    </div>

    <p v-if="!store.online" class="mt-4 flex items-start gap-2 rounded-[10px] border border-dashed px-4 py-3 text-[13.5px]" role="status" data-testid="dl-offline-note">
      <Icon name="lucide:wifi-off" size="16" class="mt-0.5 shrink-0" />You’re offline. What you saved still works; adding needs a connection, and anything queued waits for one.
    </p>
    <p v-if="homeScreenNote" class="mt-4 rounded-[10px] bg-sunken px-4 py-3 text-[13px] text-ink-2" role="note" data-testid="dl-home-note">
      Safari can clear a website’s saved data after a week without a visit. Add this app to your Home Screen to keep what you save.
    </p>
    <p v-if="!store.supported" class="mt-4 rounded-[10px] border border-dashed px-4 py-6 text-[14px]" role="status" data-testid="dl-unsupported">
      This browser can’t keep files for this site (it needs a secure page and normal, non-private storage), so nothing can be saved here.
    </p>

    <template v-else>
      <!-- what is on the device -->
      <div class="mt-5 rounded-[10px] border p-4" data-testid="dl-meter">
        <div class="flex items-baseline gap-3">
          <h2 class="flex-1 text-[15px] font-medium">On this device</h2>
          <span class="text-[12.5px] tabular-nums text-ink-2" data-testid="dl-count">{{ store.visibleRows.length }} {{ store.visibleRows.length === 1 ? "surah" : "surahs" }}</span>
        </div>
        <p class="mt-0.5 text-[13px] tabular-nums text-ink-2" data-testid="dl-usage">
          {{ formatBytes(store.savedBytes.audio + store.savedBytes.text) }} saved<template v-if="store.usage && quota"> · about {{ formatBytes(Math.max(0, quota - used)) }} free</template>
        </p>
        <template v-if="quota">
          <div class="mt-3 flex h-2 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
            <i class="block h-full bg-brand" :style="{ width: `${pctOf(store.savedBytes.audio)}%` }" />
            <i class="block h-full bg-ink-2/60" :style="{ width: `${pctOf(store.savedBytes.text)}%` }" />
            <i class="block h-full bg-border" :style="{ width: `${pctOf(other)}%` }" />
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
            <span>Audio {{ formatBytes(store.savedBytes.audio) }}</span>
            <span>Text and tafsir {{ formatBytes(store.savedBytes.text) }}</span>
            <span>Everything else the app keeps {{ formatBytes(other) }}</span>
          </div>
        </template>
        <div class="mt-4">
          <p class="mb-1 text-[12px] text-ink-2">What’s saved, across the Qur’an</p>
          <QuranThread :fills="store.fills" label="Where the saved surahs fall in the Qur’an" />
        </div>
      </div>

      <!-- the queue -->
      <div v-if="store.active.length" class="mt-6" data-testid="dl-queue">
        <div class="flex items-center">
          <h2 class="flex-1 text-[13px] font-medium uppercase tracking-wide text-ink-2">Downloading</h2>
          <Button variant="ghost" class="min-h-11 text-[13px] md:min-h-9" data-testid="dl-cancel-all" @click="store.cancelAll()">Cancel all</Button>
        </div>
        <ul class="mt-1 divide-y border-y">
          <li v-for="j in store.active" :key="j.id" class="py-3" :data-testid="`dl-job-${jobId(j)}`" :data-status="j.status">
            <div class="flex items-center gap-3">
              <div class="min-w-0 flex-1">
                <div class="text-[15px] font-medium">{{ jobName(j) }}</div>
                <div class="text-[13px] text-ink-2" role="status" data-testid="dl-job-state">
                  <template v-if="j.status === 'waiting'">Waiting…</template>
                  <template v-else-if="j.status === 'offline'">Waiting for a connection</template>
                  <template v-else-if="j.status === 'wifi'">Waiting for Wi-Fi</template>
                  <template v-else-if="j.status === 'space'">{{ j.message }}</template>
                  <template v-else-if="j.status === 'failed'">Failed · {{ j.message }}</template>
                  <template v-else-if="j.status === 'downloading'">{{ pct(j) }}% · <template v-if="j.step === 'audio'">{{ formatBytes(j.audioDone) }} of {{ formatBytes(j.expected) }}</template><template v-else>{{ j.detail }}</template></template>
                </div>
              </div>
              <Button v-if="j.status === 'failed'" variant="outline" class="min-h-11 md:min-h-9" data-testid="dl-retry" @click="store.retry(j.id)">Retry</Button>
              <Button v-if="j.status === 'space'" variant="outline" class="min-h-11 md:min-h-9" data-testid="dl-proceed" @click="store.proceed(j.id)">Download anyway</Button>
              <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Cancel ${jobName(j)}`" data-testid="dl-cancel" @click="store.cancel(j.id)"><Icon name="lucide:x" size="16" /></Button>
            </div>
            <div v-if="j.status === 'downloading'" class="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" :aria-valuenow="pct(j)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Downloading ${jobName(j)}`">
              <div class="h-full bg-brand" :style="{ width: `${pct(j)}%` }" />
            </div>
          </li>
        </ul>
      </div>

      <!-- quick picks -->
      <div class="mt-6" data-testid="dl-picks">
        <h2 class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Quick picks</h2>
        <p class="mt-1 text-[12.5px] text-ink-2">Text and the audio of your reciter. Add tafsir from the list below.</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="p in PICKS"
            :key="p.id"
            type="button"
            class="inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[13.5px] hover:bg-accent disabled:opacity-60 md:min-h-9"
            :disabled="pickBytes(p.surahs) === 0"
            :data-testid="`dl-pick-${p.id}`"
            @click="store.addMany(p.surahs, { tafsir: false, audio: true })"
          >
            <Icon :name="pickBytes(p.surahs) === 0 ? 'lucide:check' : 'lucide:download'" size="14" />{{ p.label }}
            <span class="tabular-nums text-ink-2">{{ pickBytes(p.surahs) === 0 ? "saved" : `about ${formatBytes(pickBytes(p.surahs))}` }}</span>
          </button>
        </div>
        <div class="mt-3">
          <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :disabled="allTextSaved || !!allTextJob" data-testid="dl-all-text" @click="store.addAllText()">
            <Icon :name="allTextSaved ? 'lucide:check' : 'lucide:book-down'" size="16" />{{ allTextSaved ? "Text of the whole Qur’an saved" : allTextJob ? "Saving the text…" : `Save the text of the whole Qur’an · about ${formatBytes(wholeQuranBytes)}` }}
          </Button>
        </div>
      </div>

      <!-- saved -->
      <div class="mt-6" data-testid="dl-saved">
        <div class="flex items-center gap-3">
          <h2 class="flex-1 text-[13px] font-medium uppercase tracking-wide text-ink-2">Saved</h2>
          <SettingsSegmentedControl v-model="show" :options="SHOW" label="Show" />
        </div>
        <p v-if="store.ready && !rowsShown.length" class="mt-2 text-[14px] text-ink-2" data-testid="dl-empty">
          {{ show === "audio" ? "No audio saved yet." : "Nothing saved yet. Choose Add surahs, or a quick pick above." }}
        </p>
        <ul v-else class="mt-1 divide-y border-y">
          <li v-for="r in rowsShown" :key="r.surah" class="py-3" :data-testid="`dl-row-${r.surah}`">
            <div class="flex items-center gap-3">
              <span class="w-8 shrink-0 text-right text-[13px] tabular-nums text-ink-2">{{ r.surah }}</span>
              <div class="min-w-0 flex-1">
                <NuxtLink :to="`/surah/${r.surah}`" class="text-[15px] font-medium hover:underline">{{ surahName(r.surah) }}</NuxtLink>
                <div class="text-[13px] tabular-nums text-ink-2">{{ ayahsOf(r.surah) }} ayahs · {{ formatBytes(r.bytes) }}</div>
              </div>
              <Button v-if="savedAudioOf(r)" variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-label="`${playingThis(r.surah, savedAudioOf(r)!.reciterId) ? 'Pause' : 'Play'} ${surahName(r.surah)}`" data-testid="dl-play" @click="play(r)">
                <Icon :name="playingThis(r.surah, savedAudioOf(r)!.reciterId) ? 'lucide:pause' : 'lucide:play'" size="16" />
              </Button>
              <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Remove ${surahName(r.surah)}`" data-testid="dl-remove" @click="store.removeSurah(r.surah, surahName(r.surah))"><Icon name="lucide:trash-2" size="16" /></Button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2 pl-11" data-testid="dl-parts">
              <!-- text -->
              <span v-if="r.text === 'saved'" class="inline-flex min-h-8 items-center gap-1 rounded-full bg-sunken px-3 text-[12.5px]" data-testid="dl-part-text"><Icon name="lucide:check" size="13" />Text</span>
              <button v-else type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed px-3 text-[12.5px] hover:bg-accent md:min-h-8" data-testid="dl-part-text" @click="store.addSurah(r.surah, { text: true })"><Icon name="lucide:plus" size="13" />{{ r.text === "missing" ? "Text · Not saved" : "Text" }}</button>
              <!-- tafsir -->
              <span v-if="r.tafsir === 'saved'" class="inline-flex min-h-8 items-center gap-1 rounded-full bg-sunken px-3 text-[12.5px]" data-testid="dl-part-tafsir"><Icon name="lucide:check" size="13" />Tafsir</span>
              <button v-else type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed px-3 text-[12.5px] hover:bg-accent md:min-h-8" data-testid="dl-part-tafsir" @click="store.addSurah(r.surah, { text: true, tafsir: true })"><Icon name="lucide:plus" size="13" />{{ r.tafsir === "missing" ? "Tafsir · Not saved" : "Tafsir" }}</button>
              <!-- audio: every saved file, then the reciter from Settings if it is not saved -->
              <template v-for="a in r.audio" :key="a.reciterId">
                <span v-if="a.state === 'saved'" class="inline-flex min-h-8 items-center gap-1 rounded-full bg-sunken px-3 text-[12.5px]" data-testid="dl-part-audio"><Icon name="lucide:check" size="13" />Audio · {{ NAME_OF[a.reciterId] }}</span>
                <button v-else type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed px-3 text-[12.5px] hover:bg-accent md:min-h-8" data-testid="dl-part-older" title="Saved by the older app. It can’t play from the device." @click="store.addSurah(r.surah, { text: false, audio: true }, NAME_OF[a.reciterId])"><Icon name="lucide:refresh-cw" size="13" />Audio · {{ NAME_OF[a.reciterId] }} · saved by the older app, download again</button>
              </template>
              <button v-if="!hasReciterAudio(r) && !r.audio.some((a) => a.reciterId === store.reciterId)" type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed px-3 text-[12.5px] hover:bg-accent md:min-h-8" data-testid="dl-part-audio-add" @click="store.addSurah(r.surah, { text: false, audio: true })"><Icon name="lucide:plus" size="13" />Audio</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- preferences -->
      <div class="mt-6" data-testid="dl-prefs">
        <h2 class="text-[13px] font-medium uppercase tracking-wide text-ink-2">Preferences</h2>
        <div class="mt-1 rounded-[10px] border px-4">
          <div class="flex items-center gap-3 border-b py-3" :class="store.knowsConnection ? '' : 'opacity-60'" data-testid="dl-wifi-row">
            <div class="min-w-0 flex-1">
              <div id="dl-wifi-l" class="text-[14px]">Download on Wi-Fi only</div>
              <div class="text-[12.5px] text-ink-2">Audio waits until you’re on Wi-Fi. Text and tafsir are small and don’t wait.</div>
              <div v-if="!store.knowsConnection" class="mt-1 text-[12.5px] text-ink-2" data-testid="dl-wifi-note">This browser does not tell the app whether you are on Wi-Fi, so downloads cannot be limited to Wi-Fi here. Chrome on Android does.</div>
            </div>
            <Switch :model-value="prefs.prefs.wifiOnly" :disabled="!store.knowsConnection" aria-labelledby="dl-wifi-l" data-testid="dl-wifi" @update:model-value="(v) => prefs.set('wifiOnly', !!v)" />
          </div>
          <div class="flex items-center gap-3 border-b py-3">
            <div class="min-w-0 flex-1">
              <div class="text-[14px]">Reciter</div>
              <div class="text-[12.5px] text-ink-2" data-testid="dl-reciter">Reciter: <span class="font-medium text-foreground">{{ store.reciter }}</span> · <NuxtLink to="/settings?section=audio" class="text-brand underline">Change in Settings</NuxtLink>. Audio you already saved stays.</div>
            </div>
          </div>
          <div class="flex items-center gap-3 py-3">
            <div class="min-w-0 flex-1">
              <div class="text-[14px]">Browsing cache</div>
              <div class="text-[12.5px] text-ink-2">Pages and audio you only streamed. Clearing it frees space and doesn’t touch anything you saved.</div>
            </div>
            <Button variant="outline" class="min-h-11 md:min-h-9" data-testid="dl-clear-cache" @click="store.clearBrowsingCache()">Clear</Button>
          </div>
        </div>
        <p class="mt-3 text-[12.5px] text-ink-2" data-testid="dl-notes">
          Keep the app open until a download finishes. Sizes marked “about” are estimates until the download starts.
          A saved surah plays the whole recitation. Playing a single ayah, a page or a story still needs a connection unless you played it before.
          <span v-if="store.persisted === true">The browser will keep what you save.</span>
          <span v-else-if="store.persisted === false">The browser may remove saved files if the device runs low on space.</span>
        </p>
        <p class="mt-1 text-[12.5px] text-ink-2" data-testid="dl-sw">{{ controlled ? "Offline playback is ready." : "Offline playback needs one more page load before it can start." }}</p>
      </div>
    </template>

    <DownloadsAddSheet v-model:open="sheetOpen" />
  </section>
</template>
