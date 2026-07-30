import type { MediaProviderAdapter, NormalizedMedia } from "@/lib/providers/adapter";
import type { MediaType } from "@/lib/media-types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

type AnilistKind = "ANIME" | "MANGA";

type AnilistMedia = {
  id: number;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null };
  bannerImage?: string | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  duration?: number | null;
  genres?: string[];
  countryOfOrigin?: string | null;
  popularity?: number | null;
  averageScore?: number | null;
  format?: string | null;
  episodes?: number | null;
  chapters?: number | null;
};

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large }
  bannerImage
  startDate { year month day }
  duration
  genres
  countryOfOrigin
  popularity
  averageScore
  format
  episodes
  chapters
`;

function anilistKind(mediaType?: MediaType): AnilistKind {
  return mediaType === "MANGA" ? "MANGA" : "ANIME";
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

function toReleaseDate(start?: AnilistMedia["startDate"]): string | null {
  if (!start?.year) return null;
  const month = String(start.month ?? 1).padStart(2, "0");
  const day = String(start.day ?? 1).padStart(2, "0");
  return `${start.year}-${month}-${day}`;
}

function toNormalized(kind: AnilistKind, raw: AnilistMedia): NormalizedMedia {
  return {
    externalId: String(raw.id),
    provider: "ANILIST",
    mediaType: kind,
    title: raw.title.english ?? raw.title.romaji ?? raw.title.native ?? "",
    originalTitle: raw.title.native ?? null,
    titles: {
      ...(raw.title.english ? { en: raw.title.english } : {}),
      ...(raw.title.native ? { ja: raw.title.native } : {}),
      ...(raw.title.romaji ? { romaji: raw.title.romaji } : {}),
    },
    description: raw.description ? stripHtml(raw.description) : null,
    cover: raw.coverImage?.extraLarge ?? raw.coverImage?.large ?? null,
    banner: raw.bannerImage ?? null,
    releaseDate: toReleaseDate(raw.startDate),
    country: raw.countryOfOrigin ?? null,
    duration: kind === "ANIME" && raw.duration ? raw.duration * 60 : null,
    genres: raw.genres ?? [],
    // AniList's `popularity` is a raw list-count (can run into the hundreds
    // of thousands) - scaled down to stay comparable with the other
    // adapters' 0-100 popularityScore convention.
    popularityScore: raw.popularity ? Math.min(100, Math.round(raw.popularity / 1000)) : null,
    metadata: {
      anilistId: raw.id,
      format: raw.format ?? null,
      episodes: raw.episodes ?? null,
      chapters: raw.chapters ?? null,
      averageScore: raw.averageScore ?? null,
    },
  };
}

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`AniList request failed: ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`AniList request failed: ${json.errors[0].message}`);
  }
  return json.data as T;
}

/** Anime/manga via AniList's public GraphQL API. No API key required. */
export const anilistAdapter: MediaProviderAdapter = {
  provider: "ANILIST",
  mediaTypes: ["ANIME", "MANGA"],
  rateLimit: { requestsPerSecond: 1 },
  isConfigured: () => true,
  async search(query, mediaType) {
    const kind = anilistKind(mediaType);
    const data = await anilistFetch<{ Page: { media: AnilistMedia[] } }>(
      `query ($search: String, $type: MediaType) {
        Page(page: 1, perPage: 20) {
          media(search: $search, type: $type, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
        }
      }`,
      { search: query, type: kind },
    );
    return data.Page.media.map((m) => toNormalized(kind, m));
  },
  async getById(externalId, mediaType) {
    const kind = anilistKind(mediaType);
    const data = await anilistFetch<{ Media: AnilistMedia }>(
      `query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) { ${MEDIA_FIELDS} }
      }`,
      { id: Number(externalId), type: kind },
    );
    return toNormalized(kind, data.Media);
  },
};
