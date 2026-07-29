import type { MediaProviderAdapter, NormalizedMedia } from "@/lib/providers/adapter";

const GB_BASE = "https://www.googleapis.com/books/v1";

type GbVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string; large?: string };
    language?: string;
    ratingsCount?: number;
  };
};

function toNormalized(volume: GbVolume): NormalizedMedia {
  const info = volume.volumeInfo ?? {};
  return {
    externalId: volume.id,
    provider: "GOOGLE_BOOKS",
    mediaType: "BOOK",
    title: info.title ?? "",
    description: info.description ?? null,
    cover: info.imageLinks?.large ?? info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    releaseDate: info.publishedDate ?? null,
    language: info.language ?? null,
    genres: info.categories ?? [],
    popularityScore: info.ratingsCount ? Math.min(100, info.ratingsCount) : null,
    metadata: { authors: info.authors ?? [], pageCount: info.pageCount ?? null },
  };
}

async function gbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  const search = new URLSearchParams(params);
  if (key) search.set("key", key);

  const res = await fetch(`${GB_BASE}${path}?${search.toString()}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Google Books request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Books enrichment via Google Books. Works keyless with a reduced quota;
 * set GOOGLE_BOOKS_API_KEY for a higher quota.
 */
export const googleBooksAdapter: MediaProviderAdapter = {
  provider: "GOOGLE_BOOKS",
  mediaTypes: ["BOOK"],
  rateLimit: { requestsPerSecond: 5 },
  isConfigured: () => true,
  async search(query) {
    const data = await gbFetch<{ items?: GbVolume[] }>("/volumes", { q: query, maxResults: "20" });
    return (data.items ?? []).map(toNormalized);
  },
  async getById(externalId) {
    const volume = await gbFetch<GbVolume>(`/volumes/${externalId}`);
    return toNormalized(volume);
  },
};
