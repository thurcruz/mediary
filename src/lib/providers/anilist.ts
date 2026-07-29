import type { MediaProviderAdapter } from "@/lib/providers/adapter";

/**
 * TODO: implement for real. AniList's GraphQL API needs no API key, so this
 * is a good candidate for a short follow-up pass - not wired up in this
 * delivery on purpose (Anime/Manga were left out of the vertical slice).
 * Same NormalizedMedia contract as the other adapters, so wiring it up
 * later doesn't touch the search aggregator.
 */
export const anilistAdapter: MediaProviderAdapter = {
  provider: "ANILIST",
  mediaTypes: ["ANIME", "MANGA"],
  isConfigured: () => false,
  async search() {
    throw new Error("AniList adapter not implemented yet");
  },
  async getById() {
    throw new Error("AniList adapter not implemented yet");
  },
};
