import type { MediaProviderAdapter, NormalizedMedia } from "@/lib/providers/adapter";
import type { MediaType } from "@/lib/media-types";
import { tmdbAdapter } from "@/lib/providers/tmdb";
import { openLibraryAdapter } from "@/lib/providers/open-library";
import { googleBooksAdapter } from "@/lib/providers/google-books";
import { anilistAdapter } from "@/lib/providers/anilist";
import { jikanAdapter } from "@/lib/providers/jikan";
import { spotifyAdapter } from "@/lib/providers/spotify";
import { musicbrainzAdapter } from "@/lib/providers/musicbrainz";
import { rawgAdapter } from "@/lib/providers/rawg";

export const ALL_ADAPTERS: MediaProviderAdapter[] = [
  tmdbAdapter,
  openLibraryAdapter,
  googleBooksAdapter,
  anilistAdapter,
  jikanAdapter,
  spotifyAdapter,
  musicbrainzAdapter,
  rawgAdapter,
];

export function adaptersForMediaType(mediaType: MediaType): MediaProviderAdapter[] {
  return ALL_ADAPTERS.filter((adapter) => adapter.mediaTypes.includes(mediaType));
}

export function adapterForProvider(provider: string): MediaProviderAdapter | undefined {
  return ALL_ADAPTERS.find((adapter) => adapter.provider === provider);
}

/** True if at least one adapter for this media type can actually run right now. */
export function isMediaTypeLive(mediaType: MediaType): boolean {
  return adaptersForMediaType(mediaType).some((adapter) => adapter.isConfigured());
}

/**
 * Fan out to every configured adapter for the given media types, merge and
 * de-dupe the results, and rank by normalized popularity. Adapters that
 * aren't configured (missing API key, or not implemented yet) are skipped
 * rather than failing the whole search; a single adapter throwing is
 * likewise swallowed via allSettled so one flaky provider can't break search
 * for the others.
 */
export async function searchAllMedia(
  query: string,
  enabledMediaTypes: MediaType[],
): Promise<NormalizedMedia[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tasks = enabledMediaTypes.flatMap((mediaType) =>
    adaptersForMediaType(mediaType)
      .filter((adapter) => adapter.isConfigured())
      .map((adapter) => adapter.search(trimmed, mediaType)),
  );

  const settled = await Promise.allSettled(tasks);
  const results = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    const key = `${r.provider}:${r.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
}
