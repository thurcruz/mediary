import { prisma } from "@/lib/prisma";
import { createNotificationFromActor } from "@/lib/services/notifications";

export class SelfFollowError extends Error {
  constructor() {
    super("Você não pode seguir a si mesmo");
  }
}

/** Self-follow can't be a DB constraint on SQLite, so it's guarded here. */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new SelfFollowError();
  }

  const follow = await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  await createNotificationFromActor(followingId, "NEW_FOLLOWER", followerId);

  return follow;
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}
