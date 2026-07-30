import type { MediaType, Provider, TitleLanguageKey } from "@/lib/media-types";

/**
 * Shape every provider adapter normalizes its raw API response into. This is
 * intentionally a different type from the Prisma `Media` model - it
 * represents a result that may not be cached in our database yet (no `id`).
 * See mapToMediaFields() in normalize.ts for the explicit mapping between
 * the two.
 */
export interface NormalizedMedia {
  externalId: string;
  provider: Provider;
  mediaType: MediaType;
  title: string;
  originalTitle?: string | null;
  /** Per-language title variants, when the provider exposes them (AniList only, today). */
  titles?: Partial<Record<TitleLanguageKey, string>>;
  description?: string | null;
  cover?: string | null;
  banner?: string | null;
  /** ISO date string (yyyy-mm-dd or full ISO), if known. */
  releaseDate?: string | null;
  language?: string | null;
  country?: string | null;
  /** Seconds - the single cross-media-type duration unit Mediary uses. */
  duration?: number | null;
  genres?: string[];
  /**
   * Normalized into a comparable range by each adapter (providers report
   * "popularity" on wildly different scales/semantics). Null if the source
   * has no popularity signal at all.
   */
  popularityScore?: number | null;
  metadata?: Record<string, unknown>;
}

export interface MediaProviderAdapter {
  provider: Provider;
  mediaTypes: MediaType[];
  /** Hint for future request throttling. Not enforced yet in this pass. */
  rateLimit?: { requestsPerSecond: number };
  /** Whether required env vars (API keys) are present. */
  isConfigured(): boolean;
  search(query: string, mediaType?: MediaType): Promise<NormalizedMedia[]>;
  getById(externalId: string, mediaType?: MediaType): Promise<NormalizedMedia | null>;
}

/** Thrown by an adapter when it's missing required configuration (API key). */
export class ProviderNotConfiguredError extends Error {
  constructor(public readonly provider: Provider) {
    super(`Provider ${provider} is not configured`);
  }
}
