import { prisma } from "@/lib/prisma";

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

/** Toggles a media item in the user's auto-managed Favoritos list. Returns the new favorited state. */
export async function toggleFavorite(userId: string, mediaId: string): Promise<boolean> {
  const favoritesList = await getOrCreateFavoritesList(userId);

  const existingItem = await prisma.listItem.findUnique({
    where: { listId_mediaId: { listId: favoritesList.id, mediaId } },
  });

  if (existingItem) {
    await prisma.listItem.delete({ where: { id: existingItem.id } });
    return false;
  }

  const itemCount = await prisma.listItem.count({ where: { listId: favoritesList.id } });
  await prisma.listItem.create({ data: { listId: favoritesList.id, mediaId, position: itemCount } });
  return true;
}
