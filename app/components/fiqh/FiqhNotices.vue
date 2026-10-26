<script setup lang="ts">
// The notices at the top of every Daily Fiqh page: the Sunni note (the module is Ja'fari only for now) and "Not scholar-reviewed". The words are the legacy app's own.
const { isSunni } = useFiqh();
defineProps<{ reviewLabel?: boolean }>();
</script>

<template>
  <div class="space-y-2" data-testid="fiqh-notices">
    <p v-if="isSunni" class="flex items-start gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13.5px]" role="note" data-testid="fiqh-sunni">
      <Icon name="lucide:info" size="16" class="mt-0.5 shrink-0 text-ink-2" />
      <span><b class="font-medium">Fiqh Ja'fari only for now.</b> Your setting is Sunni. You can still read this module, but every ruling in it is from a Ja'fari marja'. Sunni fiqh content is planned for later.</span>
    </p>
    <p v-if="reviewLabel" class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] text-ink-2" data-testid="fiqh-unreviewed"><Icon name="lucide:user-round-x" size="14" />Not scholar-reviewed</p>
  </div>
</template>
