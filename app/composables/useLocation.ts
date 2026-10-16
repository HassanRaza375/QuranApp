// The user's location for prayer times and Qibla. No default city; device geolocation only after a tap; or a place the user
// searched for or typed as coordinates ("manual").
import { applyFix, readLocation, saveLocation, type SavedLocation } from "~/lib/location";
import { coordinateText } from "~/lib/geocode";

/** How a saved place is shown: its name when it has one, else its coordinates. */
export const describePlace = (loc: SavedLocation): string => loc.label ?? coordinateText(loc);

export const useLocation = () => {
  const location = useState<SavedLocation | null>("location", () => null);
  const loaded = useState<boolean>("location-loaded", () => false);
  const asking = useState<boolean>("location-asking", () => false);
  const error = useState<string | null>("location-error", () => null);

  const load = () => {
    location.value = readLocation();
    loaded.value = true;
  };

  /** Asks the browser for the device position. Call this from a tap only. */
  const requestDevice = (): Promise<boolean> =>
    new Promise((resolve) => {
      error.value = null;
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        error.value = "This browser cannot share a location.";
        return resolve(false);
      }
      asking.value = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          asking.value = false;
          const next = applyFix(location.value && location.value.source === "device" ? location.value : null, { lat: pos.coords.latitude, lon: pos.coords.longitude }, Date.now());
          saveLocation(next);
          location.value = next;
          resolve(true);
        },
        (err) => {
          asking.value = false;
          error.value =
            err.code === err.PERMISSION_DENIED
              ? "Location access was declined. You can allow it in your browser settings and try again, or enter a city."
              : "Could not get your location. Check that location is on and try again, or enter a city.";
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60 * 1000 },
      );
    });

  /** Saves a place the user chose (a search result or typed coordinates). It always replaces the saved place: the user asked for it. */
  const setManual = (place: { lat: number; lon: number; label?: string }) => {
    const next: SavedLocation = { lat: place.lat, lon: place.lon, source: "manual", updatedAt: Date.now(), ...(place.label ? { label: place.label } : {}) };
    saveLocation(next);
    location.value = next;
    error.value = null;
  };

  return { location, loaded, asking, error, load, requestDevice, setManual };
};
