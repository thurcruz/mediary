import type { MediaProviderAdapter, NormalizedMedia } from "@/lib/providers/adapter";

const OL_BASE = "https://openlibrary.org";
const OL_COVERS_BASE = "https://covers.openlibrary.org/b/id";

type OlSearchDoc = {
  key: string; // "/works/OL...W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  language?: string[];
  subject?: string[];
  number_of_pages_median?: number;
};

type OlWork = {
  key: string;
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
};

function workKeyToExternalId(key: string): string {
  return key.replace("/works/", "");
}

function toNormalizedFromSearch(doc: OlSearchDoc): NormalizedMedia {
  return {
    externalId: workKeyToExternalId(doc.key),
    provider: "OPEN_LIBRARY",
    mediaType: "BOOK",
    title: doc.title,
    description: null,
    cover: doc.cover_i ? `${OL_COVERS_BASE}/${doc.cover_i}-L.jpg` : null,
    releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : null,
    language: doc.language?.[0] ?? null,
    genres: (doc.subject ?? []).slice(0, 5),
    popularityScore: doc.edition_count ? Math.min(100, doc.edition_count * 2) : null,
    metadata: {
      authors: doc.author_name ?? [],
      pageCount: doc.number_of_pages_median ?? null,
    },
  };
}

async function olFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const search = new URLSearchParams(params);
  const qs = search.toString();
  const res = await fetch(`${OL_BASE}${path}${qs ? `?${qs}` : ""}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Open Library request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Books via Open Library. Works today with no API key required. */
export const openLibraryAdapter: MediaProviderAdapter = {
  provider: "OPEN_LIBRARY",
  mediaTypes: ["BOOK"],
  rateLimit: { requestsPerSecond: 1 },
  isConfigured: () => true,
  async search(query) {
    const data = await olFetch<{ docs: OlSearchDoc[] }>("/search.json", {
      q: query,
      fields: "key,title,author_name,first_publish_year,cover_i,edition_count,language,subject,number_of_pages_median",
      limit: "20",
    });
    return data.docs.map(toNormalizedFromSearch);
  },
  async getById(externalId) {
    const work = await olFetch<OlWork>(`/works/${externalId}.json`);
    const description =
      typeof work.description === "string" ? work.description : (work.description?.value ?? null);

    return {
      externalId,
      provider: "OPEN_LIBRARY",
      mediaType: "BOOK",
      title: work.title,
      description,
      cover: work.covers?.[0] ? `${OL_COVERS_BASE}/${work.covers[0]}-L.jpg` : null,
      releaseDate: work.first_publish_date ?? null,
      genres: (work.subjects ?? []).slice(0, 5),
      popularityScore: null,
      metadata: {},
    };
  },
};
