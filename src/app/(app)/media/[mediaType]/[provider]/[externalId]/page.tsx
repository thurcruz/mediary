import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaTypeSchema, ProviderSchema, MEDIA_TYPE_LABELS } from "@/lib/media-types";
import { resolveOrCacheMedia } from "@/lib/services/media-cache";
import { isMediaFavorited } from "@/lib/services/favorites";
import { getDisplayTitle, getAlternateTitles } from "@/lib/utils/display-title";
import { MediaCover } from "@/components/media/media-cover";
import { FavoriteButton } from "@/components/media/favorite-button";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { DiaryEntryForm } from "@/components/diary/diary-entry-form";
import { MyEntryCard } from "@/components/diary/my-entry-card";

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
  const [myEntries, isFavorited] = session?.user
    ? await Promise.all([
        prisma.diaryEntry.findMany({
          where: { userId: session.user.id, mediaId: media.id },
          orderBy: { loggedAt: "desc" },
        }),
        isMediaFavorited(session.user.id, media.id),
      ])
    : [[], false];

  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;
  const displayTitle = getDisplayTitle(media.titles, media.title, session?.user?.language ?? "PT_BR");
  const alternateTitles = getAlternateTitles(media.titles, displayTitle);

  return (
    <div className="flex flex-col gap-6 pt-6">
      {media.banner && (
        <div className="relative -mx-4 h-48 overflow-hidden sm:-mx-6 sm:rounded-b-3xl">
          <Image src={media.banner} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
        </div>
      )}

      <div className="flex gap-5">
        <MediaCover src={media.cover} title={displayTitle} className="w-32 shrink-0 sm:w-40" />
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <Badge variant="primary">{MEDIA_TYPE_LABELS[mediaType]}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{displayTitle}</h1>
          {media.originalTitle && media.originalTitle !== displayTitle && (
            <p className="text-sm text-muted">{media.originalTitle}</p>
          )}
          {alternateTitles.length > 0 && (
            <p className="text-sm text-muted">
              Também conhecido como:{" "}
              {alternateTitles.map((alt, i) => (
                <span key={alt.key}>
                  {i > 0 && " · "}
                  {alt.value} <span className="text-xs">({alt.label})</span>
                </span>
              ))}
            </p>
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

      {session?.user && (
        <FavoriteButton
          mediaType={mediaType}
          provider={provider}
          externalId={externalId}
          initialIsFavorited={isFavorited}
        />
      )}

      {media.description && (
        <p className="text-sm leading-relaxed text-foreground/90">{media.description}</p>
      )}

      {session?.user && <DiaryEntryForm mediaId={media.id} mediaType={mediaType} />}

      {myEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Seus registros</h2>
          {myEntries.map((entry) => (
            <MyEntryCard key={entry.id} entry={entry} mediaType={mediaType} />
          ))}
        </div>
      )}
    </div>
  );
}
