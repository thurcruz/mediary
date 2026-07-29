import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  if (settings) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
