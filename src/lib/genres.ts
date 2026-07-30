/**
 * Curated category filter for the search page. Matched client-side against
 * whatever `genres` each provider adapter already returned in the search
 * results (case-insensitive substring match against the keywords below) -
 * not a separate per-category API call, since most provider search
 * endpoints don't support combining a text query with a genre filter
 * consistently.
 */
export const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Drama", keywords: ["drama"] },
  { label: "Terror", keywords: ["horror", "terror"] },
  { label: "Aventura", keywords: ["adventure", "aventura"] },
  { label: "Ficção Científica", keywords: ["science fiction", "sci-fi", "ficção científica"] },
  { label: "Comédia", keywords: ["comedy", "comédia"] },
  { label: "Romance", keywords: ["romance"] },
  { label: "Ação", keywords: ["action", "ação"] },
  { label: "Fantasia", keywords: ["fantasy", "fantasia"] },
  { label: "Suspense", keywords: ["thriller", "suspense"] },
  { label: "Super-heróis", keywords: ["superhero", "super hero", "marvel", "dc comics", "super-herói"] },
  { label: "Mistério", keywords: ["mystery", "mistério"] },
  { label: "Animação", keywords: ["animation", "animação"] },
  { label: "Documentário", keywords: ["documentary", "documentário"] },
];

export function matchesCategory(genres: string[] | undefined, categoryLabel: string): boolean {
  const category = CATEGORIES.find((c) => c.label === categoryLabel);
  if (!category || !genres?.length) return false;
  const normalizedGenres = genres.map((g) => g.toLowerCase());
  return category.keywords.some((keyword) =>
    normalizedGenres.some((genre) => genre.includes(keyword)),
  );
}
