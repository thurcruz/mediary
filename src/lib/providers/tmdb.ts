import { ProviderNotConfiguredError, type MediaProviderAdapter, type NormalizedMedia } from "@/lib/providers/adapter";
import type { MediaType } from "@/lib/media-types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type TmdbSearchResult = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
  popularity?: number;
};

type TmdbDetail = TmdbSearchResult & {
  runtime?: number;
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  origin_country?: string[];
};

function apiKey(): string | null {
  return process.env.TMDB_API_KEY?.trim() || null;
}

function tmdbKind(mediaType?: MediaType): "movie" | "tv" {
  return mediaType === "TV_SHOW" ? "tv" : "movie";
}

function toNormalized(kind: "movie" | "tv", raw: TmdbDetail): NormalizedMedia {
  const title = (kind === "movie" ? raw.title : raw.name) ?? "";
  const originalTitle = kind === "movie" ? raw.original_title : raw.original_name;
  const releaseDate = kind === "movie" ? raw.release_date : raw.first_air_date;
  const runtimeMinutes = kind === "movie" ? raw.runtime : raw.episode_run_time?.[0];
  const country = raw.production_countries?.[0]?.iso_3166_1 ?? raw.origin_country?.[0] ?? null;

  return {
    externalId: String(raw.id),
    provider: "TMDB",
    mediaType: kind === "movie" ? "MOVIE" : "TV_SHOW",
    title,
    originalTitle: originalTitle ?? null,
    description: raw.overview ?? null,
    cover: raw.poster_path ? `${TMDB_IMAGE_BASE}/w500${raw.poster_path}` : null,
    banner: raw.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${raw.backdrop_path}` : null,
    releaseDate: releaseDate || null,
    language: raw.original_language ?? null,
    country,
    duration: runtimeMinutes ? runtimeMinutes * 60 : null,
    genres: raw.genres?.map((g) => g.name) ?? [],
    popularityScore: raw.popularity != null ? Math.min(100, raw.popularity) : null,
    metadata: { tmdbId: raw.id },
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = apiKey();
  if (!key) throw new ProviderNotConfiguredError("TMDB");

  const search = new URLSearchParams({ ...params, api_key: key });
  const res = await fetch(`${TMDB_BASE}${path}?${search.toString()}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDb request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Movies/TV via TMDb. Code-complete but returns no results until
 * TMDB_API_KEY is set (see .env.example) - isConfigured() gates the
 * aggregator so a missing key degrades gracefully instead of breaking search.
 */
export const tmdbAdapter: MediaProviderAdapter = {
  provider: "TMDB",
  mediaTypes: ["MOVIE", "TV_SHOW"],
  rateLimit: { requestsPerSecond: 40 },
  isConfigured: () => apiKey() !== null,
  async search(query, mediaType) {
    const kind = tmdbKind(mediaType);
    const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(`/search/${kind}`, { query });
    return data.results.map((r) => toNormalized(kind, r));
  },
  async getById(externalId, mediaType) {
    const kind = tmdbKind(mediaType);
    const data = await tmdbFetch<TmdbDetail>(`/${kind}/${externalId}`);
    return toNormalized(kind, data);
  },
};
