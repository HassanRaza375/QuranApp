<script setup lang="ts">
// The reader's header (prototype `reader-head`): the Arabic name, one line of facts, then Play surah and three menus.
import type { MenuOption } from "~/components/ResponsiveMenu.vue";
import type { Chapter } from "~/lib/chapter";
import { TAFSIR_AUTHORS, TRANSLATION_LANGS } from "~/lib/preferences";
import { TRANSLATION_LABELS } from "~/lib/readerPrefs";
import { RECITER_NAMES } from "~/lib/surahAudio";

const props = defineProps<{
  chapter: Chapter;
  /** "off" or a translation language */
  translation: string;
  tafsirAuthor: string;
  reciter: string;
  active: boolean;
  completed: boolean;
}>();
const emit = defineEmits<{ play: []; translation: [value: string]; tafsir: [value: string]; reciter: [value: string]; "toggle-read": [] }>();

const translationOptions: MenuOption[] = [{ value: "off", label: "Off" }, ...TRANSLATION_LANGS.map((l) => ({ value: l, label: TRANSLATION_LABELS[l] }))];
const tafsirOptions: MenuOption[] = TAFSIR_AUTHORS.map((a) => ({ value: a, label: a }));
const reciterOptions: MenuOption[] = RECITER_NAMES.map((r) => ({ value: r, label: r }));
</script>

<template>
  <header class="border-b pb-7 text-center">
    <NuxtLink to="/surah-listing" class="mb-3 inline-flex min-h-11 items-center text-[12.5px] text-ink-2 hover:text-foreground md:min-h-0" data-testid="back-link">‹ Surah listing</NuxtLink>
    <h1 class="ar mb-1 !text-[32px] !leading-[2.2] md:!text-[42px]" lang="ar" dir="rtl" data-testid="reader-title">{{ props.chapter.arLong }}</h1>
    <p class="mb-4 text-[13px] text-ink-2" data-testid="reader-sub">Surah {{ chapter.n }} · {{ chapter.total }} ayahs · {{ chapter.place }}</p>
    <div class="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:justify-center [&>div>button]:w-full [&>div>button]:justify-between md:[&>div>button]:w-auto">
      <Button class="col-span-2 min-h-11 gap-2 rounded-full md:min-h-9" data-testid="play-surah" @click="emit('play')">
        <Icon :name="active ? 'lucide:pause' : 'lucide:play'" size="16" />{{ active ? "Pause surah" : "Play surah" }}
      </Button>
      <div class="min-w-0">
        <ResponsiveMenu :model-value="translation" :options="translationOptions" label="Translation" @update:model-value="(v) => emit('translation', v)" />
      </div>
      <div class="min-w-0">
        <ResponsiveMenu
          :model-value="tafsirAuthor"
          :options="tafsirOptions"
          label="Tafsir"
          title="Default tafsir"
          wide
          hint="No Ja’fari tafsir is available from this app’s data provider."
          @update:model-value="(v) => emit('tafsir', v)"
        />
      </div>
      <div class="col-span-2 min-w-0 md:col-span-1">
        <ResponsiveMenu :model-value="reciter" :options="reciterOptions" label="Reciter" title="Choose a reciter" @update:model-value="(v) => emit('reciter', v)" />
      </div>
    </div>
    <button
      type="button"
      class="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[12.5px] md:min-h-9"
      :class="completed ? 'text-brand' : 'text-ink-2 hover:text-foreground'"
      :aria-pressed="completed"
      data-testid="mark-read"
      @click="emit('toggle-read')"
    >
      <Icon :name="completed ? 'lucide:circle-check' : 'lucide:circle'" size="16" />{{ completed ? "Marked as read" : "Mark as read" }}
    </button>
  </header>
</template>
