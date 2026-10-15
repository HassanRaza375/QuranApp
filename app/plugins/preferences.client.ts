export default defineNuxtPlugin(() => {
  const store = usePreferencesStore();
  store.load();
  store.listen();
});
