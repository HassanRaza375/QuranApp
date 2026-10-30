<script setup lang="ts">
// A dua's transliteration, fetched live from the transliteration edition (services/transliteration.service.ts). Online only, nothing is stored, and it is
// never generated here: an ayah the source cannot answer says so. Offline: a plain line and Try again. A passage of more than six ayahs waits behind a button.
import { passageLabel, ayahCount } from "~/lib/knowledge/refs";
import type { KPassage } from "~/lib/knowledge/types";
import { TransliterationService } from "~/services/transliteration.service";

const props = defineProps<{ passage: KPassage }>();
const OPEN_UP_TO = 6;
const open = ref(ayahCount(props.passage) <= OPEN_UP_TO);
const state = ref<"idle" | "loading" | "ready" | "offline">("idle");
const lines = ref<Record<number, string | null>>({});
const ayahs = computed(() => Array.from({ length: ayahCount(props.passage) }, (_, i) => props.passage.from + i));

async function load() {
  if (state.value === "loading") return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    state.value = "offline";
    return;
  }
  state.value = "loading";
  const got = await Promise.all(ayahs.value.map(async (a) => [a, await TransliterationService.ayah(props.passage.surah, a)] as const));
  lines.value = Object.fromEntries(got);
  // every ayah failed while the browser says it is offline: the same as not being able to ask
  state.value = got.every(([, t]) => t === null) && typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "ready";
}
onMounted(() => open.value && void load());
watch(open, (v) => v && void load());
</script>

<template>
  <section class="mt-8" data-testid="k-translit">
    <h2 class="text-[17px] font-medium">Transliteration</h2>
    <p class="mt-1 text-[13px] text-ink-2">Loaded live from a transliteration source when you are online. It is not stored in the app.</p>
    <button v-if="!open" type="button" class="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] md:min-h-9" aria-expanded="false" data-testid="k-translit-open" @click="open = true">
      <Icon name="lucide:chevron-down" size="14" />Show the transliteration of {{ passageLabel(passage) }}
    </button>
    <template v-else>
      <p v-if="state === 'idle' || state === 'loading'" class="mt-3 text-[13px] text-ink-2" role="status">Loading the transliteration…</p>
      <div v-else-if="state === 'offline'" class="mt-3 rounded-[10px] border border-dashed px-3 py-3 text-[13.5px]" role="status" data-testid="k-translit-offline">
        The transliteration needs a connection, and isn’t kept on your device.
        <button type="button" class="ml-2 inline-flex min-h-11 items-center text-brand underline md:min-h-8" data-testid="k-translit-retry" @click="load()">Try again</button>
      </div>
      <ul v-else class="mt-2" data-testid="k-translit-lines">
        <li v-for="a in ayahs" :key="a" class="border-t py-2.5 text-[14.5px] first:border-t-0" data-testid="k-translit-line">
          <span class="mr-2 text-[12.5px] tabular-nums text-ink-2">{{ passage.surah }}:{{ a }}</span>
          <template v-if="lines[a]">{{ lines[a] }}</template>
          <template v-else><span class="text-ink-2">Transliteration not available for this ayah.</span> <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-8" @click="load()">Try again</button></template>
        </li>
      </ul>
    </template>
  </section>
</template>
