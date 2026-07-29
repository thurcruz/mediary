"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleReviewLikeAction } from "@/actions/social";
import { cn } from "@/lib/utils/cn";

export function LikeButton({
  diaryEntryId,
  initialIsLiked,
  initialCount,
}: {
  diaryEntryId: string;
  initialIsLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleReviewLikeAction(diaryEntryId, initialIsLiked);
          router.refresh();
        })
      }
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        initialIsLiked ? "text-primary" : "text-muted hover:text-foreground",
      )}
    >
      <Heart className="h-4 w-4" fill={initialIsLiked ? "currentColor" : "none"} />
      {initialCount > 0 && <span>{initialCount}</span>}
    </button>
  );
}
