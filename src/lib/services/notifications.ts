import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { NotificationType } from "@/lib/media-types";

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Prisma.InputJsonObject,
) {
  return prisma.notification.create({
    data: { userId, type, payload },
  });
}

/**
 * Denormalizes the acting user's display info into the notification payload
 * at creation time, so the notifications feed never needs to join back to
 * User (and still renders sensibly if that user is later deleted).
 */
export async function createNotificationFromActor(
  userId: string,
  type: NotificationType,
  actorId: string,
  extra: Prisma.InputJsonObject = {},
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true, name: true, avatarUrl: true },
  });
  if (!actor) return null;

  return createNotification(userId, type, {
    fromUserId: actorId,
    fromUsername: actor.username,
    fromName: actor.name,
    fromAvatarUrl: actor.avatarUrl,
    ...extra,
  });
}
