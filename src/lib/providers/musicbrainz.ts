import type { MediaProviderAdapter } from "@/lib/providers/adapter";

/**
 * TODO: implement for real. No key required, but MusicBrainz's API etiquette
 * expects ~1 request/second - the shared rateLimit hint on the adapter
 * interface exists for exactly this, throttling isn't enforced yet though.
 */
export const musicbrainzAdapter: MediaProviderAdapter = {
  provider: "MUSICBRAINZ",
  mediaTypes: ["ALBUM", "TRACK"],
  rateLimit: { requestsPerSecond: 1 },
  isConfigured: () => false,
  async search() {
    throw new Error("MusicBrainz adapter not implemented yet");
  },
  async getById() {
    throw new Error("MusicBrainz adapter not implemented yet");
  },
};
