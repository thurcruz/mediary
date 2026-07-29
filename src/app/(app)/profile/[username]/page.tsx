import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/media/media-card";
import { DiaryEntryCard } from "@/components/diary/diary-entry-card";
import { FollowButton } from "@/components/diary/follow-button";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { MEDIA_TYPE_LABELS, type MediaType, type Provider } from "@/lib/media-types";
import { getProfileStats } from "@/lib/services/profile-stats";
import { getUserRecentActivity } from "@/lib/services/diary-feed";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const profileUser = await prisma.user.findUnique({ where: { username } });
  if (!profileUser) notFound();

  const viewerSettings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  const enabledMediaTypes = (viewerSettings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  const isOwnProfile = session.user.id === profileUser.id;
  const isFollowing = isOwnProfile
    ? false
    : Boolean(
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: { followerId: session.user.id, followingId: profileUser.id },
          },
        }),
      );

  const [stats, favorites, recentActivity] = await Promise.all([
    getProfileStats(profileUser.id, enabledMediaTypes),
    prisma.diaryEntry.findMany({
      where: {
        userId: profileUser.id,
        isFavorite: true,
        media: { mediaType: { in: enabledMediaTypes } },
      },
      orderBy: { loggedAt: "desc" },
      take: 12,
      include: { media: true },
    }),
    getUserRecentActivity(profileUser.id, session.user.id, enabledMediaTypes, 10),
  ]);

  const socialLinks = (profileUser.socialLinks as Record<string, string> | null) ?? {};

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar src={profileUser.avatarUrl} name={profileUser.name ?? profileUser.username} size={80} />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {profileUser.name ?? profileUser.username}
              </h1>
              <p className="text-sm text-muted">@{profileUser.username}</p>
            </div>
            {!isOwnProfile && (
              <FollowButton targetUserId={profileUser.id} initialIsFollowing={isFollowing} />
            )}
            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-sm font-medium text-primary hover:underline"
              >
                Editar perfil
              </Link>
            )}
          </div>

          {profileUser.bio && <p className="text-sm text-foreground/90">{profileUser.bio}</p>}

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted sm:justify-start">
            {profileUser.profession && <span>{profileUser.profession}</span>}
            {(profileUser.city || profileUser.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[profileUser.city, profileUser.country].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Desde {profileUser.createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="flex justify-center gap-5 text-sm sm:justify-start">
            <span>
              <strong>{stats.followerCount}</strong>{" "}
              <span className="text-muted">seguidores</span>
            </span>
            <span>
              <strong>{stats.followingCount}</strong>{" "}
              <span className="text-muted">seguindo</span>
            </span>
            <span>
              <strong>{stats.listCount}</strong> <span className="text-muted">listas</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Registrados" value={stats.totalLogged} />
        <StatCard
          label="Nota média"
          value={stats.averageRating != null ? stats.averageRating.toFixed(1) : "—"}
        />
        <StatCard label="Horas" value={stats.hoursConsumed} />
        {Object.entries(stats.countsByType)
          .slice(0, 2)
          .map(([type, count]) => (
            <StatCard key={type} label={MEDIA_TYPE_LABELS[type as MediaType]} value={count} />
          ))}
      </div>

      <Link
        href={`/profile/${profileUser.username}/timeline`}
        className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm font-medium hover:border-primary/50"
      >
        Ver linha do tempo
        <ChevronRight className="h-4 w-4 text-muted" />
      </Link>

      {favorites.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Favoritos</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {favorites.map((entry) => (
              <MediaCard
                key={entry.id}
                href={mediaDetailHref(
                  entry.media.mediaType as MediaType,
                  entry.media.provider as Provider,
                  entry.media.externalId,
                )}
                title={entry.media.title}
                cover={entry.media.cover}
                mediaType={entry.media.mediaType as MediaType}
              />
            ))}
          </div>
        </section>
      )}

      {recentActivity.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Atividade recente</h2>
          <div className="flex flex-col gap-3">
            {recentActivity.map((entry) => (
              <DiaryEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {Object.keys(socialLinks).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(socialLinks).map(
            ([key, value]) => value && <Badge key={key}>{key}: {value}</Badge>,
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
