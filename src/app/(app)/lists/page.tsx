import Link from "next/link";
import { Plus, Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListCard } from "@/components/lists/list-card";
import { Button } from "@/components/ui/button";
import { MediaCover } from "@/components/media/media-cover";
import type { ListVisibility } from "@/lib/media-types";

const listInclude = {
  items: { take: 3, orderBy: { position: "asc" as const }, include: { media: true } },
  _count: { select: { items: true } },
};

export default async function ListsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [ownLists, favoritesList, followedLists] = await Promise.all([
    prisma.list.findMany({
      where: { userId: session.user.id, isFavoritesList: false },
      orderBy: { createdAt: "desc" },
      include: listInclude,
    }),
    prisma.list.findFirst({
      where: { userId: session.user.id, isFavoritesList: true },
      include: listInclude,
    }),
    prisma.listFollow.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { list: { include: { ...listInclude, user: { select: { name: true, username: true } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Listas</h1>
        <Link href="/lists/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova lista
          </Button>
        </Link>
      </div>

      {favoritesList && favoritesList._count.items > 0 && (
        <Link
          href={`/lists/${favoritesList.id}`}
          className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-4 hover:border-primary/50"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Favoritos</p>
            <p className="text-xs text-muted">{favoritesList._count.items} itens</p>
          </div>
          <div className="hidden gap-1.5 sm:flex">
            {favoritesList.items.map((item) => (
              <MediaCover key={item.id} src={item.media.cover} title={item.media.title} className="w-10" />
            ))}
          </div>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Suas listas</h2>
        {ownLists.length === 0 && (
          <p className="text-sm text-muted">Você ainda não criou nenhuma lista.</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ownLists.map((list) => (
            <ListCard
              key={list.id}
              id={list.id}
              title={list.title}
              visibility={list.visibility as ListVisibility}
              itemCount={list._count.items}
              covers={list.items.map((item) => item.media.cover)}
            />
          ))}
        </div>
      </section>

      {followedLists.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Listas que você segue</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {followedLists.map(({ list }) => (
              <ListCard
                key={list.id}
                id={list.id}
                title={list.title}
                visibility={list.visibility as ListVisibility}
                itemCount={list._count.items}
                covers={list.items.map((item) => item.media.cover)}
                creatorName={list.user.name ?? list.user.username}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
