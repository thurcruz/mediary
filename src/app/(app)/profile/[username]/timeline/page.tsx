import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaCover } from "@/components/media/media-cover";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { diaryEntryVerbPastTense, type MediaType, type DiaryStatus, type Provider } from "@/lib/media-types";
import { getDisplayTitle } from "@/lib/utils/display-title";

export default async function TimelinePage({
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

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: profileUser.id, media: { mediaType: { in: enabledMediaTypes } } },
    orderBy: { loggedAt: "desc" },
    include: { media: true },
  });

  const byYear = new Map<number, typeof entries>();
  for (const entry of entries) {
    const year = entry.loggedAt.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(entry);
  }
  const years = Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Linha do tempo de {profileUser.name ?? profileUser.username}</h1>
        <p className="mt-1 text-sm text-muted">A história cultural, ano a ano.</p>
      </div>

      {years.length === 0 && (
        <p className="text-sm text-muted">Nada registrado ainda.</p>
      )}

      {years.map(([year, yearEntries]) => (
        <section key={year} className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-primary">{year}</h2>
          <div className="flex flex-col gap-2">
            {yearEntries.map((entry) => {
              const mediaType = entry.media.mediaType as MediaType;
              const title = getDisplayTitle(entry.media.titles, entry.media.title, session.user.language);
              return (
                <Link
                  key={entry.id}
                  href={mediaDetailHref(mediaType, entry.media.provider as Provider, entry.media.externalId)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 hover:border-primary/50"
                >
                  <MediaCover src={entry.media.cover} title={title} className="w-10 shrink-0" />
                  <p className="text-sm">
                    <span className="text-muted">
                      {diaryEntryVerbPastTense(entry.status as DiaryStatus, mediaType)}{" "}
                    </span>
                    <span className="font-medium">{title}</span>
                  </p>
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    {entry.loggedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
