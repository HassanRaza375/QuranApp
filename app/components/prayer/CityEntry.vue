<script setup lang="ts">
// "Enter a city": search a place by name (Open-Meteo geocoding), or type latitude and longitude. Shared by the Prayer page,
// the Qibla tab and Settings. Only the typed city is sent, only when Search is pressed, and the page shows what was sent.
// The returned name and country are shown so the user can confirm it is the right place.
import { coordinateText, GEOCODE_ATTRIBUTION, parseCoordinates, type Place } from "~/lib/geocode";

const emit = defineEmits<{ saved: []; cancel: [] }>();
const { setManual } = useLocation();
const search = usePlaceSearch();

const city = ref("");
const country = ref("");
const coords = ref("");
const coordsError = ref("");

async function onSearch() {
  await search.search(city.value, country.value);
}
function choose(p: Place) {
  setManual({ lat: p.lat, lon: p.lon, label: p.label });
  emit("saved");
}
function saveCoords() {
  const c = parseCoordinates(coords.value);
  if (!c) {
    coordsError.value = "Enter latitude then longitude as numbers, for example 31.5204, 74.3587 (latitude from -90 to 90, longitude from -180 to 180).";
    return;
  }
  coordsError.value = "";
  setManual({ lat: c.lat, lon: c.lon });
  emit("saved");
}
</script>

<template>
  <div class="mt-3 rounded-lg border bg-background p-3" data-testid="city-entry">
    <form class="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end" role="search" aria-label="Search for a city" @submit.prevent="onSearch">
      <label class="block text-[12.5px] text-ink-2">
        City
        <Input v-model="city" type="text" autocomplete="off" placeholder="For example Leicester" class="mt-1 !h-11 md:!h-9" data-testid="city-input" />
      </label>
      <label class="block text-[12.5px] text-ink-2">
        Country (optional)
        <Input v-model="country" type="text" autocomplete="off" placeholder="For example United Kingdom" class="mt-1 !h-11 md:!h-9" data-testid="country-input" />
      </label>
      <Button type="submit" class="min-h-11 md:min-h-9" :disabled="!city.trim() || search.status.value === 'searching'" data-testid="city-search">
        {{ search.status.value === "searching" ? "Searching…" : "Search" }}
      </Button>
    </form>
    <p class="mt-2 text-[12px] text-ink-2" data-testid="city-privacy">
      Search sends only the city you type to Open-Meteo’s place search, when you press Search. Nothing else is sent.
    </p>

    <div role="status" aria-live="polite" class="mt-2 text-[13px]" data-testid="city-status">
      <template v-if="search.status.value === 'done' || search.status.value === 'searching'">
        <p v-if="search.sent.value" class="text-ink-2" data-testid="city-sent">Sent to the place search: “{{ search.sent.value }}”</p>
      </template>
      <p v-if="search.status.value === 'offline'" class="text-ink-2" data-testid="city-offline">You’re offline. The place search needs a connection. You can still enter coordinates below.</p>
      <p v-else-if="search.status.value === 'error'" class="text-destructive" data-testid="city-error">{{ search.message.value }} Try again, or enter coordinates below.</p>
      <p v-else-if="search.status.value === 'done' && !search.results.value.length" class="text-ink-2" data-testid="city-none">
        No place found for “{{ search.sent.value }}”. Check the spelling, or add the country.
      </p>
    </div>

    <ul v-if="search.status.value === 'done' && search.results.value.length" class="mt-2 divide-y rounded-md border" aria-label="Places found" data-testid="city-results">
      <li v-for="(p, i) in search.results.value" :key="`${p.lat},${p.lon},${i}`">
        <button type="button" class="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent" :data-testid="`city-result-${i}`" @click="choose(p)">
          <span class="min-w-0">
            <span class="block text-[14px] font-medium">{{ p.label }}</span>
            <span class="block text-[12px] text-ink-2">{{ coordinateText(p) }}</span>
          </span>
          <span class="shrink-0 text-[12.5px] text-brand">Use this place</span>
        </button>
      </li>
    </ul>

    <p v-if="search.status.value === 'done' && search.results.value.length" class="mt-2 text-[12px] text-ink-2">
      Check that the name and country are the place you mean. Places with the same name exist in several countries.
    </p>

    <p class="mt-3 text-[12px] text-ink-2">
      <a :href="GEOCODE_ATTRIBUTION.href" class="underline" target="_blank" rel="noopener noreferrer" data-testid="city-attribution">{{ GEOCODE_ATTRIBUTION.text }}</a>
      (<a href="https://creativecommons.org/licenses/by/4.0/" class="underline" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>).
    </p>

    <form class="mt-3 grid gap-2 border-t pt-3 md:grid-cols-[1fr_auto] md:items-end" aria-label="Enter coordinates" @submit.prevent="saveCoords">
      <label class="block text-[12.5px] text-ink-2">
        Or enter latitude and longitude
        <Input v-model="coords" type="text" inputmode="decimal" autocomplete="off" placeholder="31.5204, 74.3587" class="mt-1 !h-11 md:!h-9" data-testid="coords-input" />
      </label>
      <Button type="submit" variant="outline" class="min-h-11 md:min-h-9" :disabled="!coords.trim()" data-testid="coords-save">Use these coordinates</Button>
    </form>
    <p v-if="coordsError" class="mt-1 text-[12.5px] text-destructive" role="alert" data-testid="coords-error">{{ coordsError }}</p>

    <div class="mt-3 flex justify-end">
      <Button variant="ghost" class="min-h-11 md:min-h-8" data-testid="city-cancel" @click="emit('cancel')">Close</Button>
    </div>
  </div>
</template>
