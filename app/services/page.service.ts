import { useQuranApi2 } from "./api";

export const PageService = {
  // The legacy copy used an absolute http:// URL here, which the API redirects to https without CORS headers
  // (see the README gotcha). The base URL is https, so a relative path is used.
  getPageByNumber: (pageNo: number) => useQuranApi2()(`/page/${pageNo}/quran-uthmani`),
};
