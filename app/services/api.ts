// The two upstream clients (the legacy `$api` / `$api2` plugin, minus the plugin). Components never fetch
// third-party APIs directly; they go through the services in this folder.
export const useQuranApi = () => $fetch.create({ baseURL: useRuntimeConfig().public.quranApiBase as string });
export const useQuranApi2 = () => $fetch.create({ baseURL: useRuntimeConfig().public.quranApiBase2 as string });
