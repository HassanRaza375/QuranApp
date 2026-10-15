<script setup lang="ts">
// Phase 0 check page: every foundation piece in one place, so it can be looked at and tested in a browser.
// It is NOT a product page; it is removed at cutover (see docs/phases/phase-00-foundation.md).
import surahs from "@legacy/assets/data/surah.json";
import { FIQH_PARAMS } from "@legacy/utils/prayerFiqh.js";
import { searchCommands } from "@legacy/utils/commandsSearch";
import { QURAN_COMMANDS } from "@legacy/data/quranCommands";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { ARABIC_SCALE } from "~/lib/preferences";

useSeoMeta({ title: "Foundation check · Quran App", robots: "noindex" });

const store = usePreferencesStore();
const undo = useUndoToast();
const prefs = computed(() => store.prefs);

const fiqhOptions: MenuOption[] = [
  { value: "sunni", label: "Sunni" },
  { value: "jafari", label: "Ja'fari" },
];
const verseOptions: MenuOption[] = [
  { value: "arabic1", label: "Arabic" },
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
];

// Proof that the legacy bridge works: real legacy data and a real legacy search function.
const sample = surahs.slice(0, 3);
const legacyHits = computed(() => searchCommands(QURAN_COMMANDS, "prayer").length);
const swatches = ["bg-background", "bg-surface", "bg-sunken", "bg-accent", "bg-brand", "bg-gold", "bg-gold-soft", "bg-destructive"];

const removed = ref(false);
const remove = () => {
  removed.value = true;
  undo.withUndo("Item removed", () => {
    removed.value = false;
  });
};
</script>

<template>
  <div class="space-y-10">
    <header>
      <h1 class="font-serif text-[28px] font-medium">Foundation check</h1>
      <p class="mt-1 text-ink-2">Phase 0 only. Not a product page.</p>
    </header>

    <section aria-labelledby="h-prefs" class="space-y-3">
      <h2 id="h-prefs" class="font-serif text-[20px] font-medium">Preferences (legacy keys)</h2>
      <div class="flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-4">
        <ResponsiveMenu
          :model-value="prefs.fiqh"
          :options="fiqhOptions"
          label="Fiqh"
          @update:model-value="(v) => store.set('fiqh', v as 'sunni' | 'jafari')"
        />
        <ResponsiveMenu
          :model-value="prefs.verseDisplay"
          :options="verseOptions"
          label="Verse text"
          @update:model-value="(v) => store.set('verseDisplay', v as 'arabic1' | 'english' | 'urdu')"
        />
        <label class="flex items-center gap-2">
          <Switch :model-value="prefs.highContrast" aria-label="High contrast" @update:model-value="(v) => store.set('highContrast', !!v)" />
          High contrast
        </label>
        <label class="flex items-center gap-2">
          <Switch :model-value="prefs.reducedMotion" aria-label="Reduce motion" @update:model-value="(v) => store.set('reducedMotion', !!v)" />
          Reduce motion
        </label>
      </div>
      <div class="rounded-lg border bg-surface p-4">
        <label for="arabic-scale" class="mb-3 block text-ink-2">Arabic size: {{ prefs.arabicScale.toFixed(1) }}</label>
        <Slider
          id="arabic-scale"
          :model-value="[prefs.arabicScale]"
          :min="ARABIC_SCALE.min"
          :max="ARABIC_SCALE.max"
          :step="ARABIC_SCALE.step"
          @update:model-value="(v) => v && store.set('arabicScale', Math.round(v[0]! * 10) / 10)"
        />
      </div>
    </section>

    <section aria-labelledby="h-ar" class="space-y-2">
      <h2 id="h-ar" class="font-serif text-[20px] font-medium">Arabic and legacy data</h2>
      <p class="text-ink-2">Surah names come from the legacy data file through the <code>@legacy</code> alias.</p>
      <ul class="divide-y rounded-lg border bg-surface">
        <li v-for="s in sample" :key="s.surahNo" class="flex items-center justify-between px-5 py-4" data-testid="surah-row">
          <span>{{ s.surahNo }}. {{ s.surahName }} <span class="text-ink-2">({{ s.surahNameTranslation }})</span></span>
          <span class="ar" lang="ar">{{ s.surahNameArabic }}</span>
        </li>
      </ul>
      <p class="text-ink-2" data-testid="legacy-util">
        Legacy utilities: <code>FIQH_PARAMS.jafari</code> = {{ JSON.stringify(FIQH_PARAMS.jafari) }}; searchCommands("prayer") found {{ legacyHits }} entries.
      </p>
    </section>

    <section aria-labelledby="h-undo" class="space-y-3">
      <h2 id="h-undo" class="font-serif text-[20px] font-medium">Undo over confirm</h2>
      <div class="flex items-center gap-3 rounded-lg border bg-surface p-4">
        <span v-if="!removed" data-testid="item">A saved item</span>
        <span v-else class="text-ink-2" data-testid="item-removed">Removed</span>
        <Button variant="outline" class="ml-auto min-h-11 md:min-h-8" :disabled="removed" @click="remove">Remove</Button>
      </div>
    </section>

    <section aria-labelledby="h-tokens" class="space-y-3">
      <h2 id="h-tokens" class="font-serif text-[20px] font-medium">Tokens</h2>
      <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
        <div v-for="c in swatches" :key="c" class="flex flex-col items-center gap-1 text-[11px] text-ink-2">
          <div class="size-12 rounded-md border" :class="c" />{{ c.replace("bg-", "") }}
        </div>
      </div>
    </section>
  </div>
</template>
