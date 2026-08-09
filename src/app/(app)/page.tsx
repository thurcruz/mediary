import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DiaryEntryCard } from "@/components/diary/diary-entry-card";
import { getRecentReviews } from "@/lib/services/diary-feed";
import type { MediaType } from "@/lib/media-types";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  const entries = await getRecentReviews(enabledMediaTypes, session.user.language, session.user.id);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Início</h1>

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
