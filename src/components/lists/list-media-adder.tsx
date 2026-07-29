"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { searchMediaAction } from "@/actions/media";
import { addMediaToListAction } from "@/actions/lists";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import { MediaCover } from "@/components/media/media-cover";
import { Input } from "@/components/ui/input";

export function ListMediaAdder({
  listId,
  existingKeys,
}: {
  listId: string;
  existingKeys: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<string[]>([]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;

    const timeout = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchMediaAction(trimmedQuery));
      });
    }, 350);
    return () => clearTimeout(timeout);
  }, [trimmedQuery]);

  // Derived at render time so stale results never show once the query is
  // cleared or shortened - see media-search.tsx for the same pattern.
  const visibleResults = trimmedQuery.length >= 2 ? results : [];

  async function handleAdd(item: NormalizedMedia) {
    const key = `${item.provider}:${item.externalId}`;
    setAddingKey(key);
    await addMediaToListAction(listId, item.mediaType, item.provider, item.externalId);
    setAddingKey(null);
    setAddedKeys((prev) => [...prev, key]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adicionar à lista..."
          className="pl-11"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>
      {visibleResults.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleResults.map((item) => {
            const key = `${item.provider}:${item.externalId}`;
            const alreadyIn = existingKeys.includes(key) || addedKeys.includes(key);
            return (
              <div key={key} className="flex items-center gap-3">
                <MediaCover src={item.cover} title={item.title} className="w-10 shrink-0" />
                <span className="flex-1 truncate text-sm">{item.title}</span>
                <button
                  type="button"
                  disabled={alreadyIn || addingKey === key}
                  onClick={() => handleAdd(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {alreadyIn ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
