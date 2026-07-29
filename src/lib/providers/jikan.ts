import type { MediaProviderAdapter } from "@/lib/providers/adapter";

/**
 * TODO: implement for real. Jikan (unofficial MyAnimeList API) needs no key
 * and is a good candidate for a short follow-up pass. See anilist.ts.
 */
export const jikanAdapter: MediaProviderAdapter = {
  provider: "JIKAN",
  mediaTypes: ["ANIME", "MANGA"],
  isConfigured: () => false,
  async search() {
    throw new Error("Jikan adapter not implemented yet");
  },
  async getById() {
    throw new Error("Jikan adapter not implemented yet");
  },
};
