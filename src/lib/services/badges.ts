import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { BADGES_CATALOG } from "@/lib/badges-catalog";
import { createNotification } from "@/lib/services/notifications";

/** Idempotent: upserts every catalog entry by key. Cheap enough to call on every Emblemas page load. */
export async function syncBadgeCatalog() {
  await Promise.all(
    BADGES_CATALOG.map((badge) => {
      const criteria = badge.criteria as Prisma.InputJsonValue;
      return prisma.achievement.upsert({
        where: { key: badge.key },
        create: {
          key: badge.key,
          code: badge.code,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          iconUrl: badge.iconUrl,
          secretWord: badge.secretWord ?? null,
          criteria,
        },
        update: {
          code: badge.code,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          iconUrl: badge.iconUrl,
          secretWord: badge.secretWord ?? null,
          criteria,
        },
      });
    }),
  );
}

export async function getUserBadges(userId: string) {
  await syncBadgeCatalog();

  const [allBadges, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { code: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true, unlockedAt: true } }),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return allBadges.map((badge) => ({
    ...badge,
    unlockedAt: unlockedMap.get(badge.id) ?? null,
    isSecret: Boolean(badge.secretWord),
  }));
}

/** Grants every badge flagged `autoGrantOnSignup` in the catalog - called right after account creation. */
export async function grantSignupBadges(userId: string) {
  const keys = BADGES_CATALOG.filter((b) => b.autoGrantOnSignup).map((b) => b.key);
  if (keys.length === 0) return;

  await syncBadgeCatalog();

  const badges = await prisma.achievement.findMany({ where: { key: { in: keys } } });
  if (badges.length === 0) return;

  await prisma.userAchievement.createMany({
    data: badges.map((badge) => ({ userId, achievementId: badge.id })),
    skipDuplicates: true,
  });
}

export class InvalidSecretWordError extends Error {
  constructor() {
    super("Palavra secreta inválida.");
  }
}

export class BadgeAlreadyOwnedError extends Error {
  constructor() {
    super("Você já tem esse emblema.");
  }
}

export async function redeemSecretBadge(userId: string, word: string) {
  const trimmed = word.trim();
  if (!trimmed) throw new InvalidSecretWordError();

  await syncBadgeCatalog();

  const badge = await prisma.achievement.findFirst({
    where: { secretWord: { equals: trimmed, mode: "insensitive" } },
  });
  if (!badge) throw new InvalidSecretWordError();

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: badge.id } },
  });
  if (existing) throw new BadgeAlreadyOwnedError();

  await prisma.userAchievement.create({ data: { userId, achievementId: badge.id } });
  await createNotification(userId, "ACHIEVEMENT_UNLOCKED", { achievementName: badge.name });

  return badge;
}
