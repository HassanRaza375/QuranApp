<script setup lang="ts">
// The transliteration switch for a reading view (Surah and Page share it). It owns the setting through `useTransliteration`; the view says which surahs
// are on screen so turning it on loads exactly those. A surah that cannot load (offline the first time) is said plainly, with a way to try again.
const props = defineProps<{ surahs: number[] }>();
const tl = useTransliteration();
const retry = () => void tl.ensure(props.surahs);
</script>

<template>
  <div class="inline-flex flex-col items-center" data-testid="translit-control">
    <!-- A real 44px button (a switch role), with the track drawn inside it: the library Switch is only as tall as its track, which fails the phone target rule. -->
    <button
      type="button"
      role="switch"
      :aria-checked="tl.enabled.value"
      class="inline-flex min-h-11 items-center gap-2.5 rounded-full px-3 text-[12.5px] text-ink-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9"
      data-testid="translit-toggle"
      @click="tl.setEnabled(!tl.enabled.value, surahs)"
    >
      <span>Transliteration</span>
      <span class="inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors" :class="tl.enabled.value ? 'border-transparent bg-primary' : 'border-ink-2 bg-sunken'" aria-hidden="true">
        <span class="block size-3.5 rounded-full transition-transform" :class="tl.enabled.value ? 'translate-x-[18px] bg-primary-foreground' : 'translate-x-[2px] bg-ink-2'" />
      </span>
    </button>
    <p v-if="tl.enabled.value && tl.loading.value" class="text-[12px] text-ink-2" role="status" data-testid="translit-loading">Loading the transliteration…</p>
    <p v-else-if="tl.unavailable.value" class="text-center text-[12.5px] text-ink-2" role="status" data-testid="translit-unavailable">
      The transliteration isn’t on this device yet. Connect once to load it.
      <button type="button" class="ml-1 inline-flex min-h-11 items-center text-brand underline md:min-h-9" data-testid="translit-retry" @click="retry">Try again</button>
    </p>
  </div>
</template>
