"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/actions/social";

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  onToggled,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  /** When provided, called with the new following state instead of refreshing the route. */
  onToggled?: (isFollowing: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={initialIsFollowing ? "secondary" : "primary"}
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleFollowAction(targetUserId, initialIsFollowing);
          if (onToggled) {
            onToggled(!initialIsFollowing);
          } else {
            router.refresh();
          }
        })
      }
    >
      {initialIsFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}
