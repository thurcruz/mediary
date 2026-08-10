import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { FloatingNav } from "@/components/nav/floating-nav";
import { BadgeRevealProvider } from "@/components/badges/badge-reveal-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings) {
    redirect("/onboarding");
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <BadgeRevealProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
        <TopBar unreadCount={unreadCount} />
        <main className="flex-1 px-4 pb-28 sm:px-6">{children}</main>
        <FloatingNav username={session.user.username} />
      </div>
    </BadgeRevealProvider>
  );
}
