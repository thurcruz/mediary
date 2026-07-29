import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaTypeSchema, ProviderSchema, MEDIA_TYPE_LABELS, diaryStatusLabel, type DiaryStatus } from "@/lib/media-types";
import { resolveOrCacheMedia } from "@/lib/services/media-cache";
import { MediaCover } from "@/components/media/media-cover";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { DiaryEntryForm } from "@/components/diary/diary-entry-form";

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ mediaType: string; provider: string; externalId: string }>;
}) {
  const { mediaType: mediaTypeParam, provider: providerParam, externalId } = await params;

  const mediaTypeParsed = MediaTypeSchema.safeParse(mediaTypeParam.toUpperCase());
  const providerParsed = ProviderSchema.safeParse(providerParam.toUpperCase());
  if (!mediaTypeParsed.success || !providerParsed.success) notFound();

  const mediaType = mediaTypeParsed.data;
  const provider = providerParsed.data;

  const media = await resolveOrCacheMedia(provider, mediaType, decodeURIComponent(externalId));
  if (!media) notFound();

  const genres = await prisma.mediaGenre.findMany({
    where: { mediaId: media.id },
    include: { genre: true },
  });

  const session = await auth();
  const myEntries = session?.user
    ? await prisma.diaryEntry.findMany({
        where: { userId: session.user.id, mediaId: media.id },
        orderBy: { loggedAt: "desc" },
      })
    : [];

  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;

  return (
    <div className="flex flex-col gap-6 pt-6">
      {media.banner && (
        <div className="relative -mx-4 h-48 overflow-hidden sm:-mx-6 sm:rounded-b-3xl">
          <Image src={media.banner} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
        </div>
      )}

      <div className="flex gap-5">
        <MediaCover src={media.cover} title={media.title} className="w-32 shrink-0 sm:w-40" />
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <Badge variant="primary">{MEDIA_TYPE_LABELS[mediaType]}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{media.title}</h1>
          {media.originalTitle && media.originalTitle !== media.title && (
            <p className="text-sm text-muted">{media.originalTitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {year && <span>{year}</span>}
            {media.duration && <span>· {Math.round(media.duration / 60)} min</span>}
          </div>
          {media.ratingAvg != null && (
            <div className="flex items-center gap-2">
              <StarRating value={media.ratingAvg} readOnly size={18} />
              <span className="text-sm text-muted">
                {media.ratingAvg.toFixed(1)} ({media.ratingCount})
              </span>
            </div>
          )}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <Badge key={g.genreId}>{g.genre.name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {media.description && (
        <p className="text-sm leading-relaxed text-foreground/90">{media.description}</p>
      )}

      {session?.user && <DiaryEntryForm mediaId={media.id} mediaType={mediaType} />}

      {myEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Seus registros</h2>
          {myEntries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>{diaryStatusLabel(entry.status as DiaryStatus, mediaType)}</span>
                {entry.rating != null && <StarRating value={entry.rating} readOnly size={14} />}
              </div>
              {entry.reviewText && <p className="mt-2 text-foreground/90">{entry.reviewText}</p>}
              <p className="mt-2 text-xs text-muted">{entry.loggedAt.toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
