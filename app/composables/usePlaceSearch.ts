// The city search of the "Enter a city" form. The only network call is one GET to Open-Meteo's geocoding API, made when
// Search is pressed, carrying only the typed text. The text that was sent is kept so the page can show it.
import { filterByCountry, geocodeUrl, parseGeocode, type Place } from "~/lib/geocode";

export type SearchStatus = "idle" | "searching" | "done" | "offline" | "error";

export const usePlaceSearch = () => {
  const status = ref<SearchStatus>("idle");
  const results = ref<Place[]>([]);
  /** exactly what was typed and sent (the city), shown under the form */
  const sent = ref("");
  const message = ref("");

  async function search(city: string, country: string) {
    const name = city.trim();
    if (!name) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      status.value = "offline";
      return;
    }
    status.value = "searching";
    sent.value = name;
    message.value = "";
    try {
      const json = await $fetch<unknown>(geocodeUrl(name));
      results.value = filterByCountry(parseGeocode(json), country);
      status.value = "done";
    } catch {
      status.value = typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error";
      message.value = "The place search is not available right now.";
    }
  }

  function reset() {
    status.value = "idle";
    results.value = [];
    sent.value = "";
    message.value = "";
  }

  return { status, results, sent, message, search, reset };
};
