import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { BADGES_CATALOG } from "@/lib/badges-catalog";
import { createNotification } from "@/lib/services/notifications";
import { mediaDetailHref } from "@/lib/utils/media-href";
import type { MediaType, Provider, DiaryStatus } from "@/lib/media-types";

export type UnlockedBadge = {
  id: string;
  code: number;
  key: string;
  name: string;
  description: string;
  iconUrl: string | null;
  contextLabel: string | null;
  contextHref: string | null;
};

type BadgeContext = { label?: string | null; href?: string | null };

type MediaLike = { title: string; mediaType: MediaType; provider: Provider; externalId: string };

function mediaContext(media: MediaLike): BadgeContext {
  return { label: media.title, href: mediaDetailHref(media.mediaType, media.provider, media.externalId) };
}

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
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true, contextLabel: true, contextHref: true },
    }),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

  return allBadges.map((badge) => {
    const userAchievement = unlockedMap.get(badge.id);
    return {
      ...badge,
      unlockedAt: userAchievement?.unlockedAt ?? null,
      contextLabel: userAchievement?.contextLabel ?? null,
      contextHref: userAchievement?.contextHref ?? null,
      isSecret: Boolean(badge.secretWord),
    };
  });
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

// ---------------------------------------------------------------------------
// Criteria evaluation - called from the relevant action/service right after
// the triggering event (diary entry saved, favorited, shared, commented,
// followed, list created). Each exported `check*` function below evaluates
// only the criteria types relevant to its own trigger and grants whatever
// newly qualifies via `grantIfNew`, which is idempotent (no-ops if already
// owned) and records why the badge unlocked (`contextLabel`/`contextHref`).
// ---------------------------------------------------------------------------

/** Grants `key` to `userId` if not already owned. Returns null if already owned or the key isn't in the catalog. */
async function grantIfNew(userId: string, key: string, context: BadgeContext = {}): Promise<UnlockedBadge | null> {
  const badge = await prisma.achievement.findUnique({ where: { key } });
  if (!badge) return null;

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: badge.id } },
  });
  if (existing) return null;

  const contextLabel = context.label ?? null;
  const contextHref = context.href ?? null;

  try {
    await prisma.userAchievement.create({ data: { userId, achievementId: badge.id, contextLabel, contextHref } });
  } catch {
    // Lost a race with a concurrent grant for the same badge - already owned.
    return null;
  }

  await createNotification(userId, "ACHIEVEMENT_UNLOCKED", {
    achievementName: badge.name,
    ...(contextLabel ? { contextLabel } : {}),
    ...(contextHref ? { contextHref } : {}),
  });

  return {
    id: badge.id,
    code: badge.code,
    key: badge.key,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    contextLabel,
    contextHref,
  };
}

async function countDiaryEntries(userId: string) {
  return prisma.diaryEntry.count({ where: { userId } });
}

async function countRatings(userId: string) {
  return prisma.diaryEntry.count({ where: { userId, rating: { not: null } } });
}

async function countReviews(userId: string) {
  return prisma.diaryEntry.count({ where: { userId, reviewText: { not: null } } });
}

async function countDropped(userId: string) {
  return prisma.diaryEntry.count({ where: { userId, status: "DROPPED" } });
}

async function countFollowers(userId: string) {
  return prisma.follow.count({ where: { followingId: userId } });
}

async function countLists(userId: string) {
  return prisma.list.count({ where: { userId, isFavoritesList: false } });
}

async function countDiaryFavorites(userId: string) {
  return prisma.diaryEntry.count({ where: { userId, isFavorite: true } });
}

async function countFavoritesListItems(userId: string) {
  return prisma.listItem.count({ where: { list: { userId, isFavoritesList: true } } });
}

/** Longest run of calendar-consecutive days (UTC) with at least one diary entry logged. */
async function longestLogStreakDays(userId: string): Promise<number> {
  const entries = await prisma.diaryEntry.findMany({ where: { userId }, select: { loggedAt: true } });
  const days = [...new Set(entries.map((e) => e.loggedAt.toISOString().slice(0, 10)))].sort();

  let longest = 0;
  let current = 0;
  let prevTime: number | null = null;
  for (const day of days) {
    const time = new Date(`${day}T00:00:00Z`).getTime();
    current = prevTime !== null && time - prevTime === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevTime = time;
  }
  return longest;
}

