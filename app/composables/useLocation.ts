// The user's location for prayer times and Qibla. No default city; device geolocation only after a tap.
import { applyFix, readLocation, saveLocation, type SavedLocation } from "~/lib/location";

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
              ? "Location access was declined. You can allow it in your browser settings and try again."
              : "Could not get your location. Check that location is on and try again.";
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60 * 1000 },
      );
    });

  return { location, loaded, asking, error, load, requestDevice };
};
