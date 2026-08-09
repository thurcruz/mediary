"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toggleReviewVoteAction } from "@/actions/social";
import { cn } from "@/lib/utils/cn";

type VoteType = "AGREE" | "DISAGREE";

export function VoteButtons({
  diaryEntryId,
  initialAgreeCount,
  initialDisagreeCount,
  initialMyVote,
}: {
  diaryEntryId: string;
  initialAgreeCount: number;
  initialDisagreeCount: number;
  initialMyVote: VoteType | null;
}) {
  const [agreeCount, setAgreeCount] = useState(initialAgreeCount);
  const [disagreeCount, setDisagreeCount] = useState(initialDisagreeCount);
  const [myVote, setMyVote] = useState<VoteType | null>(initialMyVote);
  const [isPending, startTransition] = useTransition();

  function vote(type: VoteType) {
    if (isPending) return;
    const previousVote = myVote;
    const next = previousVote === type ? null : type;

    setMyVote(next);
    setAgreeCount((c) => c + (type === "AGREE" ? (next ? 1 : -1) : previousVote === "AGREE" ? -1 : 0));
    setDisagreeCount(
      (c) => c + (type === "DISAGREE" ? (next ? 1 : -1) : previousVote === "DISAGREE" ? -1 : 0),
    );

    startTransition(async () => {
      await toggleReviewVoteAction(diaryEntryId, type, previousVote);
    });
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => vote("AGREE")}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          myVote === "AGREE" ? "text-primary" : "text-muted hover:text-foreground",
        )}
      >
        <ThumbsUp className="h-4 w-4" fill={myVote === "AGREE" ? "currentColor" : "none"} />
        {agreeCount > 0 && <span>{agreeCount}</span>}
      </button>
      <button
        type="button"
        onClick={() => vote("DISAGREE")}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          myVote === "DISAGREE" ? "text-danger" : "text-muted hover:text-foreground",
        )}
      >
        <ThumbsDown className="h-4 w-4" fill={myVote === "DISAGREE" ? "currentColor" : "none"} />
        {disagreeCount > 0 && <span>{disagreeCount}</span>}
      </button>
    </div>
  );
}
