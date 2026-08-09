"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { updateDiaryEntryAction, deleteDiaryEntryAction } from "@/actions/diary";
import { DIARY_STATUSES, diaryStatusLabel, type MediaType, type DiaryStatus } from "@/lib/media-types";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type MyEntryData = {
  id: string;
  mediaId: string;
  status: string;
  rating: number | null;
  reviewText: string | null;
  containsSpoiler: boolean;
  isFavorite: boolean;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

// createdAt/updatedAt are set from the exact same instant on insert, so any
// gap at all (past a tiny buffer for serialization jitter) means it was edited.
const EDITED_THRESHOLD_MS = 1_000;

export function MyEntryCard({ entry, mediaType }: { entry: MyEntryData; mediaType: MediaType }) {
  const [isEditing, setIsEditing] = useState(false);
  const wasEdited = entry.updatedAt.getTime() - entry.createdAt.getTime() > EDITED_THRESHOLD_MS;

  if (isEditing) {
    return (
      <EditEntryForm entry={entry} mediaType={mediaType} onDone={() => setIsEditing(false)} />
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
      <div className="flex items-center justify-between">
        <span>{diaryStatusLabel(entry.status as DiaryStatus, mediaType)}</span>
        {entry.rating != null && <StarRating value={entry.rating} readOnly size={14} />}
      </div>
      {entry.reviewText && <p className="mt-2 text-foreground/90">{entry.reviewText}</p>}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted">
          {entry.loggedAt.toLocaleDateString("pt-BR")}
          {wasEdited && " · editado"}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <DeleteButton entryId={entry.id} />
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Apagar este registro? Essa ação não pode ser desfeita.")) return;
        startTransition(async () => {
          await deleteDiaryEntryAction(entryId);
          router.refresh();
        });
      }}
      className="flex items-center gap-1 text-xs text-muted hover:text-danger"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Apagar
    </button>
  );
}

function EditEntryForm({
  entry,
  mediaType,
  onDone,
}: {
  entry: MyEntryData;
  mediaType: MediaType;
  onDone: () => void;
}) {
  const router = useRouter();
  const updateAction = updateDiaryEntryAction.bind(null, entry.id);
  const [state, formAction, isPending] = useActionState(updateAction, {});
  const [status, setStatus] = useState<DiaryStatus>(entry.status as DiaryStatus);
  const [rating, setRating] = useState<number | null>(entry.rating);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-surface p-4">
      <input type="hidden" name="mediaId" value={entry.mediaId} />
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

      <Textarea name="reviewText" defaultValue={entry.reviewText ?? ""} rows={4} />

      <div className="flex flex-wrap gap-5 text-sm text-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="containsSpoiler" defaultChecked={entry.containsSpoiler} className="accent-primary" />
          Contém spoiler
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFavorite" defaultChecked={entry.isFavorite} className="accent-primary" />
          Favoritar
        </label>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isPending}>
          Salvar
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
