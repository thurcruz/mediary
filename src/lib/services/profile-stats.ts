import { prisma } from "@/lib/prisma";
import type { MediaType } from "@/lib/media-types";

export async function getProfileStats(userId: string, enabledMediaTypes: MediaType[]) {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId, media: { mediaType: { in: enabledMediaTypes } } },
    select: {
      status: true,
      rating: true,
      media: { select: { mediaType: true, duration: true } },
    },
  });

  const countsByType: Partial<Record<MediaType, number>> = {};
  let ratingSum = 0;
  let ratingCount = 0;
  let secondsConsumed = 0;

  for (const entry of entries) {
    if (entry.status === "COMPLETED" || entry.status === "REPEATING") {
      const mediaType = entry.media.mediaType as MediaType;
      countsByType[mediaType] = (countsByType[mediaType] ?? 0) + 1;
      secondsConsumed += entry.media.duration ?? 0;
    }
    if (entry.rating != null) {
      ratingSum += entry.rating;
      ratingCount += 1;
    }
  }

  const [followerCount, followingCount, listCount, agreeReceived, disagreeReceived] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.list.count({ where: { userId, isFavoritesList: false } }),
    prisma.reviewVote.count({ where: { type: "AGREE", diaryEntry: { userId } } }),
    prisma.reviewVote.count({ where: { type: "DISAGREE", diaryEntry: { userId } } }),
  ]);

  return {
    countsByType,
    totalLogged: entries.length,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    hoursConsumed: Math.round(secondsConsumed / 3600),
    followerCount,
    followingCount,
    listCount,
    // Reputation: net "Concordo"/"Discordo" votes received across all your reviews.
    reputationScore: agreeReceived - disagreeReceived,
  };
}
