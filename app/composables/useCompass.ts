// The live compass: listens to the device's orientation sensors, corrects the heading for magnetic declination, smooths
// it, and reports the state the page needs. The maths is in lib/compass.ts and lib/declination.ts (unit-tested); this file only
// wires the browser in. Every listener is removed with the same arguments it was added with.
import { accuracyNote, facing, readingFromEvent, smooth, trueHeading, type OrientationLike, type SensorReading, type SensorSource } from "~/lib/compass";
import { declination } from "~/lib/declination";

export type CompassMode = "idle" | "needs-permission" | "starting" | "live" | "denied" | "no-sensor";

const NO_SENSOR_AFTER_MS = 2000;
const STATUS_EVERY_MS = 1000;

type PermissionApi = { requestPermission?: () => Promise<"granted" | "denied"> };

export const useCompass = (bearing: Ref<number | null>, place: Ref<{ lat: number; lon: number } | null>) => {
  const prefs = usePreferencesStore();
  const mode = ref<CompassMode>("idle");
  /** the smoothed TRUE heading, degrees clockwise from true north, or null before the first reading */
  const heading = ref<number | null>(null);
  const source = ref<SensorSource | null>(null);
  const accuracy = ref<number | null>(null);
  const aligned = ref(false);
  /** the status line for a screen reader: changes at most once a second, or at once when "aligned" changes */
  const status = ref("");

  const declinationResult = computed(() => (place.value ? declination(place.value.lat, place.value.lon, new Date()) : null));
  const corrected = computed(() => declinationResult.value?.ok === true);
  const note = computed(() => accuracyNote(accuracy.value, source.value));

  let latest: SensorReading | null = null;
  let raf = 0;
  let noSensorTimer: ReturnType<typeof setTimeout> | undefined;
  let statusTimer: ReturnType<typeof setInterval> | undefined;
  let listening = false;
  let lastStatusAt = 0;

  const reducedMotion = () => prefs.prefs.reducedMotion || (typeof document !== "undefined" && document.documentElement.dataset.reducedMotion === "true");
  const screenAngle = () => (typeof screen !== "undefined" && screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : 0);

  const onAbsolute = (e: Event) => take("deviceorientationabsolute", e as unknown as OrientationLike);
  const onRelative = (e: Event) => take("deviceorientation", e as unknown as OrientationLike);

  function take(type: "deviceorientation" | "deviceorientationabsolute", e: OrientationLike) {
    const r = readingFromEvent(type, e, screenAngle());
    if (!r) return;
    latest = r;
    if (mode.value !== "live") {
      mode.value = "live";
      clearTimeout(noSensorTimer);
    }
    if (!raf) raf = requestAnimationFrame(apply);
  }

  function apply() {
    raf = 0;
    if (!latest) return;
    const d = declinationResult.value;
    const target = trueHeading(latest.heading, d?.ok ? d.degrees : 0);
    heading.value = heading.value === null || reducedMotion() ? target : smooth(heading.value, target, 0.25);
    source.value = latest.source;
    accuracy.value = latest.accuracy;
    if (bearing.value !== null) {
      const f = facing(bearing.value, heading.value, aligned.value);
      if (f.aligned !== aligned.value) {
        aligned.value = f.aligned;
        // one short vibration on ENTERING alignment, where the browser can (not on iPhone); never repeated while aligned
        if (f.aligned && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(60);
        updateStatus(true);
      }
      if (!status.value) updateStatus(true);
    }
  }

  function updateStatus(force = false) {
    const nowMs = Date.now();
    if (!force && nowMs - lastStatusAt < STATUS_EVERY_MS) return;
    if (heading.value === null || bearing.value === null) return;
    const text = facing(bearing.value, heading.value, aligned.value).text;
    if (text !== status.value) status.value = text;
    lastStatusAt = nowMs;
  }

  function listen() {
    if (listening) return;
    listening = true;
    mode.value = "starting";
    window.addEventListener("deviceorientationabsolute", onAbsolute, true);
    window.addEventListener("deviceorientation", onRelative, true);
    statusTimer = setInterval(() => updateStatus(), STATUS_EVERY_MS);
    // no usable reading soon: this device has no compass (a desktop), or its browser gives no north-referenced value
    noSensorTimer = setTimeout(() => {
      if (mode.value === "starting") mode.value = "no-sensor";
    }, NO_SENSOR_AFTER_MS);
  }

  function unlisten() {
    if (!listening) return;
    listening = false;
    window.removeEventListener("deviceorientationabsolute", onAbsolute, true);
    window.removeEventListener("deviceorientation", onRelative, true);
    clearInterval(statusTimer);
    clearTimeout(noSensorTimer);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /** The page calls this when it opens. On an iPhone the sensors need a tap first, so it only says so. */
  function start() {
    if (typeof window === "undefined") return;
    const api = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : null) as unknown as PermissionApi | null;
    if (api && typeof api.requestPermission === "function") {
      mode.value = "needs-permission";
      return;
    }
    listen();
  }

  /** From the "Enable compass" button (a tap): asks the iPhone for motion and orientation access. */
  async function enable() {
    const api = DeviceOrientationEvent as unknown as PermissionApi;
    try {
      const answer = await api.requestPermission!();
      if (answer === "granted") listen();
      else mode.value = "denied";
    } catch {
      mode.value = "denied";
    }
  }

  onBeforeUnmount(unlisten);

  return { mode, heading, source, accuracy, aligned, status, corrected, declinationResult, note, start, enable, stop: unlisten };
};
