"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/actions/social";

export function FollowButton({
  targetUserId,
  initialIsFollowing,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
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
          router.refresh();
        })
      }
    >
      {initialIsFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}
