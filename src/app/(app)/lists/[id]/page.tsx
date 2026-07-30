import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/media/media-card";
import { ListMediaAdder } from "@/components/lists/list-media-adder";
import { RemoveListItemButton } from "@/components/lists/remove-list-item-button";
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
    },
  });
  if (!list) notFound();

  const isOwner = list.userId === session.user.id;
  if (list.visibility === "PRIVATE" && !isOwner) notFound();

  const existingKeys = list.items.map((item) => `${item.media.provider}:${item.media.externalId}`);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{list.title}</h1>
          <Badge variant={list.visibility === "PUBLIC" ? "primary" : "default"}>
            {VISIBILITY_LABEL[list.visibility as ListVisibility]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          por {list.user.name ?? list.user.username}
          {list.description && ` · ${list.description}`}
        </p>
      </div>

      {isOwner && (
        <ListMediaAdder listId={list.id} existingKeys={existingKeys} language={session.user.language} />
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
            {isOwner && <RemoveListItemButton listId={list.id} mediaId={item.mediaId} />}
          </div>
        ))}
      </div>

      {list.items.length === 0 && (
        <p className="text-sm text-muted">Nenhum item nesta lista ainda.</p>
      )}
    </div>
  );
}
