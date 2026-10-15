<script setup lang="ts">
// A segmented choice (theme, fiqh, speed, Asr ...): exactly one option is chosen. It is a radio group:
// the chosen option is the one tab stop, the arrow keys move the choice, Home and End jump to the ends.
export interface Segment {
  value: string;
  label: string;
  icon?: string;
}
const props = defineProps<{ modelValue: string; options: Segment[]; label: string; labelledby?: string; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const root = ref<HTMLElement | null>(null);

const select = (value: string) => {
  if (!props.disabled && value !== props.modelValue) emit("update:modelValue", value);
};

function onKey(e: KeyboardEvent) {
  const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key) || props.disabled) return;
  e.preventDefault();
  const i = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue));
  const n = props.options.length;
  const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
  select(props.options[next]!.value);
  nextTick(() => root.value?.querySelector<HTMLElement>(`[data-value="${CSS.escape(props.options[next]!.value)}"]`)?.focus());
}
</script>

<template>
  <div
    ref="root"
    role="radiogroup"
    :aria-label="labelledby ? undefined : label"
    :aria-labelledby="labelledby"
    :aria-disabled="disabled || undefined"
    class="inline-flex flex-wrap overflow-hidden rounded-lg border bg-surface"
    @keydown="onKey"
  >
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="o.value === modelValue"
      :tabindex="o.value === modelValue ? 0 : -1"
      :disabled="disabled"
      :data-value="o.value"
      :data-testid="`seg-${o.value}`"
      class="inline-flex h-11 items-center gap-1.5 border-r px-3.5 text-[13.5px] font-medium transition-colors last:border-r-0 focus-visible:-outline-offset-2 disabled:opacity-50 md:h-9"
      :class="o.value === modelValue ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'"
      @click="select(o.value)"
    >
      <Icon v-if="o.icon" :name="o.icon" size="14" />{{ o.label }}
    </button>
  </div>
</template>
