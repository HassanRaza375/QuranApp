<script setup lang="ts">
// The transliteration switch for a reading view (Surah and Page share it). It owns the setting through `useTransliteration`; the view says which surahs
// are on screen so turning it on loads exactly those. A surah that cannot load (offline the first time) is said plainly, with a way to try again.
const props = defineProps<{ surahs: number[] }>();
const tl = useTransliteration();
const retry = () => void tl.ensure(props.surahs);
</script>

<template>
  <div class="inline-flex flex-col items-center" data-testid="translit-control">
    <label class="inline-flex min-h-11 items-center gap-2.5 rounded-full px-3 text-[12.5px] text-ink-2 md:min-h-9">
      <span id="translit-l">Transliteration</span>
      <Switch :model-value="tl.enabled.value" aria-labelledby="translit-l" data-testid="translit-toggle" @update:model-value="(v) => tl.setEnabled(!!v, surahs)" />
    </label>
    <p v-if="tl.enabled.value && tl.loading.value" class="text-[12px] text-ink-2" role="status" data-testid="translit-loading">Loading the transliteration…</p>
    <p v-else-if="tl.unavailable.value" class="text-center text-[12.5px] text-ink-2" role="status" data-testid="translit-unavailable">
      The transliteration isn’t on this device yet. Connect once to load it.
      <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-9" data-testid="translit-retry" @click="retry">Try again</button>
    </p>
  </div>
</template>
