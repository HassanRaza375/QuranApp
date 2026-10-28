// Start-up check of what is saved on the device (Phase 11): compares the list of saved surahs with the files and the reader's store, adopts legacy
// downloads, and watches the connection so queued downloads can start. It reads local stores only (no request), runs when the browser is idle,
// and does nothing when nothing was ever saved.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", () => {
    const run = () => void useDownloadsStore().start();
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 2000);
  });
});
