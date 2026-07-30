import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DiaryEntryCard } from "@/components/diary/diary-entry-card";
import { FollowButton } from "@/components/diary/follow-button";
import { Avatar } from "@/components/ui/avatar";
import { getFeedForUser } from "@/lib/services/diary-feed";
import type { MediaType } from "@/lib/media-types";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  const { entries, isDiscoveryFallback } = await getFeedForUser(
    session.user.id,
    enabledMediaTypes,
    session.user.language,
  );

  const suggestions = isDiscoveryFallback
    ? await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, username: true, name: true, avatarUrl: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Início</h1>

      {isDiscoveryFallback && suggestions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4">
          <div>
            <p className="text-sm font-medium">Você ainda não segue ninguém</p>
            <p className="mt-1 text-sm text-muted">
              Siga outras pessoas para ver a atividade delas aqui. Por enquanto, aqui está o que a
              comunidade anda registrando.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {suggestions.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.name ?? user.username} size={32} />
                <Link
                  href={`/profile/${user.username}`}
                  className="flex-1 text-sm font-medium hover:text-primary"
                >
                  {user.name ?? user.username}
                </Link>
                <FollowButton targetUserId={user.id} initialIsFollowing={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-sm text-muted">Nada por aqui ainda. Que tal registrar algo?</p>
      )}

      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <DiaryEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
