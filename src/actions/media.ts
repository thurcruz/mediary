"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchAllMedia } from "@/lib/providers/registry";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import type { MediaType } from "@/lib/media-types";

export async function searchMediaAction(query: string): Promise<NormalizedMedia[]> {
  const session = await auth();
  if (!session?.user) return [];

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  return searchAllMedia(query, enabledMediaTypes);
}
