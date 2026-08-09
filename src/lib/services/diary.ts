import { prisma } from "@/lib/prisma";
import { diaryEntrySchema, type DiaryEntryInput } from "@/lib/validations/diary";

export async function logDiaryEntry(userId: string, input: DiaryEntryInput) {
  const data = diaryEntrySchema.parse(input);
  const loggedAt = data.loggedAt ?? new Date();

  const entry = await prisma.diaryEntry.create({
    data: {
      userId,
      mediaId: data.mediaId,
      status: data.status,
      rating: data.rating ?? null,
      reviewText: data.reviewText || null,
      containsSpoiler: data.containsSpoiler,
      isFavorite: data.isFavorite,
      loggedAt,
      completedAt: data.status === "COMPLETED" ? loggedAt : null,
      startedAt: data.status === "IN_PROGRESS" ? loggedAt : null,
    },
  });

  await syncMediaRatingAggregate(data.mediaId);

  return entry;
}

export async function updateDiaryEntry(userId: string, entryId: string, input: DiaryEntryInput) {
  const data = diaryEntrySchema.parse(input);

  const entry = await prisma.diaryEntry.update({
    where: { id: entryId, userId },
    data: {
      status: data.status,
      rating: data.rating ?? null,
      reviewText: data.reviewText || null,
      containsSpoiler: data.containsSpoiler,
      isFavorite: data.isFavorite,
    },
  });

  await syncMediaRatingAggregate(entry.mediaId);
  return entry;
}

export async function deleteDiaryEntry(userId: string, entryId: string) {
  const entry = await prisma.diaryEntry.delete({ where: { id: entryId, userId } });
  await syncMediaRatingAggregate(entry.mediaId);
}

async function syncMediaRatingAggregate(mediaId: string) {
  const agg = await prisma.diaryEntry.aggregate({
    where: { mediaId, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.media.update({
    where: { id: mediaId },
    data: { ratingAvg: agg._avg.rating ?? null, ratingCount: agg._count.rating },
  });
}
