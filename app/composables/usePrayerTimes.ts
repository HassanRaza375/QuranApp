// Prayer times for Home (and later the Prayer page and Settings). Reads the cached month first and shows it at once,
// fetches and swaps in the background, and never writes to the legacy `prayer_*` keys.
//
// States: "no-location" (nothing to compute), "loading" (no cached month yet), "ready" (a month is cached; it may be
// refreshing or the last refresh may have failed), "failed" (no cached month and the fetch failed).
import { pruneOldPrayerMonths } from "~/db/revampDb";
import { dateKeyInZone, nextPrayer, type NextPrayer } from "~/lib/prayerClock";
import { roundCoord, type PrayerDay, type PrayerMonthRecord, type PrayerRequest } from "~/lib/prayerMonth";
import { syncMonth, type SyncOutcome } from "~/lib/prayerSync";
import { localMonthKey, nextMonthKey } from "~/lib/dates";
import { paramsFor } from "~/lib/calcMethods";
import { prayerSyncDeps } from "~/services/prayer.service";

type Status = "no-location" | "loading" | "ready" | "failed";
export interface Failure {
  kind: "offline" | "error";
  reason: string;
}

const monthOfKey = (dateKey: string) => dateKey.slice(0, 7);

export const usePrayerTimes = () => {
  const { location } = useLocation();
  const prefs = usePreferencesStore();

  const status = useState<Status>("prayer-status", () => "loading");
  const record = useState<PrayerMonthRecord | null>("prayer-record", () => null);
  const nextRecord = useState<PrayerMonthRecord | null>("prayer-next-record", () => null);
  const failure = useState<Failure | null>("prayer-failure", () => null);
  const refreshing = useState<boolean>("prayer-refreshing", () => false);
  const now = useState<number>("prayer-now", () => Date.now());

  const request = (month: string): PrayerRequest | null => {
    if (!location.value) return null;
    return { lat: location.value.lat, lon: location.value.lon, month, ...paramsFor(prefs.prefs.fiqh, prefs.prefs.calc) };
  };

  const timezone = computed(() => record.value?.timezone ?? null);
  const todayKey = computed(() => (timezone.value ? dateKeyInZone(new Date(now.value), timezone.value) : null));

  const dayOf = (date: string | null): PrayerDay | null => {
    if (!date) return null;
    return [record.value, nextRecord.value].flatMap((r) => r?.days ?? []).find((d) => d.date === date) ?? null;
  };
  const today = computed(() => dayOf(todayKey.value));
  const tomorrow = computed(() => {
    if (!todayKey.value || !timezone.value) return null;
    const t = new Date(`${todayKey.value}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + 1);
    return dayOf(t.toISOString().slice(0, 10));
  });
  const next = computed<NextPrayer | null>(() => (timezone.value ? nextPrayer(today.value, tomorrow.value, new Date(now.value), timezone.value) : null));

  const apply = (o: SyncOutcome, which: "current" | "next") => {
    const rec = o.record;
    if (rec) (which === "current" ? record : nextRecord).value = rec;
    return o;
  };

  async function sync(month: string, which: "current" | "next", force = false): Promise<SyncOutcome | null> {
    const req = request(month);
    if (!req) return null;
    return apply(await syncMonth(prayerSyncDeps(), req, { force }), which);
  }

  /** Loads the month that "today" falls in (in the location's zone), then the next month if it is needed. */
  async function load(opts: { force?: boolean } = {}) {
    if (!location.value) {
      status.value = "no-location";
      return;
    }
    // A different place or calculation method means the cached months in memory are for something else.
    const want = paramsFor(prefs.prefs.fiqh, prefs.prefs.calc);
    const matches = (r: PrayerMonthRecord | null) =>
      !!r && r.lat === Number(roundCoord(location.value!.lat)) && r.lon === Number(roundCoord(location.value!.lon)) && r.method === want.method && r.school === want.school;
    if (!matches(record.value)) record.value = null;
    if (!matches(nextRecord.value)) nextRecord.value = null;
    refreshing.value = true;
    failure.value = null;
    if (!record.value) status.value = "loading";
    try {
      const first = await sync(localMonthKey(new Date(now.value)), "current", opts.force);
      let outcome = first;
      if (outcome?.status === "failed") failure.value = { kind: outcome.kind, reason: outcome.reason };

      // The location's calendar day can be in a different month than the device's (near a month end).
      if (record.value) {
        const tzToday = dateKeyInZone(new Date(now.value), record.value.timezone);
        if (monthOfKey(tzToday) !== record.value.month) {
          outcome = await sync(monthOfKey(tzToday), "current", opts.force);
          if (outcome?.status === "failed") failure.value = { kind: outcome.kind, reason: outcome.reason };
        }
        // Next month: in the background when fewer than 7 days are left, or when tomorrow is not in this month.
        const tzDay = Number(dateKeyInZone(new Date(now.value), record.value.timezone).slice(8, 10));
        const left = record.value.days.length - tzDay + 1;
        if (left < 7 || !tomorrow.value) {
          const n = await sync(nextMonthKey(record.value.month), "next", opts.force);
          if (n?.status === "failed" && !failure.value) failure.value = { kind: n.kind, reason: n.reason };
        }
        void pruneOldPrayerMonths(previousMonths(record.value.month, 2));
      }
      status.value = record.value ? "ready" : "failed";
    } finally {
      refreshing.value = false;
    }
  }

  /** Re-fetches the current month now, keeping the old times if it fails. Used by the Prayer page and Settings (Phase 5), not by Home. */
  const refresh = () => load({ force: true });

  const tick = () => {
    now.value = Date.now();
  };

  const nextRecordDays = computed(() => nextRecord.value?.days ?? null);

  return { status, record, nextRecord, nextRecordDays, failure, refreshing, today, tomorrow, next, timezone, now, load, refresh, tick };
};

/** "YYYY-MM" that is `back` months before `month`. */
function previousMonths(month: string, back: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) - back;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}
