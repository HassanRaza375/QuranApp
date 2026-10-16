<script setup lang="ts">
// One logical menu: a popover (DropdownMenu) on desktop, a bottom sheet (Drawer) on mobile, with 46px rows.
// Used for every "icon + value" dropdown in the design (theme, translation, reciter, sort ...).
import { useMediaQuery } from "@vueuse/core";

export interface MenuOption {
  value: string;
  label: string;
  icon?: string;
  /** a small heading shown above this option (and the ones after it, until the next heading) */
  heading?: string;
}

const props = defineProps<{ modelValue: string | null; options: MenuOption[]; label: string; title?: string; icon?: string; hint?: string; wide?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const isDesktop = useMediaQuery("(min-width: 768px)");
const open = ref(false);
const current = computed(() => props.options.find((o) => o.value === props.modelValue));
const pick = (v: string) => {
  if (!open.value) return; // the radio group can report the same choice a second time while the menu closes
  emit("update:modelValue", v);
  open.value = false;
};
</script>

<template>
  <DropdownMenu v-if="isDesktop" v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" :current="current">
        <Button variant="outline" :aria-label="`${label}: ${current?.label ?? ''}`" class="gap-2">
          <Icon v-if="icon ?? current?.icon" :name="(icon ?? current?.icon)!" size="16" />
          <span>{{ current?.label }}</span>
          <Icon name="lucide:chevron-down" size="14" class="text-ink-3" />
        </Button>
      </slot>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" :class="wide ? 'min-w-64' : 'min-w-44'">
      <DropdownMenuRadioGroup :model-value="modelValue ?? ''" @update:model-value="(v) => pick(String(v))">
        <template v-for="o in options" :key="o.value">
          <div v-if="o.heading" class="px-2 pb-1 pt-2 text-[11.5px] font-medium uppercase tracking-wide text-ink-2" role="presentation" data-testid="menu-heading">{{ o.heading }}</div>
          <DropdownMenuRadioItem :value="o.value">
            <Icon v-if="o.icon" :name="o.icon" size="16" class="mr-2" />{{ o.label }}
          </DropdownMenuRadioItem>
        </template>
      </DropdownMenuRadioGroup>
      <p v-if="hint" class="border-t px-2 pb-1.5 pt-2 text-[12px] text-ink-2" data-testid="menu-hint">{{ hint }}</p>
    </DropdownMenuContent>
  </DropdownMenu>

  <Drawer v-else v-model:open="open">
    <DrawerTrigger as-child>
      <slot name="trigger" :current="current">
        <Button variant="outline" :aria-label="`${label}: ${current?.label ?? ''}`" class="min-h-11 gap-2">
          <Icon v-if="icon ?? current?.icon" :name="(icon ?? current?.icon)!" size="16" />
          <span>{{ current?.label }}</span>
          <Icon name="lucide:chevron-down" size="14" class="text-ink-3" />
        </Button>
      </slot>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{{ title ?? label }}</DrawerTitle>
        <DrawerDescription class="sr-only">Choose one option</DrawerDescription>
      </DrawerHeader>
      <ul class="px-2 pb-6" role="listbox" :aria-label="label">
        <template v-for="o in options" :key="o.value">
        <li v-if="o.heading" role="presentation" class="px-3 pb-1 pt-3 text-[11.5px] font-medium uppercase tracking-wide text-ink-2" data-testid="menu-heading">{{ o.heading }}</li>
        <li role="option" :aria-selected="o.value === modelValue">
          <button
            type="button"
            class="flex min-h-[46px] w-full items-center gap-3 rounded-md px-3 text-left text-[15px] hover:bg-accent"
            :class="o.value === modelValue ? 'text-brand font-medium' : ''"
            @click="pick(o.value)"
          >
            <Icon v-if="o.icon" :name="o.icon" size="18" />
            <span class="flex-1">{{ o.label }}</span>
            <Icon v-if="o.value === modelValue" name="lucide:check" size="18" />
          </button>
        </li>
        </template>
      </ul>
      <p v-if="hint" class="px-5 pb-6 text-[12.5px] text-ink-2" data-testid="menu-hint">{{ hint }}</p>
    </DrawerContent>
  </Drawer>
</template>
