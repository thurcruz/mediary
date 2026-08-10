import { prisma } from "@/lib/prisma";
import { checkFavoriteListBadges, type UnlockedBadge } from "@/lib/services/badges";
import type { MediaType, Provider } from "@/lib/media-types";

async function getOrCreateFavoritesList(userId: string) {
  const existing = await prisma.list.findFirst({ where: { userId, isFavoritesList: true } });
  if (existing) return existing;

  return prisma.list.create({
    data: {
      userId,
      title: "Favoritos",
      visibility: "PRIVATE",
      isFavoritesList: true,
    },
  });
}

export async function isMediaFavorited(userId: string, mediaId: string): Promise<boolean> {
  const favoritesList = await prisma.list.findFirst({
    where: { userId, isFavoritesList: true },
    select: { id: true },
  });
  if (!favoritesList) return false;

  const item = await prisma.listItem.findUnique({
    where: { listId_mediaId: { listId: favoritesList.id, mediaId } },
    select: { id: true },
  });
  return Boolean(item);
}

type MediaLike = { id: string; title: string; mediaType: MediaType; provider: Provider; externalId: string };

/** Toggles a media item in the user's auto-managed Favoritos list. Returns the new favorited state and any badges it unlocked. */
export async function toggleFavorite(
  userId: string,
  media: MediaLike,
): Promise<{ isFavorited: boolean; unlockedBadges: UnlockedBadge[] }> {
  const favoritesList = await getOrCreateFavoritesList(userId);

  const existingItem = await prisma.listItem.findUnique({
    where: { listId_mediaId: { listId: favoritesList.id, mediaId: media.id } },
  });

  if (existingItem) {
    await prisma.listItem.delete({ where: { id: existingItem.id } });
    return { isFavorited: false, unlockedBadges: [] };
  }

  const itemCount = await prisma.listItem.count({ where: { listId: favoritesList.id } });
  await prisma.listItem.create({ data: { listId: favoritesList.id, mediaId: media.id, position: itemCount } });

  const unlockedBadges = await checkFavoriteListBadges(userId, {
    title: media.title,
    mediaType: media.mediaType,
    provider: media.provider,
    externalId: media.externalId,
  });
  return { isFavorited: true, unlockedBadges };
}
