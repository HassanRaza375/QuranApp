<script setup lang="ts">
// The dial. Live: the dial turns with the phone so the Qibla marker points to the Qibla (north moves, the arrow at the top is where
// the phone points). Static (no sensor): north stays at the top and the marker sits at the bearing; it never rotates and says
// nothing like "turn left". The marker is the accent colour (gold is only for verse markers) and a square-in-circle shape, so it
// is not told apart by colour alone.
const props = defineProps<{ bearing: number; heading: number | null; aligned: boolean; live: boolean }>();

const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
const rotation = computed(() => (props.live && props.heading !== null ? -props.heading : 0));
const label = computed(() =>
  props.live && props.heading !== null
    ? `Qibla compass. The Qibla is ${Math.round(props.bearing)} degrees from north. You are facing ${Math.round(props.heading)} degrees.${props.aligned ? " You are facing the Qibla." : ""}`
    : `Qibla direction. North is at the top and the Qibla is at ${Math.round(props.bearing)} degrees from north.`,
);
</script>

<template>
  <svg viewBox="0 0 300 300" class="mx-auto block w-full max-w-[320px]" role="img" :aria-label="label" data-testid="compass" :data-aligned="aligned ? 'true' : 'false'" :data-live="live ? 'true' : 'false'">
    <g :transform="`rotate(${rotation} 150 150)`" data-testid="dial">
      <circle cx="150" cy="150" r="120" fill="var(--surface)" :stroke="aligned ? 'var(--accent)' : 'var(--border)'" stroke-width="3" />
      <line v-for="a in ticks" :key="a" x1="150" y1="30" x2="150" :y2="30 + (a % 90 === 0 ? 14 : a % 30 === 0 ? 10 : 6)" :transform="`rotate(${a} 150 150)`" stroke="var(--ink-2)" :stroke-width="a % 90 === 0 ? 2 : 1" />
      <text x="150" y="62" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="600" fill="var(--ink)">N</text>
      <text x="238" y="150" text-anchor="middle" dominant-baseline="middle" font-size="15" fill="var(--ink-2)">E</text>
      <text x="150" y="238" text-anchor="middle" dominant-baseline="middle" font-size="15" fill="var(--ink-2)">S</text>
      <text x="62" y="150" text-anchor="middle" dominant-baseline="middle" font-size="15" fill="var(--ink-2)">W</text>
      <g :transform="`rotate(${bearing} 150 150)`" data-testid="marker">
        <line x1="150" y1="104" x2="150" y2="44" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4" />
        <circle cx="150" cy="30" r="11" fill="var(--accent)" />
        <rect x="145.5" y="25.5" width="9" height="9" rx="1.5" fill="var(--background)" />
      </g>
    </g>
    <polygon v-if="live" points="150,27 140,6 160,6" fill="var(--accent)" />
    <text v-if="live && heading !== null" x="150" y="150" text-anchor="middle" dominant-baseline="middle" font-size="30" font-family="var(--font-serif)" fill="var(--ink)" data-testid="heading-text">{{ Math.round(heading) }}°</text>
    <text v-if="live && heading !== null" x="150" y="176" text-anchor="middle" font-size="11" fill="var(--ink-2)">you are facing</text>
    <text v-if="!live" x="150" y="150" text-anchor="middle" dominant-baseline="middle" font-size="30" font-family="var(--font-serif)" fill="var(--ink)" data-testid="static-bearing">{{ bearing.toFixed(0) }}°</text>
    <text v-if="!live" x="150" y="176" text-anchor="middle" font-size="11" fill="var(--ink-2)">Qibla</text>
  </svg>
</template>
