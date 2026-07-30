import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AchievementsPage({
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

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {isOwnProfile ? "Suas conquistas" : `Conquistas de ${profileUser.name ?? profileUser.username}`}
        </h1>
        <Link href={`/profile/${username}`} className="text-sm text-muted hover:text-foreground">
          @{profileUser.username}
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
        <Trophy className="h-8 w-8 text-muted" />
        <p className="text-sm text-muted">Nenhuma conquista disponível ainda.</p>
      </div>
    </div>
  );
}
