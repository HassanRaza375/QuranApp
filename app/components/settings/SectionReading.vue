<script setup lang="ts">
// Reading: verse layout, default translation, default tafsir, Arabic size, and a live preview.
// The preview uses today's real ayah when it is already stored; otherwise the Arabic name of the first surah from the
// legacy data (real data, clearly labelled as a name, not an ayah). No Qur'an text is typed into the app.
import type { Segment } from "./SegmentedControl.vue";
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import { readEntry, translationFor } from "~/lib/ayahOfDay";
import { ARABIC_SCALE, effectiveTranslationLang, TAFSIR_AUTHORS, type TranslationLang } from "~/lib/preferences";
import { getJSON } from "~/lib/storage";

const store = usePreferencesStore();
const p = computed(() => store.prefs);

const layouts: Segment[] = [
  { value: "ar", label: "Arabic first" },
  { value: "tr", label: "Translation first" },
];
const translations: MenuOption[] = [
  { value: "", label: "Not set (choose per ayah)" },
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
  { value: "bengali", label: "Bengali" },
  { value: "arabic2", label: "Arabic (Alt)" },
];
const tafsirs: MenuOption[] = [{ value: "", label: "Not set (choose each time)" }, ...TAFSIR_AUTHORS.map((a) => ({ value: a, label: a }))];
const LANG_NAMES: Record<string, string> = { english: "English", urdu: "Urdu", bengali: "Bengali", arabic2: "Arabic (Alt)" };

// "Not set" removes the key. If the old reader's text tab (`preferredVerseDisplay`) named a translation, that is used as
// the default (read only); say so.
const fallbackNote = computed(() => {
  if (p.value.translationLang) return "";
  const eff = effectiveTranslationLang(p.value);
  return eff ? `Using ${LANG_NAMES[eff]}, from your earlier reader setting.` : "Home's ayah shows English until you choose a language.";
});

const entry = ref<ReturnType<typeof readEntry>>(null);
const nameSample = ref<{ arabic: string; english: string } | null>(null);
onMounted(async () => {
  entry.value = readEntry(getJSON<unknown>("ayah-of-day", null));
  if (!entry.value) {
    const surahs = (await import("@legacy/assets/data/surah.json")).default as { surahNameArabicLong: string; surahNameTranslation: string }[];
    nameSample.value = { arabic: surahs[0]!.surahNameArabicLong, english: surahs[0]!.surahNameTranslation };
  }
});
const preview = computed(() => {
  if (entry.value) {
    const t = translationFor(entry.value.data, effectiveTranslationLang(p.value) as TranslationLang | null);
    return { label: "Preview (today's ayah)", arabic: entry.value.data.arabic, text: t.text, rtl: t.rtl, lang: t.lang };
  }
  if (nameSample.value) return { label: "Preview (a surah name, not an ayah)", arabic: nameSample.value.arabic, text: nameSample.value.english, rtl: false, lang: "english" as const };
  return null;
});
const trLang = (l: string) => (l === "english" ? "en" : l === "urdu" ? "ur" : l === "bengali" ? "bn" : "ar");

const scale = computed(() => [p.value.arabicScale]);
const onScale = (v: number[] | undefined) => {
  if (v && typeof v[0] === "number") store.set("arabicScale", Math.round(v[0] * 10) / 10);
};
</script>

<template>
  <div class="space-y-5">
    <section v-if="preview" aria-label="Preview" class="rounded-[10px] border bg-surface px-5 py-4" data-testid="reading-preview">
      <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-2">{{ preview.label }}</p>
      <div class="flex flex-col gap-3" :class="p.verseLayout === 'tr' ? 'flex-col-reverse' : ''" :data-order="p.verseLayout">
        <p class="ar text-right" lang="ar" dir="rtl" data-testid="preview-arabic">{{ preview.arabic }}</p>
        <p class="font-serif text-[16.5px] leading-relaxed text-ink-2" :class="preview.rtl ? 'ur' : ''" :lang="trLang(preview.lang)" :dir="preview.rtl ? 'rtl' : 'ltr'" data-testid="preview-translation">{{ preview.text }}</p>
      </div>
    </section>

    <SettingsGroup>
      <SettingsRow label="Verse layout" desc="Which comes first in each ayah.">
        <template #default="{ labelId }">
          <SettingsSegmentedControl :model-value="p.verseLayout" :options="layouts" label="Verse layout" :labelledby="labelId" @update:model-value="(v) => store.set('verseLayout', v as 'ar' | 'tr')" />
        </template>
      </SettingsRow>
      <SettingsRow label="Default translation" desc="Used in every surah. You can still change it inside a surah.">
        <ResponsiveMenu
          :model-value="p.translationLang ?? ''"
          :options="translations"
          label="Default translation"
          @update:model-value="(v) => store.set('translationLang', (v || null) as TranslationLang | null)"
        />
        <template #extra><span class="mt-1 block text-[12.5px] text-ink-2" data-testid="translation-note">{{ fallbackNote }}</span></template>
      </SettingsRow>
      <SettingsRow label="Default tafsir source" desc="Used the first time you open a tafsir panel on a fresh ayah.">
        <ResponsiveMenu :model-value="p.tafsirAuthor ?? ''" :options="tafsirs" label="Default tafsir source" @update:model-value="(v) => store.set('tafsirAuthor', (v || null) as (typeof TAFSIR_AUTHORS)[number] | null)" />
      </SettingsRow>
      <SettingsRow label="Arabic text size" desc="Applies to the surah reader and every Arabic text in the app." stack>
        <template #default="{ labelId }">
          <div class="flex items-center gap-4">
            <Slider
              class="min-h-11 flex-1"
              :model-value="scale"
              :min="ARABIC_SCALE.min"
              :max="ARABIC_SCALE.max"
              :step="ARABIC_SCALE.step"
              thumb-label="Arabic text size"
              :thumb-value-text="`${p.arabicScale.toFixed(1)} times`"
              :aria-labelledby="labelId"
              @update:model-value="onScale"
            />
            <span class="w-10 shrink-0 text-right text-[13px] tabular-nums text-ink-2" data-testid="scale-value">{{ p.arabicScale.toFixed(1) }}×</span>
          </div>
        </template>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
