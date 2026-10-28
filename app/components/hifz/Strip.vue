<script setup lang="ts">
// A surah as a row of cells, one per ayah, coloured by strength: not started, learning, memorized, strong (gold: Hifz mastery), and an outlined
// "needs work" cell; a short mark on a cell's start edge says the join from the ayah before needs work. It is also read out as a sentence, and
// the key (HifzKey) names every colour, so colour is never the only signal.
import { summarize, type AyahCell } from "~/lib/hifz/overview";

const props = withDefaults(defineProps<{ cells: AyahCell[]; size?: "sm" | "md" }>(), { size: "md" });
const label = computed(() => summarize(props.cells));
const px = computed(() => (props.size === "sm" ? 9 : 18));
const cell = (c: AyahCell) =>
  c.s === "weak" ? "bg-transparent ring-2 ring-inset ring-weak" : c.s === "strong" ? "bg-gold" : c.s === "memorized" ? "bg-s3" : c.s === "learning" ? "bg-s2" : "bg-s1";
</script>

<template>
  <div>
    <div role="img" :aria-label="label" class="grid gap-[3px]" :style="{ gridTemplateColumns: `repeat(auto-fill, ${px}px)` }" data-testid="hifz-strip">
      <i
        v-for="c in cells"
        :key="c.ayah"
        class="relative block"
        :class="[cell(c), size === 'sm' ? 'rounded-full' : 'rounded-[3px]', c.joinWeak ? 'after:absolute after:-left-[3px] after:top-[30%] after:h-[40%] after:w-[3px] after:bg-weak' : '']"
        :style="{ width: `${px}px`, height: `${px}px` }"
        :data-s="c.s"
        :data-join="c.joinWeak ? 'weak' : undefined"
      />
    </div>
  </div>
</template>
