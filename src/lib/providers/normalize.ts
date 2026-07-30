import type { Prisma } from "@/generated/prisma/client";
import type { NormalizedMedia } from "@/lib/providers/adapter";

/** Fields shared between the create and update branch of the cache-on-read upsert. */
export function mapToMediaFields(
  normalized: NormalizedMedia,
): Omit<Prisma.MediaUncheckedCreateInput, "externalId" | "provider" | "mediaType"> {
  return {
    title: normalized.title,
    originalTitle: normalized.originalTitle ?? null,
    titles: (normalized.titles as Prisma.InputJsonValue | undefined) ?? undefined,
    description: normalized.description ?? null,
    cover: normalized.cover ?? null,
    banner: normalized.banner ?? null,
    releaseDate: normalized.releaseDate ? new Date(normalized.releaseDate) : null,
    language: normalized.language ?? null,
    country: normalized.country ?? null,
    duration: normalized.duration ?? null,
    popularity: normalized.popularityScore ?? null,
    metadata: (normalized.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    lastFetchedAt: new Date(),
  };
}
