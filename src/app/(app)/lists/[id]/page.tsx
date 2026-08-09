import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/media/media-card";
import { ListMediaAdder } from "@/components/lists/list-media-adder";
import { RemoveListItemButton } from "@/components/lists/remove-list-item-button";
import { ListFollowButton } from "@/components/lists/list-follow-button";
import { ShareListButton } from "@/components/lists/share-list-button";
import { InviteCollaboratorForm } from "@/components/lists/invite-collaborator-form";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { getDisplayTitle } from "@/lib/utils/display-title";
import type { MediaType, Provider, ListVisibility } from "@/lib/media-types";

const VISIBILITY_LABEL: Record<ListVisibility, string> = {
  PUBLIC: "Pública",
  PRIVATE: "Privada",
  UNLISTED: "Não listada",
};

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, name: true } },
      items: { orderBy: { position: "asc" }, include: { media: true } },
      collaborators: { select: { userId: true, role: true } },
      _count: { select: { followers: true } },
    },
  });
  if (!list) notFound();

  const isOwner = list.userId === session.user.id;
  if (list.visibility === "PRIVATE" && !isOwner) notFound();

  const myCollaboration = list.collaborators.find((c) => c.userId === session.user.id);
  const canEdit = isOwner || myCollaboration?.role === "EDITOR";

  const [isFollowingList, following] = await Promise.all([
    isOwner
      ? Promise.resolve(false)
      : prisma.listFollow
          .findUnique({ where: { listId_userId: { listId: id, userId: session.user.id } } })
          .then(Boolean),
    isOwner
      ? prisma.follow.findMany({
          where: { followerId: session.user.id },
          select: { following: { select: { id: true, username: true, name: true, avatarUrl: true } } },
        })
      : Promise.resolve([]),
  ]);

  const existingCollaboratorIds = new Set(list.collaborators.map((c) => c.userId));
  const inviteCandidates = following
    .map((f) => f.following)
    .filter((friend) => !existingCollaboratorIds.has(friend.id));

  const existingKeys = list.items.map((item) => `${item.media.provider}:${item.media.externalId}`);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{list.title}</h1>
          <Badge variant={list.visibility === "PUBLIC" ? "primary" : "default"}>
            {VISIBILITY_LABEL[list.visibility as ListVisibility]}
          </Badge>
          {list.isCollaborative && <Badge>Colaborativa</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted">
          por {list.user.name ?? list.user.username}
          {list.description && ` · ${list.description}`}
        </p>
        <p className="mt-1 text-xs text-muted">
          {list._count.followers} {list._count.followers === 1 ? "pessoa segue" : "pessoas seguem"} esta
          lista
        </p>

        <div className="mt-3 flex items-center gap-2">
          {!isOwner && !list.isFavoritesList && (
            <ListFollowButton listId={list.id} initialIsFollowing={isFollowingList} />
          )}
          <ShareListButton title={list.title} />
        </div>
      </div>

      {canEdit && !list.isFavoritesList && (
        <ListMediaAdder listId={list.id} existingKeys={existingKeys} language={session.user.language} />
      )}

      {isOwner && !list.isFavoritesList && (
        <InviteCollaboratorForm listId={list.id} friends={inviteCandidates} />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {list.items.map((item) => (
          <div key={item.id} className="relative">
            <MediaCard
              href={mediaDetailHref(
                item.media.mediaType as MediaType,
                item.media.provider as Provider,
                item.media.externalId,
              )}
              title={getDisplayTitle(item.media.titles, item.media.title, session.user.language)}
              cover={item.media.cover}
              mediaType={item.media.mediaType as MediaType}
            />
            {canEdit && <RemoveListItemButton listId={list.id} mediaId={item.mediaId} />}
          </div>
        ))}
      </div>

      {list.items.length === 0 && (
        <p className="text-sm text-muted">Nenhum item nesta lista ainda.</p>
      )}
    </div>
  );
}
