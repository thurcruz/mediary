"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchAllMedia } from "@/lib/providers/registry";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import type { MediaType, Provider } from "@/lib/media-types";
import { resolveOrCacheMedia } from "@/lib/services/media-cache";
import { checkShareBadge, type UnlockedBadge } from "@/lib/services/badges";

export async function searchMediaAction(query: string): Promise<NormalizedMedia[]> {
  const session = await auth();
  if (!session?.user) return [];

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  return searchAllMedia(query, enabledMediaTypes);
}

/** Records that the user shared a media item (native share sheet completed, or link copied) and grants the share badge. */
export async function shareMediaAction(
  mediaType: MediaType,
  provider: Provider,
  externalId: string,
): Promise<{ error?: string; unlockedBadges?: UnlockedBadge[] }> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const media = await resolveOrCacheMedia(provider, mediaType, externalId);
  if (!media) return { error: "Não foi possível encontrar este item." };

  const unlockedBadges = await checkShareBadge(session.user.id, media);
  return { unlockedBadges };
}