/** Call after logDiaryEntry/updateDiaryEntry. Covers first-log, rating, review (both tiers), favorite, dropped and streak badges. */
export async function checkDiaryEntryBadges(
  userId: string,
  entry: { rating: number | null; reviewText: string | null; isFavorite: boolean; status: DiaryStatus },
  media: MediaLike,
): Promise<UnlockedBadge[]> {
  await syncBadgeCatalog();
  const context = mediaContext(media);
  const unlocked: UnlockedBadge[] = [];
  const push = (badge: UnlockedBadge | null) => badge && unlocked.push(badge);

  if ((await countDiaryEntries(userId)) >= 1) push(await grantIfNew(userId, "first_log", context));

  if (entry.rating !== null && (await countRatings(userId)) >= 1) {
    push(await grantIfNew(userId, "rated_first", context));
  }

  if (entry.reviewText !== null) {
    const reviewCount = await countReviews(userId);
    if (reviewCount >= 1) push(await grantIfNew(userId, "first_words", context));
    if (reviewCount >= 20) push(await grantIfNew(userId, "first_review", context));
  }

  if (entry.isFavorite && (await countDiaryFavorites(userId)) >= 1) {
    push(await grantIfNew(userId, "favorited_first", context));
  }

  if (entry.status === "DROPPED" && (await countDropped(userId)) >= 1) {
    push(await grantIfNew(userId, "exit", context));
  }

  if ((await longestLogStreakDays(userId)) >= 3) {
    push(await grantIfNew(userId, "three_day_streak", { label: "3 dias seguidos registrando" }));
  }

  return unlocked;
}

/** Call after toggleFavorite() returns true (newly favorited via the media page heart button). */
export async function checkFavoriteListBadges(userId: string, media: MediaLike): Promise<UnlockedBadge[]> {
  await syncBadgeCatalog();
  if ((await countFavoritesListItems(userId)) < 1) return [];
  const badge = await grantIfNew(userId, "favorited_first", mediaContext(media));
  return badge ? [badge] : [];
}

/** Call after a media share (native share sheet completed, or clipboard-copy fallback fired). */
export async function checkShareBadge(userId: string, media: MediaLike): Promise<UnlockedBadge[]> {
  await syncBadgeCatalog();
  const badge = await grantIfNew(userId, "shared_media", mediaContext(media));
  return badge ? [badge] : [];
}

/**
 * Call after createComment(). Checked separately because the two badges here go to different
 * people: "Entrosando" to whoever just commented (if it wasn't their own review), "Pimenta" to the
 * review's owner once it collects 30 comments (regardless of who posted the 30th).
 */
export async function checkCommentBadges(
  userId: string,
  comment: { diaryEntryOwnerId: string; diaryEntryCommentCount: number },
  context: BadgeContext,
): Promise<{ commenterUnlocks: UnlockedBadge[]; ownerUnlocks: UnlockedBadge[] }> {
  await syncBadgeCatalog();
  const commenterUnlocks: UnlockedBadge[] = [];
  const ownerUnlocks: UnlockedBadge[] = [];

  if (comment.diaryEntryOwnerId !== userId) {
    const badge = await grantIfNew(userId, "commented_on_other", context);
    if (badge) commenterUnlocks.push(badge);
  }

  if (comment.diaryEntryCommentCount >= 30) {
    const badge = await grantIfNew(comment.diaryEntryOwnerId, "pepper", context);
    if (badge) ownerUnlocks.push(badge);
  }

  return { commenterUnlocks, ownerUnlocks };
}

/** Call after a new List is created (excludes the auto-managed Favoritos list). */
export async function checkListCreatedBadge(userId: string): Promise<UnlockedBadge[]> {
  await syncBadgeCatalog();
  if ((await countLists(userId)) < 1) return [];
  const badge = await grantIfNew(userId, "list_maker");
  return badge ? [badge] : [];
}

/** Call after followUser(). Grants to the user being followed, not the follower. */
export async function checkFollowerBadge(followingUserId: string): Promise<UnlockedBadge[]> {
  await syncBadgeCatalog();
  if ((await countFollowers(followingUserId)) < 1) return [];
  const badge = await grantIfNew(followingUserId, "first_follower");
  return badge ? [badge] : [];
}
