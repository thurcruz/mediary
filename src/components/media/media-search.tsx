"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchMediaAction } from "@/actions/media";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import { MediaCard } from "@/components/media/media-card";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { Input } from "@/components/ui/input";

export function MediaSearch({ placeholder = "Buscar filmes, livros..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isPending, startTransition] = useTransition();

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchMediaAction(trimmedQuery);
        setResults(data);
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [trimmedQuery]);

  // Derived at render time (not reset via setState in the effect above) so
  // stale results never show once the query is cleared or shortened.
  const visibleResults = trimmedQuery.length >= 2 ? results : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-11"
          autoFocus
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {trimmedQuery.length >= 2 && !isPending && visibleResults.length === 0 && (
        <p className="text-center text-sm text-muted">Nenhum resultado para &quot;{query}&quot;.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {visibleResults.map((item) => (
          <MediaCard
            key={`${item.provider}:${item.externalId}`}
            href={mediaDetailHref(item.mediaType, item.provider, item.externalId)}
            title={item.title}
            cover={item.cover}
            mediaType={item.mediaType}
            year={item.releaseDate?.slice(0, 4)}
          />
        ))}
      </div>
    </div>
  );
}
