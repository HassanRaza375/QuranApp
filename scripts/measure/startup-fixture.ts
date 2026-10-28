// Writes a Hifz record (legacy shape, `quran:hifz:v2`) with a few started surahs, for scripts/measure/startup.mjs.
// Run: node_modules/.bin/jiti scripts/measure/startup-fixture.ts <out.json>
import { writeFileSync } from "node:fs";
import * as E from "../../app/lib/hifz/engine";

const today = E.todayKey();
const old = new Date(Date.now() - 5 * 864e5);
const OLD = `${old.getFullYear()}-${String(old.getMonth() + 1).padStart(2, "0")}-${String(old.getDate()).padStart(2, "0")}`;
let d = E.emptyData();
d = E.createTarget(d, { surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 }, "t-mulk", 1).data;
d = E.createTarget(d, { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t-ikhlas", 2).data;
d = E.introduceAyahs(d, "t-mulk", 2, OLD).data;
d = E.introduceAyahs(d, "t-ikhlas", 4, OLD).data;
for (const [t, a] of [["t-mulk", 1], ["t-mulk", 2], ["t-ikhlas", 1], ["t-ikhlas", 2], ["t-ikhlas", 4]] as const) d = E.gradeAyah(d, t, a, "good", 0, OLD);
writeFileSync(process.argv[2]!, JSON.stringify({ today, record: d }));
