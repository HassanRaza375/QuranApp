<script setup lang="ts">
// A person, people-group or place named by the story, from the data only. Each opens its own page (people since 7A; peoples and places, Phase 12). No images.
import { useMediaQuery } from "@vueuse/core";
import type { Entity } from "~/lib/stories";

const props = defineProps<{ entity: Entity | null }>();
const emit = defineEmits<{ close: [] }>();
const isDesktop = useMediaQuery("(min-width: 768px)");
const model = computed({ get: () => props.entity !== null, set: (v) => !v && emit("close") });
</script>

<template>
  <Sheet v-model:open="model">
    <SheetContent :side="isDesktop ? 'right' : 'bottom'" class="max-h-[88vh] overflow-y-auto p-5 md:max-h-none md:w-[400px] md:max-w-none" data-testid="entity-sheet">
      <template v-if="entity">
        <SheetHeader class="p-0 pr-10">
          <p v-if="entity.arabicName" class="text-[28px] leading-[1.8]" style="font-family: var(--font-arabic); text-align: left" lang="ar" dir="rtl" data-testid="entity-arabic">{{ entity.arabicName }}</p>
          <SheetTitle class="text-[18px]" data-testid="entity-name">{{ entity.name }}</SheetTitle>
          <SheetDescription class="sr-only">Details from the Qur’an data</SheetDescription>
        </SheetHeader>
        <ul v-if="entity.chips.length" class="flex flex-wrap gap-1.5"><li v-for="c in entity.chips" :key="c" class="rounded-full border px-2.5 py-0.5 text-[12px] capitalize" data-testid="entity-chip-text">{{ c }}</li></ul>
        <p class="text-[14.5px] leading-relaxed" data-testid="entity-description">{{ entity.description }}</p>
        <Button v-if="entity.href" as-child class="min-h-11 md:min-h-9"><NuxtLink :to="entity.href" data-testid="entity-open" @click="emit('close')">Open page</NuxtLink></Button>
      </template>
    </SheetContent>
  </Sheet>
</template>
