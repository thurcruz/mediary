"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { removeMediaFromListAction } from "@/actions/lists";

export function RemoveListItemButton({ listId, mediaId }: { listId: string; mediaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Remover da lista"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeMediaFromListAction(listId, mediaId);
          router.refresh();
        })
      }
      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
    </button>
  );
}
