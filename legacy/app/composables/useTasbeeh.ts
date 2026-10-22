export interface TasbeehPreset {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  color: string;
}

export interface TasbeehEntry {
  count: number;
  target: number;
  cycles: number;
  lifetime: number;
}

const STORAGE_KEY = "quran:tasbeeh:v1";

export const tasbeehPresets: TasbeehPreset[] = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "SubhanAllah",
    meaning: "Glory be to Allah",
    color: "teal",
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    meaning: "All praise is due to Allah",
    color: "cyan-darken-1",
  },
  {
    id: "allahuakbar",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    meaning: "Allah is the Greatest",
    color: "indigo",
  },
  {
    id: "lailahaillallah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    transliteration: "La ilaha illallah",
    meaning: "There is no god but Allah",
    color: "deep-purple",
  },
  {
    id: "astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    meaning: "I seek forgiveness from Allah",
    color: "brown",
  },
  {
    id: "custom",
    arabic: "",
    transliteration: "Custom Dhikr",
    meaning: "Count anything, your own way",
    color: "blue-grey",
  },
];

const DEFAULT_TARGET = 33;

const emptyEntry = (): TasbeehEntry => ({
  count: 0,
  target: DEFAULT_TARGET,
  cycles: 0,
  lifetime: 0,
});

export const getTasbeehPreset = (id: string): TasbeehPreset =>
  tasbeehPresets.find((p) => p.id === id) ?? {
    id,
    arabic: "",
    transliteration: id,
    meaning: "",
    color: "blue-grey",
  };

export const useTasbeeh = () => {
  const entries = useState<Record<string, TasbeehEntry>>(
    "tasbeeh:entries",
    () => ({})
  );

  const getStorage = () => useNuxtApp().$storage;

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    entries.value = $storage.get(STORAGE_KEY, {});
  };

  const persist = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    $storage.set(STORAGE_KEY, entries.value);
  };

  const vibrate = (pattern: number | number[]) => {
    if (import.meta.client && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const getEntry = (id: string): TasbeehEntry => {
    if (!entries.value[id]) {
      entries.value[id] = emptyEntry();
    }
    return entries.value[id];
  };

  // Read-only accessor: safe to call during render, never mutates state.
  const peekEntry = (id: string): TasbeehEntry => entries.value[id] ?? emptyEntry();

  const increment = (id: string) => {
    const entry = getEntry(id);
    entry.count += 1;
    entry.lifetime += 1;

    if (entry.count >= entry.target) {
      entry.cycles += 1;
      entry.count = 0;
      vibrate([120, 60, 120, 60, 120]);
    } else {
      vibrate(15);
    }

    persist();
    return entry;
  };

  const reset = (id: string) => {
    const entry = getEntry(id);
    entry.count = 0;
    persist();
  };

  const setTarget = (id: string, target: number) => {
    const entry = getEntry(id);
    entry.target = target;
    entry.count = 0;
    persist();
  };

  return {
    entries,
    load,
    getEntry,
    peekEntry,
    increment,
    reset,
    setTarget,
  };
};
