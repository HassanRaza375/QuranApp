<script setup lang="ts">
// /surah-audios/[id] (the legacy route, rebuilt small): one surah's recitation by each of the five reciters. Each row has Play (that reciter, without
// changing the Settings reciter), its size, and its state: Download, progress, or Saved with Remove. The audio bookmark (`audio:<n>`, the legacy key,
// which the Library lists) is kept. The page's own data is bundled (offline level A); playing an unsaved file needs a connection. See docs/pages/surah-audios.md.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { addBookmark, bookmarkAddedAt, hasBookmark, removeBookmark } from "~/lib/bookmarks";
import { expectedBytes, formatBytes, RECITER_IDS } from "~/lib/downloadPlan";
import { RECITER_NAMES } from "~/lib/surahAudio";

const route = useRoute();
const n = computed(() => {
  const raw = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  const v = Number(raw);
  return /^\d+$/.test(String(raw)) && v >= 1 && v <= 114 ? v : null;
});
const info = computed(() => (n.value ? SURAH_ROWS[n.value - 1]! : null));

useSeoMeta({
  title: () => (info.value ? `${info.value.en} · Audio recitations · Quran App` : "Audio recitations · Quran App"),
  description: () => (info.value ? `Listen to Surah ${info.value.n}, ${info.value.en}, recited by five reciters, and save it to listen with no connection.` : "Listen to a surah recited by five reciters."),
});

const store = useDownloadsStore();
const player = usePlayerStore();
const undo = useUndoToast();

const bookmarkKey = computed(() => `audio:${n.value}`);
const bookmarked = ref(false);
const refreshBookmark = () => (bookmarked.value = n.value ? hasBookmark(bookmarkKey.value) : false);
function toggleBookmark() {
  const key = bookmarkKey.value;
  const label = `${info.value!.name} audio`;
  if (bookmarked.value) {
    const when = bookmarkAddedAt(key);
    removeBookmark(key);
    refreshBookmark();
    undo.withUndo(`Removed ${label} from saved`, () => {
      addBookmark(key, when);
      refreshBookmark();
    });
  } else {
    addBookmark(key);
    refreshBookmark();
    undo.withUndo(`Saved ${label}`, () => {
      removeBookmark(key);
      refreshBookmark();
    });
  }
}
onMounted(() => {
  refreshBookmark();
  void store.start();
});
watch(n, refreshBookmark);

const mine = computed(() => store.reciter);
const rows = computed(() =>
  RECITER_NAMES.map((name) => {
    const id = RECITER_IDS[name]!;
    return { name, id, size: n.value ? expectedBytes(id, n.value) : null };
  }),
);
const stateOf = (id: string): "saved" | "older" | "job" | "none" => {
  if (!n.value) return "none";
  if (store.isAudioSaved(n.value, id) && !store.audioHidden(n.value, id)) return "saved";
  if (store.audioJob(n.value, id)) return "job";
  if (store.hasOlderAudio(n.value, id)) return "older";
  return "none";
};
const jobOf = (id: string) => store.audioJob(n.value!, id)!;
const pct = (id: string) => {
  const j = jobOf(id);
  return j.expected ? Math.min(100, Math.floor((j.audioDone / j.expected) * 100)) : 0;
};
const playingThis = (name: string) => player.nowPlaying?.surahNo === n.value && player.nowPlaying.reciter === name && player.playing;
function play(name: string) {
  if (playingThis(name)) return player.pause();
  void player.playSurah({ surahNo: n.value!, title: info.value!.name, reciter: name });
}
</script>

