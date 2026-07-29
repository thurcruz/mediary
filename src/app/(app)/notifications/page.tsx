import Link from "next/link";
import { UserPlus, Heart, MessageCircle, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import type { NotificationType } from "@/lib/media-types";

type NotificationPayload = {
  fromUserId?: string;
  fromUsername?: string;
  fromName?: string;
  fromAvatarUrl?: string | null;
};

const ICONS: Record<NotificationType, typeof UserPlus> = {
  NEW_FOLLOWER: UserPlus,
  REVIEW_LIKE: Heart,
  COMMENT: MessageCircle,
  ACHIEVEMENT_UNLOCKED: Trophy,
};

function notificationText(type: NotificationType, name: string): string {
  switch (type) {
    case "NEW_FOLLOWER":
      return `${name} começou a seguir você`;
    case "REVIEW_LIKE":
      return `${name} curtiu seu registro`;
    case "COMMENT":
      return `${name} comentou no seu registro`;
    case "ACHIEVEMENT_UNLOCKED":
      return `Você desbloqueou uma conquista`;
  }
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Atividades</h1>

      {notifications.length === 0 && (
        <p className="text-sm text-muted">Nenhuma atividade ainda.</p>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((notification) => {
          const type = notification.type as NotificationType;
          const payload = notification.payload as NotificationPayload;
          const Icon = ICONS[type];
          const name = payload.fromName ?? payload.fromUsername ?? "Alguém";

          const content = (
            <div
              className={`flex items-center gap-3 rounded-2xl border border-border p-3 ${
                notification.isRead ? "bg-surface" : "bg-primary/5"
              }`}
            >
              {payload.fromUsername ? (
                <Avatar src={payload.fromAvatarUrl} name={name} size={36} />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-muted">
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <p className="flex-1 text-sm">{notificationText(type, name)}</p>
              <span className="text-xs text-muted">
                {notification.createdAt.toLocaleDateString("pt-BR")}
              </span>
            </div>
          );

          return payload.fromUsername ? (
            <Link key={notification.id} href={`/profile/${payload.fromUsername}`}>
              {content}
            </Link>
          ) : (
            <div key={notification.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
