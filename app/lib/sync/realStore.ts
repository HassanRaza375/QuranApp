// Phase 17C: the real storage as a sync `Store`. Writes are silent, so what sync writes into storage does not itself queue more sync.
import { getRaw, remove, setRaw, silently } from "../storage";
import type { Store } from "./adapters";

export const realStore: Store = {
  get: (k) => getRaw(k),
  set: (k, v) => void silently(() => setRaw(k, v)),
  remove: (k) => silently(() => remove(k)),
};
