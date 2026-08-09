"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/actions/lists";
import { cn } from "@/lib/utils/cn";
import type { MediaType, Provider } from "@/lib/media-types";

export function FavoriteButton({
  mediaType,
  provider,
  externalId,
  initialIsFavorited,
}: {
  mediaType: MediaType;
  provider: Provider;
  externalId: string;
  initialIsFavorited: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await toggleFavoriteAction(mediaType, provider, externalId);
            if (result.error) {
              setError(result.error);
              return;
            }
            setError(null);
            if (result.isFavorited !== undefined) setIsFavorited(result.isFavorited);
          })
        }
        aria-pressed={isFavorited}
        className={cn(
          "flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          isFavorited
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted hover:text-foreground",
        )}
      >
        <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
        {isFavorited ? "Favoritado" : "Favoritar"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
