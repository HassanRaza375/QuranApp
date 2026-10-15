import type { KeyValueStore } from "../app/lib/storage";

/** An in-memory localStorage. `failing` makes every call throw, like blocked site data. */
export function memoryStore(initial: Record<string, string> = {}, failing = false): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  const boom = () => {
    throw new Error("storage blocked");
  };
  return {
    data,
    getItem: (k) => (failing ? boom() : (data.get(k) ?? null)),
    setItem: (k, v) => (failing ? boom() : void data.set(k, v)),
    removeItem: (k) => (failing ? boom() : void data.delete(k)),
  };
}
