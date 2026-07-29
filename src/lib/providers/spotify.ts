import type { MediaProviderAdapter } from "@/lib/providers/adapter";

/**
 * TODO: implement for real once SPOTIFY_CLIENT_ID/SECRET are available
 * (OAuth client-credentials flow required - not just a static API key).
 */
export const spotifyAdapter: MediaProviderAdapter = {
  provider: "SPOTIFY",
  mediaTypes: ["ALBUM", "TRACK"],
  isConfigured: () => false,
  async search() {
    throw new Error("Spotify adapter not implemented yet");
  },
  async getById() {
    throw new Error("Spotify adapter not implemented yet");
  },
};