<template>
  <section class="mx-auto max-w-3xl" data-testid="surah-audios-page">
    <template v-if="info">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="font-serif text-[26px] font-medium" data-testid="sa-title">{{ info.name }}</h1>
          <p class="ar mt-1 !text-[26px] !leading-[2]" lang="ar" dir="rtl">{{ info.arLong }}</p>
          <p class="text-[14px] text-ink-2">{{ info.en }} · {{ info.ayahs }} ayahs · {{ info.place }} · Surah {{ info.n }}</p>
        </div>
        <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-pressed="bookmarked" :aria-label="bookmarked ? 'Remove from saved' : 'Save this page'" data-testid="sa-bookmark" @click="toggleBookmark">
          <Icon :name="bookmarked ? 'lucide:bookmark-check' : 'lucide:bookmark'" size="16" />{{ bookmarked ? "Saved" : "Save" }}
        </Button>
      </div>

      <h2 class="mt-6 text-[13px] font-medium uppercase tracking-wide text-ink-2">Reciters</h2>
      <ul class="mt-1 divide-y border-y" data-testid="sa-list">
        <li v-for="r in rows" :key="r.id" class="py-3" :data-testid="`sa-row-${r.id}`" :data-state="stateOf(r.id)">
          <div class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="text-[15px] font-medium">{{ r.name }}<span v-if="r.name === mine" class="ml-2 rounded-full bg-sunken px-2 py-0.5 text-[11.5px] font-normal text-ink-2" data-testid="sa-yours">Your reciter</span></div>
              <div class="text-[13px] tabular-nums text-ink-2" data-testid="sa-state">
                <template v-if="stateOf(r.id) === 'saved'">Saved on this device · {{ r.size ? formatBytes(r.size) : "" }}</template>
                <template v-else-if="stateOf(r.id) === 'job'">
                  <template v-if="jobOf(r.id).status === 'failed'">Failed · {{ jobOf(r.id).message }}</template>
                  <template v-else-if="jobOf(r.id).status === 'offline'">Waiting for a connection</template>
                  <template v-else-if="jobOf(r.id).status === 'wifi'">Waiting for Wi-Fi</template>
                  <template v-else-if="jobOf(r.id).status === 'space'">{{ jobOf(r.id).message }}</template>
                  <template v-else-if="jobOf(r.id).status === 'downloading'">{{ pct(r.id) }}% · {{ formatBytes(jobOf(r.id).audioDone) }} of {{ formatBytes(jobOf(r.id).expected) }}</template>
                  <template v-else>Waiting…</template>
                </template>
                <template v-else-if="stateOf(r.id) === 'older'">Saved by the older app. It can’t play from the device.</template>
                <template v-else>{{ r.size ? formatBytes(r.size) : "" }}</template>
              </div>
            </div>
            <Button variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-label="`${playingThis(r.name) ? 'Pause' : 'Play'} ${r.name}`" data-testid="sa-play" @click="play(r.name)">
              <Icon :name="playingThis(r.name) ? 'lucide:pause' : 'lucide:play'" size="16" />
            </Button>
            <template v-if="stateOf(r.id) === 'saved'">
              <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Remove ${r.name}`" data-testid="sa-remove" @click="store.removeAudio(n!, r.id, `${info.name} (${r.name})`)"><Icon name="lucide:trash-2" size="16" /></Button>
            </template>
            <template v-else-if="stateOf(r.id) === 'job'">
              <Button v-if="jobOf(r.id).status === 'failed'" variant="outline" class="min-h-11 md:min-h-9" data-testid="sa-retry" @click="store.retry(jobOf(r.id).id)">Retry</Button>
              <Button v-else-if="jobOf(r.id).status === 'space'" variant="outline" class="min-h-11 md:min-h-9" data-testid="sa-proceed" @click="store.proceed(jobOf(r.id).id)">Download anyway</Button>
              <Button variant="ghost" class="min-h-11 md:min-h-9" :aria-label="`Cancel ${r.name}`" data-testid="sa-cancel" @click="store.cancel(jobOf(r.id).id)"><Icon name="lucide:x" size="16" /></Button>
            </template>
            <Button v-else variant="outline" class="min-h-11 gap-2 md:min-h-9" :aria-label="`Download ${r.name}`" data-testid="sa-download" @click="store.addAudio(n!, r.name)">
              <Icon name="lucide:download" size="16" />{{ stateOf(r.id) === "older" ? "Download again" : "Download" }}
            </Button>
          </div>
          <div v-if="stateOf(r.id) === 'job' && jobOf(r.id).status === 'downloading'" class="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" :aria-valuenow="pct(r.id)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Downloading ${r.name}`">
            <div class="h-full bg-brand" :style="{ width: `${pct(r.id)}%` }" />
          </div>
        </li>
      </ul>
      <p class="mt-4 text-[13px] text-ink-2">
        A saved recitation plays with no connection. Playing one that isn’t saved needs a connection.
        <NuxtLink to="/downloads" class="text-brand underline" data-testid="sa-manage">Manage downloads</NuxtLink> · <NuxtLink :to="`/surah/${info.n}`" class="text-brand underline">Read this surah</NuxtLink>
      </p>
    </template>
    <template v-else>
      <h1 class="font-serif text-[24px] font-medium" data-testid="sa-missing">There is no such surah</h1>
      <p class="mt-2 text-ink-2">Surahs are numbered 1 to 114.</p>
      <p class="mt-4"><NuxtLink to="/surah-listing" class="text-brand underline">Go to the list of surahs</NuxtLink></p>
    </template>
  </section>
</template>
