import { prisma } from "@/lib/prisma";
import { createCommentSchema, type CreateCommentInput } from "@/lib/validations/social";
import { createNotificationFromActor } from "@/lib/services/notifications";
import { checkCommentBadges, type UnlockedBadge } from "@/lib/services/badges";
import { mediaDetailHref } from "@/lib/utils/media-href";

/**
 * The only allowed write path for Comment. SQLite can't enforce "exactly one
 * of diaryEntryId/listId" with a CHECK constraint the way Postgres could, so
 * that invariant (already validated in createCommentSchema) is guarded here
 * instead - never call prisma.comment.create() directly elsewhere.
 */
export async function createComment(userId: string, input: CreateCommentInput) {
  const data = createCommentSchema.parse(input);

  const comment = await prisma.comment.create({
    data: {
      userId,
      diaryEntryId: data.diaryEntryId,
      listId: data.listId,
      parentId: data.parentId,
      text: data.text,
    },
    include: {
      diaryEntry: { select: { userId: true, media: true } },
    },
  });

  let unlockedBadges: UnlockedBadge[] = [];

  if (comment.diaryEntry) {
    if (comment.diaryEntry.userId !== userId) {
      await createNotificationFromActor(comment.diaryEntry.userId, "COMMENT", userId, {
        diaryEntryId: comment.diaryEntryId,
      });
    }

    const diaryEntryCommentCount = await prisma.comment.count({
      where: { diaryEntryId: comment.diaryEntryId! },
    });
    const media = comment.diaryEntry.media;
    const context = {
      label: media.title,
      href: mediaDetailHref(media.mediaType, media.provider, media.externalId),
    };

    const { commenterUnlocks } = await checkCommentBadges(
      userId,
      { diaryEntryOwnerId: comment.diaryEntry.userId, diaryEntryCommentCount },
      context,
    );
    unlockedBadges = commenterUnlocks;
  }

  return { comment, unlockedBadges };
}
