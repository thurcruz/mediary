"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchMediaAction } from "@/actions/media";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import { MediaCard } from "@/components/media/media-card";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { CATEGORIES, matchesCategory } from "@/lib/genres";
import { getDisplayTitle } from "@/lib/utils/display-title";
import { MEDIA_TYPE_LABELS, type ContentLanguage, type MediaType } from "@/lib/media-types";

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

type SortMode = "popularity" | "az";

export function MediaSearch({
  enabledMediaTypes,
  language,
  placeholder = "Buscar filmes, livros...",
}: {
  enabledMediaTypes: MediaType[];
  language: ContentLanguage;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedTypes, setSelectedTypes] = useState<MediaType[]>(enabledMediaTypes);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("popularity");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const effectiveQuery = activeLetter ?? trimmedQuery;

  useEffect(() => {
    if (!activeLetter && trimmedQuery.length < 2) return;

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchMediaAction(effectiveQuery);
        setResults(data);
      });
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, activeLetter]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveLetter(null);
  }

  function handleLetterClick(letter: string) {
    setQuery(letter === "#" ? "0" : letter);
    setActiveLetter(letter);
    setSortMode("az");
  }

  function toggleType(type: MediaType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  const visibleResults = useMemo(() => {
    if (!activeLetter && trimmedQuery.length < 2) return [];

    let list = results.filter((item) => selectedTypes.includes(item.mediaType));

    if (selectedCategory) {
      list = list.filter((item) => matchesCategory(item.genres, selectedCategory));
    }

    if (activeLetter) {
      list = list.filter((item) => {
        const first = getDisplayTitle(item.titles, item.title, language).trim().charAt(0).toUpperCase();
        return activeLetter === "#" ? /[0-9]/.test(first) : first === activeLetter;
      });
    }

    return [...list].sort((a, b) =>
      sortMode === "az"
        ? getDisplayTitle(a.titles, a.title, language).localeCompare(
            getDisplayTitle(b.titles, b.title, language),
          )
        : (b.popularityScore ?? 0) - (a.popularityScore ?? 0),
    );
  }, [results, selectedTypes, selectedCategory, activeLetter, trimmedQuery, sortMode, language]);

  const showBrowsePrompt = !activeLetter && trimmedQuery.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-11"
          autoFocus
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {enabledMediaTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {enabledMediaTypes.map((type) => (
            <FilterChip key={type} active={selectedTypes.includes(type)} onClick={() => toggleType(type)}>
              {MEDIA_TYPE_LABELS[type]}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={selectedCategory === null} onClick={() => setSelectedCategory(null)}>
          Todas as categorias
        </FilterChip>
        {CATEGORIES.map((category) => (
          <FilterChip
            key={category.label}
            active={selectedCategory === category.label}
            onClick={() =>
              setSelectedCategory((prev) => (prev === category.label ? null : category.label))
            }
          >
            {category.label}
          </FilterChip>
        ))}
      </div>

      {(trimmedQuery.length >= 2 || activeLetter) && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Ordenar:</span>
          <FilterChip active={sortMode === "popularity"} onClick={() => setSortMode("popularity")}>
            Popular
          </FilterChip>
          <FilterChip active={sortMode === "az"} onClick={() => setSortMode("az")}>
            A-Z
          </FilterChip>
        </div>
      )}

      {showBrowsePrompt && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Ou navegue por letra:</p>
          <div className="flex flex-wrap gap-1.5">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => handleLetterClick(letter)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {(trimmedQuery.length >= 2 || activeLetter) && !isPending && visibleResults.length === 0 && (
        <p className="text-center text-sm text-muted">Nenhum resultado para &quot;{effectiveQuery}&quot;.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {visibleResults.map((item) => (
          <MediaCard
            key={`${item.provider}:${item.externalId}`}
            href={mediaDetailHref(item.mediaType, item.provider, item.externalId)}
            title={getDisplayTitle(item.titles, item.title, language)}
            cover={item.cover}
            mediaType={item.mediaType}
            year={item.releaseDate?.slice(0, 4)}
          />
        ))}
      </div>
    </div>
  );
}
