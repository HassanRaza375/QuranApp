<script setup lang="ts">
// The legacy start-date control: "Ramadan started on" overrides detection for 30 days (`quran:ramadan:v1.startOverride`); "Use calculated
// date" clears it. Always available, so it can be set in advance.
import { formatLongDate } from "~/lib/ramadanText";

const ramadan = useRamadan();
const input = ref("");
const override = computed(() => ramadan.rec.value.startOverride);
const apply = () => {
  if (input.value) {
    ramadan.setOverride(input.value);
    input.value = "";
  }
};
</script>

<template>
  <section class="rounded-[10px] border p-4" aria-labelledby="start-h" data-testid="start-date">
    <Collapsible>
      <CollapsibleTrigger as-child>
        <Button variant="ghost" class="min-h-11 gap-2 px-1 text-[15px] font-medium md:min-h-9" data-testid="start-toggle"><Icon name="lucide:chevron-down" size="15" /><span id="start-h">Ramadan start date</span></Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="mt-1 text-[13px] text-ink-2">By default the date comes from the calendar service. If your local mosque or authority announced a different start, set it here. It overrides the calendar for 30 days. A Hijri adjustment is under <NuxtLink to="/settings?section=prayer" class="text-brand underline">Settings, Prayer &amp; location</NuxtLink>.</p>
        <p v-if="override" class="mt-2 text-[13.5px]" data-testid="override-current">Set by you: {{ formatLongDate(override) }}</p>
        <div class="mt-3 flex flex-wrap items-end gap-2">
          <label class="text-[13px]">Ramadan started on<Input v-model="input" type="date" class="mt-1 !h-11 md:!h-9" data-testid="override-input" /></label>
          <Button class="min-h-11 md:min-h-9" :disabled="!input" data-testid="override-set" @click="apply">Set start date</Button>
          <Button variant="outline" class="min-h-11 md:min-h-9" :disabled="!override" data-testid="override-clear" @click="ramadan.setOverride(null)">Use calculated date</Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </section>
</template>
