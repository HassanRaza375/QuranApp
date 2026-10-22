<script setup lang="ts">
// One name, from the data: the Arabic large, "Name N of 99", the meaning, the Urdu, Save, and Play (disabled until the audio player,
// Phase 4B). A bottom sheet on a phone, a side panel on desktop.
import { useMediaQuery } from "@vueuse/core";
import type { ShownName } from "~/lib/asma";
import { NO_RECORDING } from "~/lib/audioText";
import { hasRecording } from "~/lib/asma";

const props = defineProps<{ name: ShownName | null; saved: boolean; total: number; playing?: boolean }>();
const emit = defineEmits<{ close: []; save: []; play: [] }>();
const recorded = computed(() => (props.name ? hasRecording(props.name.id) : false));
const isDesktop = useMediaQuery("(min-width: 768px)");
const model = computed({ get: () => props.name !== null, set: (v) => !v && emit("close") });
</script>

<template>
  <Sheet v-model:open="model">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[400px] md:max-w-none" data-testid="name-sheet">
      <template v-if="name">
        <SheetHeader class="p-0 pr-10">
          <p class="text-[54px] leading-[1.7]" style="font-family: var(--font-arabic); text-align: left" lang="ar" dir="rtl" data-testid="sheet-arabic">{{ name.arabic }}</p>
          <SheetTitle class="text-[20px]" data-testid="sheet-name">{{ name.shownTransliteration }}</SheetTitle>
          <SheetDescription class="text-[13px] text-ink-2" data-testid="sheet-number">Name {{ name.id }} of {{ total }}</SheetDescription>
        </SheetHeader>
        <p class="text-[16px]" data-testid="sheet-english">{{ name.shownEnglish }}</p>
        <p class="ur text-ink-2" lang="ur" dir="rtl" data-testid="sheet-urdu">{{ name.urdu }}</p>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" class="min-h-11 gap-1.5 md:min-h-9" :aria-pressed="saved" :class="saved ? 'border-brand text-brand' : ''" data-testid="sheet-save" @click="emit('save')">
            <Icon name="lucide:star" size="16" />{{ saved ? "Saved" : "Save" }}
          </Button>
          <slot name="count" />
          <Button v-if="recorded" variant="outline" class="min-h-11 gap-1.5 md:min-h-9" :aria-pressed="!!playing" :class="playing ? 'border-brand text-brand' : ''" data-testid="sheet-play" @click="emit('play')">
            <Icon :name="playing ? 'lucide:pause' : 'lucide:play'" size="16" />{{ playing ? "Pause" : "Play" }}
          </Button>
          <Button v-else variant="outline" class="min-h-11 gap-1.5 md:min-h-9" aria-disabled="true" aria-describedby="name-play-reason" data-testid="sheet-play" @click.prevent>
            <Icon name="lucide:play" size="16" />Play
          </Button>
        </div>
        <p v-if="!recorded" id="name-play-reason" class="text-[12px] text-ink-2" data-testid="sheet-play-reason">{{ NO_RECORDING }}</p>
      </template>
    </SheetContent>
  </Sheet>
</template>
