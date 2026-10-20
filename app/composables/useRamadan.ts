// Ramadan for the page and for Home's banner: the legacy record, the Ramadan month from the calendar service (saved, else fetched when
// asked), the prayer months that cover Ramadan (the same cache and swap as Phase 1), and the plan that combines them with the Hijri
// adjustment. Home reads only what is saved, except in Sha'ban (Hijri month 8), when it fetches Ramadan ahead.
import { paramsFor } from "~/lib/calcMethods";
import { localDateKey } from "~/lib/dates";
import { hijriShown } from "~/lib/hijriAdjust";
import { findRamadan, RAMADAN, type HijriMonthRecord } from "~/lib/hijriMonths";
import type { PrayerDay, PrayerMonthRecord, PrayerRequest } from "~/lib/prayerMonth";
import { syncMonth } from "~/lib/prayerSync";
import { monthsOf, planRamadan, readRamadan, setFastingStatus, setStartOverride, type FastingStatus, type RamadanRecord } from "~/lib/ramadan";
import { getHijriMonth, hijriDeps } from "~/services/hijri.service";
import { prayerSyncDeps } from "~/services/prayer.service";

export type MonthState = "idle" | "loading" | "ready" | "needs-connection" | "error";
export type TimesState = "idle" | "loading" | "ready" | "failed" | "no-location";

export const useRamadan = () => {
  const prefs = usePreferencesStore();
  const { location } = useLocation();
  const prayer = usePrayerTimes();

  const rec = useState<RamadanRecord>("ramadan-record", () => ({ startOverride: null, fastingLog: {}, rest: {} }));
  const month = useState<HijriMonthRecord | null>("ramadan-month", () => null);
  const monthState = useState<MonthState>("ramadan-month-state", () => "idle");
  const extra = useState<PrayerMonthRecord[]>("ramadan-extra-months", () => []);
  const timesState = useState<TimesState>("ramadan-times-state", () => "idle");
  const timesMessage = useState<string>("ramadan-times-message", () => "");

  const todayKey = computed(() => prayer.today.value?.date ?? localDateKey(new Date(prayer.now.value)));
  const allDays = computed<PrayerDay[]>(() => {
    const seen = new Map<string, PrayerDay>();
    for (const r of [prayer.record.value, prayer.nextRecord.value, ...extra.value]) for (const d of r?.days ?? []) seen.set(d.date, d);
    return [...seen.values()];
  });
  const plan = computed(() => planRamadan({ today: todayKey.value, adjust: prefs.prefs.hijriAdjust, override: rec.value.startOverride, month: month.value, days: allDays.value }));
  const todayDay = computed<PrayerDay | null>(() => allDays.value.find((d) => d.date === todayKey.value) ?? null);

  const loadRecord = () => {
    rec.value = readRamadan();
  };

  /** The Ramadan month: saved if there is one; fetched only when `network` is true. */
  async function loadMonth(network: boolean) {
    monthState.value = "loading";
    let failed: "offline" | "error" | null = null;
    const deps = hijriDeps();
    const out = await findRamadan(todayKey.value, async (y) => {
      const r = await getHijriMonth(deps, y, RAMADAN, { network });
      if (r.status === "ok") return r.record;
      failed = r.kind;
      return null;
    });
    if (out.status === "found") {
      month.value = out.record;
      monthState.value = "ready";
    } else {
      monthState.value = failed === "error" ? "error" : "needs-connection";
    }
  }

  const request = (m: string): PrayerRequest | null => (location.value ? { lat: location.value.lat, lon: location.value.lon, month: m, ...paramsFor(prefs.prefs.fiqh, prefs.prefs.calc) } : null);

  /** The prayer months Ramadan falls in (saved, or fetched and saved). A failed fetch keeps what is saved. */
  async function loadTimes() {
    if (!location.value) {
      timesState.value = "no-location";
      return;
    }
    const months = monthsOf(plan.value);
    if (!months.length) {
      timesState.value = "idle";
      return;
    }
    timesState.value = "loading";
    timesMessage.value = "";
    const got: PrayerMonthRecord[] = [];
    let failure = "";
    for (const m of months) {
      const req = request(m);
      if (!req) continue;
      const out = await syncMonth(prayerSyncDeps(), req);
      if (out.record) got.push(out.record);
      if (out.status === "failed" && !failure) failure = out.kind === "offline" ? "offline" : "error";
    }
    extra.value = got;
    const covered = months.every((m) => got.some((g) => g.month === m));
    timesState.value = covered ? "ready" : got.length ? "ready" : "failed";
    timesMessage.value = covered ? "" : failure;
  }

  /** The page: everything saved, the month fetched when needed, the times when asked (or when Ramadan is a month away). */
  async function load(opts: { network?: boolean; times?: boolean } = {}) {
    loadRecord();
    const network = opts.network ?? true;
    await loadMonth(network);
    const near = plan.value.state === "before" && plan.value.daysUntil !== null && plan.value.daysUntil <= 31;
    if (network && (opts.times || near || plan.value.state === "during")) await loadTimes();
  }

  /** Home: only what is saved, except in Sha'ban (Hijri month 8), when Ramadan is fetched ahead. */
  async function loadForHome() {
    loadRecord();
    const shown = hijriShown(allDays.value, todayKey.value, prefs.prefs.hijriAdjust);
    if (shown?.date.month === 8) await load({ network: true, times: true });
    else await load({ network: false, times: false });
  }

  function setOverride(key: string | null) {
    setStartOverride(key);
    loadRecord();
    void loadTimes();
  }
  function setFasting(date: string, status: FastingStatus | null) {
    setFastingStatus(date, status);
    loadRecord();
  }

  return { rec, month, monthState, timesState, timesMessage, plan, todayKey, todayDay, allDays, load, loadForHome, loadTimes, loadRecord, setOverride, setFasting };
};
