import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBadges } from "@/lib/services/badges";
import { BadgeTile } from "@/components/badges/badge-tile";
import { RedeemBadgeForm } from "@/components/badges/redeem-badge-form";

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
  const badges = await getUserBadges(profileUser.id);
  const visibleBadges = isOwnProfile ? badges : badges.filter((b) => b.unlockedAt);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {isOwnProfile ? "Seus emblemas" : `Emblemas de ${profileUser.name ?? profileUser.username}`}
        </h1>
        <Link href={`/profile/${username}`} className="text-sm text-muted hover:text-foreground">
          @{profileUser.username}
        </Link>
      </div>

      {isOwnProfile && <RedeemBadgeForm />}

      {visibleBadges.length === 0 && (
        <p className="text-sm text-muted">Nenhum emblema conquistado ainda.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleBadges.map((badge) => (
          <BadgeTile
            key={badge.id}
            code={badge.code}
            name={badge.name}
            description={badge.description}
            iconUrl={badge.iconUrl}
            unlockedAt={badge.unlockedAt}
            isSecret={badge.isSecret}
          />
        ))}
      </div>
    </div>
  );
}
