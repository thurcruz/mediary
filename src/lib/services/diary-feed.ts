import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { DiaryEntryCardData } from "@/components/diary/diary-entry-card";
import type { ContentLanguage, MediaType } from "@/lib/media-types";
import { getDisplayTitle } from "@/lib/utils/display-title";

const cardSelect = () => ({
  id: true,
  status: true,
  rating: true,
  reviewText: true,
  containsSpoiler: true,
  loggedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { username: true, name: true, avatarUrl: true } },
  media: {
    select: { title: true, titles: true, cover: true, mediaType: true, provider: true, externalId: true },
  },
  votes: { select: { type: true, userId: true } },
  _count: { select: { comments: true } },
  comments: {
    take: 5,
    orderBy: { createdAt: "asc" as const },
    select: { id: true, text: true, user: { select: { username: true, name: true } } },
  },
});

type RawEntry = Prisma.DiaryEntryGetPayload<{ select: ReturnType<typeof cardSelect> }>;

function toCardData(
  entry: RawEntry,
  viewerLanguage: ContentLanguage,
  viewerId: string | undefined,
): DiaryEntryCardData {
  const agreeCount = entry.votes.filter((v) => v.type === "AGREE").length;
  const disagreeCount = entry.votes.filter((v) => v.type === "DISAGREE").length;
  const myVote = entry.votes.find((v) => v.userId === viewerId)?.type ?? null;

  return {
    id: entry.id,
    status: entry.status,
    rating: entry.rating,
    reviewText: entry.reviewText,
    containsSpoiler: entry.containsSpoiler,
    loggedAt: entry.loggedAt,
    wasEdited: entry.updatedAt.getTime() - entry.createdAt.getTime() > 1_000,
    user: entry.user,
    media: {
      ...entry.media,
      title: getDisplayTitle(entry.media.titles, entry.media.title, viewerLanguage),
    },
    agreeCount,
    disagreeCount,
    myVote,
    commentsCount: entry._count.comments,
    comments: entry.comments,
  };
}

export async function getUserRecentActivity(
  profileUserId: string,
  viewerId: string | undefined,
  enabledMediaTypes: MediaType[],
  viewerLanguage: ContentLanguage,
  limit = 10,
): Promise<DiaryEntryCardData[]> {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId: profileUserId, media: { mediaType: { in: enabledMediaTypes } } },
    orderBy: { loggedAt: "desc" },
    take: limit,
    select: cardSelect(),
  });
  return entries.map((entry) => toCardData(entry, viewerLanguage, viewerId));
}

/**
 * Most recent reviews platform-wide (rating or written review), filtered to
 * the viewer's enabled media types. Home feed v1 - not personalized yet.
 * The follow/watch-history based algorithm (see getFeedForUser below) is
 * planned for a later pass.
 */
export async function getRecentReviews(
  enabledMediaTypes: MediaType[],
  viewerLanguage: ContentLanguage,
  viewerId?: string,
  limit = 30,
): Promise<DiaryEntryCardData[]> {
  const entries = await prisma.diaryEntry.findMany({
    where: {
      media: { mediaType: { in: enabledMediaTypes } },
      OR: [{ rating: { not: null } }, { reviewText: { not: null } }],
    },
    orderBy: { loggedAt: "desc" },
    take: limit,
    select: cardSelect(),
  });
  return entries.map((entry) => toCardData(entry, viewerLanguage, viewerId));
}

/**
 * Entries from people the viewer follows (+ their own), filtered to the
 * viewer's enabled media types. Falls back to recent public activity
 * platform-wide when the viewer isn't following anyone yet, so the feed
 * isn't a dead end for new accounts.
 *
 * Not wired up to the home page yet - see getRecentReviews above.
 */
export async function getFeedForUser(
  viewerId: string,
  enabledMediaTypes: MediaType[],
  viewerLanguage: ContentLanguage,
  limit = 30,
): Promise<{ entries: DiaryEntryCardData[]; isDiscoveryFallback: boolean }> {
  const following = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const followedIds = following.map((f) => f.followingId);
  const authorIds = [viewerId, ...followedIds];

  const mediaTypeFilter = { media: { mediaType: { in: enabledMediaTypes } } };

  if (followedIds.length === 0) {
    const entries = await prisma.diaryEntry.findMany({
      where: { ...mediaTypeFilter, user: { id: { not: viewerId } } },
      orderBy: { loggedAt: "desc" },
      take: limit,
      select: cardSelect(),
    });
    return {
      entries: entries.map((entry) => toCardData(entry, viewerLanguage, viewerId)),
      isDiscoveryFallback: true,
    };
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { ...mediaTypeFilter, userId: { in: authorIds } },
    orderBy: { loggedAt: "desc" },
    take: limit,
    select: cardSelect(),
  });
  return {
    entries: entries.map((entry) => toCardData(entry, viewerLanguage, viewerId)),
    isDiscoveryFallback: false,
  };
}
