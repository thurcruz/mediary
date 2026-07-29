import { prisma } from "@/lib/prisma";

export default async function NewsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Notícias</h1>

      {announcements.length === 0 && (
        <p className="text-sm text-muted">Nenhuma notícia por enquanto.</p>
      )}

      <div className="flex flex-col gap-4">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">{announcement.title}</h2>
            <p className="mt-2 text-sm text-foreground/90">{announcement.body}</p>
            <p className="mt-3 text-xs text-muted">
              {announcement.publishedAt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
