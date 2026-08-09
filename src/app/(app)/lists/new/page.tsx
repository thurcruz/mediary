import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewListForm } from "@/components/lists/new-list-form";

export default async function NewListPage() {
  const session = await auth();
  if (!session?.user) return null;

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { following: { select: { id: true, username: true, name: true, avatarUrl: true } } },
  });

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Nova lista</h1>
      <NewListForm friends={following.map((f) => f.following)} />
    </div>
  );
}
