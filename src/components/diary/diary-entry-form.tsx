"use client";

import { useActionState, useState } from "react";
import { logDiaryEntryAction } from "@/actions/diary";
import { DIARY_STATUSES, diaryStatusLabel, type MediaType, type DiaryStatus } from "@/lib/media-types";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function DiaryEntryForm({ mediaId, mediaType }: { mediaId: string; mediaType: MediaType }) {
  const [state, formAction, isPending] = useActionState(logDiaryEntryAction, {});
  const [status, setStatus] = useState<DiaryStatus>("COMPLETED");
  const [rating, setRating] = useState<number | null>(null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5"
    >
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="rating" value={rating ?? ""} />

      <div className="flex flex-wrap gap-2">
        {DIARY_STATUSES.map((s) => (
          <label key={s} className="cursor-pointer">
            <input
              type="radio"
              name="status"
              value={s}
              checked={status === s}
              onChange={() => setStatus(s)}
              className="peer sr-only"
            />
            <span className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
              {diaryStatusLabel(s, mediaType)}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Sua nota</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <Textarea name="reviewText" placeholder="Escreva sua review (opcional)" rows={4} />

      <div className="flex flex-wrap gap-5 text-sm text-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="containsSpoiler" className="accent-primary" />
          Contém spoiler
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFavorite" className="accent-primary" />
          Favoritar
        </label>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Registrado no seu diário.</p>}

      <Button type="submit" loading={isPending}>
        Registrar
      </Button>
    </form>
  );
}
