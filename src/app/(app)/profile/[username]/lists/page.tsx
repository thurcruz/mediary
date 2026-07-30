import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListCard } from "@/components/lists/list-card";
import { Button } from "@/components/ui/button";
import type { ListVisibility } from "@/lib/media-types";

export default async function ProfileListsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const profileUser = await prisma.user.findUnique({ where: { username } });
  if (!profileUser) notFound();

  const isOwnProfile = session.user.id === profileUser.id;

  const lists = await prisma.list.findMany({
    where: {
      userId: profileUser.id,
      ...(isOwnProfile ? {} : { visibility: "PUBLIC" }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { take: 3, orderBy: { position: "asc" }, include: { media: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isOwnProfile ? "Suas listas" : `Listas de ${profileUser.name ?? profileUser.username}`}
          </h1>
          <Link href={`/profile/${username}`} className="text-sm text-muted hover:text-foreground">
            @{profileUser.username}
          </Link>
        </div>
        {isOwnProfile && (
          <Link href="/lists/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Nova lista
            </Button>
          </Link>
        )}
      </div>

      {lists.length === 0 && (
        <p className="text-sm text-muted">
          {isOwnProfile ? "Você ainda não criou nenhuma lista." : "Nenhuma lista pública ainda."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {lists.map((list) => (
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
    </div>
  );
}
