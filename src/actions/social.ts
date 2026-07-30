"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followUser, unfollowUser } from "@/lib/services/follow";
import { createComment } from "@/lib/services/comments";
import { createNotificationFromActor } from "@/lib/services/notifications";
import { searchUsers, suggestUsersToFollow, type UserSearchResult } from "@/lib/services/user-search";
import type { ActionResult } from "@/types/actions";

export async function searchUsersAction(query: string): Promise<UserSearchResult[]> {
  const session = await auth();
  if (!session?.user) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return suggestUsersToFollow(session.user.id);

  return searchUsers(session.user.id, trimmed);
}

export async function toggleFollowAction(targetUserId: string, isFollowing: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.id === targetUserId) return;

  if (isFollowing) {
    await unfollowUser(session.user.id, targetUserId);
  } else {
    await followUser(session.user.id, targetUserId);
  }
}

export async function toggleReviewLikeAction(diaryEntryId: string, isLiked: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  if (isLiked) {
    await prisma.reviewLike.deleteMany({ where: { userId: session.user.id, diaryEntryId } });
    return;
  }

  await prisma.reviewLike.create({ data: { userId: session.user.id, diaryEntryId } });
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

export async function createCommentAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login para comentar." };

  const diaryEntryId = formData.get("diaryEntryId");
  const listId = formData.get("listId");
  const text = formData.get("text");

  try {
    await createComment(session.user.id, {
      diaryEntryId: diaryEntryId ? String(diaryEntryId) : undefined,
      listId: listId ? String(listId) : undefined,
      text: String(text ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível comentar." };
  }

  return { success: true };
}
