import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { DiaryEntryCardData } from "@/components/diary/diary-entry-card";
import type { ContentLanguage, MediaType } from "@/lib/media-types";
import { getDisplayTitle } from "@/lib/utils/display-title";

const cardSelect = (viewerId: string | undefined) => ({
  id: true,
  status: true,
  rating: true,
  reviewText: true,
  containsSpoiler: true,
  loggedAt: true,
  user: { select: { username: true, name: true, avatarUrl: true } },
  media: {
    select: { title: true, titles: true, cover: true, mediaType: true, provider: true, externalId: true },
  },
  _count: { select: { likes: true, comments: true } },
  // Sentinel id when there's no viewer keeps this query shape (and its
  // inferred TS type) identical regardless of auth state.
  likes: { where: { userId: viewerId ?? "__no_viewer__" }, select: { id: true } },
  comments: {
    take: 5,
    orderBy: { createdAt: "asc" as const },
    select: { id: true, text: true, user: { select: { username: true, name: true } } },
  },
});

type RawEntry = Prisma.DiaryEntryGetPayload<{ select: ReturnType<typeof cardSelect> }>;

function toCardData(entry: RawEntry, viewerLanguage: ContentLanguage): DiaryEntryCardData {
  return {
    id: entry.id,
    status: entry.status,
    rating: entry.rating,
    reviewText: entry.reviewText,
    containsSpoiler: entry.containsSpoiler,
    loggedAt: entry.loggedAt,
    user: entry.user,
    media: {
      ...entry.media,
      title: getDisplayTitle(entry.media.titles, entry.media.title, viewerLanguage),
    },
    likesCount: entry._count.likes,
    isLikedByViewer: entry.likes.length > 0,
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
    select: cardSelect(viewerId),
  });
  return entries.map((entry) => toCardData(entry, viewerLanguage));
}

/**
 * Entries from people the viewer follows (+ their own), filtered to the
 * viewer's enabled media types. Falls back to recent public activity
 * platform-wide when the viewer isn't following anyone yet, so the feed
 * isn't a dead end for new accounts.
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
      select: cardSelect(viewerId),
    });
    return {
      entries: entries.map((entry) => toCardData(entry, viewerLanguage)),
      isDiscoveryFallback: true,
    };
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { ...mediaTypeFilter, userId: { in: authorIds } },
    orderBy: { loggedAt: "desc" },
    take: limit,
    select: cardSelect(viewerId),
  });
  return {
    entries: entries.map((entry) => toCardData(entry, viewerLanguage)),
    isDiscoveryFallback: false,
  };
}
