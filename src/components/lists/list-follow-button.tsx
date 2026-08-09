"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleListFollowAction } from "@/actions/lists";

export function ListFollowButton({
  listId,
  initialIsFollowing,
}: {
  listId: string;
  initialIsFollowing: boolean;
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleListFollowAction(listId, isFollowing);
          setIsFollowing((v) => !v);
          router.refresh();
        })
      }
    >
      {isFollowing ? "Seguindo" : "Seguir lista"}
    </Button>
  );
}
