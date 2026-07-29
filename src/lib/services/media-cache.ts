import { prisma } from "@/lib/prisma";
import type { NormalizedMedia } from "@/lib/providers/adapter";
import { mapToMediaFields } from "@/lib/providers/normalize";
import { adapterForProvider } from "@/lib/providers/registry";
import type { MediaType, Provider } from "@/lib/media-types";

async function upsertGenres(names: string[]): Promise<string[]> {
  const uniqueNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const genres = await Promise.all(
    uniqueNames.map((name) => prisma.genre.upsert({ where: { name }, create: { name }, update: {} })),
  );
  return genres.map((g) => g.id);
}

/**
 * Cache-on-read: the first time any user views/logs an external media item,
 * we upsert it into our own Media table (keyed by the real
 * [provider, externalId] unique constraint, so two concurrent requests
 * caching the same not-yet-seen item can't race).
 */
export async function cacheMedia(normalized: NormalizedMedia) {
  const genreIds = await upsertGenres(normalized.genres ?? []);
  const fields = mapToMediaFields(normalized);

  const media = await prisma.media.upsert({
    where: {
      provider_externalId: {
        provider: normalized.provider,
        externalId: normalized.externalId,
      },
    },
    create: {
      externalId: normalized.externalId,
      provider: normalized.provider,
      mediaType: normalized.mediaType,
      ...fields,
    },
    update: fields,
  });

  // SQLite's createMany doesn't support skipDuplicates (Postgres/MySQL-only
  // in Prisma) - safe to omit here since we just deleted this media's rows
  // above, so there's nothing left in this batch to collide with.
  await prisma.mediaGenre.deleteMany({ where: { mediaId: media.id } });
  if (genreIds.length > 0) {
    await prisma.mediaGenre.createMany({
      data: genreIds.map((genreId) => ({ mediaId: media.id, genreId })),
    });
  }

  return media;
}

export async function getCachedMedia(provider: Provider, externalId: string) {
  return prisma.media.findUnique({
    where: { provider_externalId: { provider, externalId } },
  });
}

/** Cache-on-read, shared by the media detail page and "add to list". */
export async function resolveOrCacheMedia(provider: Provider, mediaType: MediaType, externalId: string) {
  const cached = await getCachedMedia(provider, externalId);
  if (cached) return cached;

  const adapter = adapterForProvider(provider);
  if (!adapter?.isConfigured()) return null;

  const normalized = await adapter.getById(externalId, mediaType).catch(() => null);
  if (!normalized) return null;

  return cacheMedia(normalized);
}
