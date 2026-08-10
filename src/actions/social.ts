"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followUser, unfollowUser } from "@/lib/services/follow";
import { createComment } from "@/lib/services/comments";
import { createNotificationFromActor } from "@/lib/services/notifications";
import { checkFollowerBadge } from "@/lib/services/badges";
import { searchUsers, suggestUsersToFollow, type UserSearchResult } from "@/lib/services/user-search";
import type { ActionResult } from "@/types/actions";
import type { MediaType } from "@/lib/media-types";

export async function searchUsersAction(
  query: string,
  viewerMediaTypes: MediaType[],
): Promise<UserSearchResult[]> {
  const session = await auth();
  if (!session?.user) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return suggestUsersToFollow(session.user.id, viewerMediaTypes);

  return searchUsers(session.user.id, trimmed, viewerMediaTypes);
}

export async function toggleFollowAction(targetUserId: string, isFollowing: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.id === targetUserId) return;

  if (isFollowing) {
    await unfollowUser(session.user.id, targetUserId);
  } else {
    await followUser(session.user.id, targetUserId);
    // Grants the pre-existing "Primeiro fã" badge to the person being followed - no
    // live-reveal, they're not present in this request; they'll see it via notification.
    await checkFollowerBadge(targetUserId);
  }
}

/** Votes "Concordo"/"Discordo" on a review. Picking the vote already active removes it; picking the other switches it. */
export async function toggleReviewVoteAction(
  diaryEntryId: string,
  voteType: "AGREE" | "DISAGREE",
  currentVote: "AGREE" | "DISAGREE" | null,
): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  if (currentVote === voteType) {
    await prisma.reviewVote.deleteMany({ where: { userId: session.user.id, diaryEntryId } });
    return;
  }

  await prisma.reviewVote.upsert({
    where: { userId_diaryEntryId: { userId: session.user.id, diaryEntryId } },
    create: { userId: session.user.id, diaryEntryId, type: voteType },
    update: { type: voteType },
  });

  if (voteType === "AGREE") {
    const entry = await prisma.diaryEntry.findUnique({
      where: { id: diaryEntryId },
      select: { userId: true },
    });
    if (entry && entry.userId !== session.user.id) {
      await createNotificationFromActor(entry.userId, "REVIEW_LIKE", session.user.id, {
        diaryEntryId,
      });
    }
  }
}

export async function createCommentAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login para comentar." };

  const diaryEntryId = formData.get("diaryEntryId");
  const listId = formData.get("listId");
  const text = formData.get("text");

  let unlockedBadges;
  try {
    ({ unlockedBadges } = await createComment(session.user.id, {
      diaryEntryId: diaryEntryId ? String(diaryEntryId) : undefined,
      listId: listId ? String(listId) : undefined,
      text: String(text ?? ""),
    }));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível comentar." };
  }

  return { success: true, unlockedBadges };
}
