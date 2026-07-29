import type { MediaProviderAdapter } from "@/lib/providers/adapter";

/** TODO: implement for real once RAWG_API_KEY is available. */
export const rawgAdapter: MediaProviderAdapter = {
  provider: "RAWG",
  mediaTypes: ["GAME"],
  isConfigured: () => false,
  async search() {
    throw new Error("RAWG adapter not implemented yet");
  },
  async getById() {
    throw new Error("RAWG adapter not implemented yet");
  },
};
