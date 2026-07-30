import { prisma } from "@/lib/prisma";

export type UserSearchResult = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
};

async function withFollowStatus(viewerId: string, users: Array<Omit<UserSearchResult, "isFollowing">>) {
  if (users.length === 0) return [];

  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: users.map((u) => u.id) } },
    select: { followingId: true },
  });
  const followingIds = new Set(follows.map((f) => f.followingId));

  return users.map((user) => ({ ...user, isFollowing: followingIds.has(user.id) }));
}

const SELECT = { id: true, username: true, name: true, avatarUrl: true, bio: true } as const;

export async function searchUsers(viewerId: string, query: string): Promise<UserSearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: SELECT,
    take: 20,
  });

  return withFollowStatus(viewerId, users);
}

/** Users not yet followed, most-followed first - shown when the search box is empty. */
export async function suggestUsersToFollow(viewerId: string): Promise<UserSearchResult[]> {
  const alreadyFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId, notIn: alreadyFollowing.map((f) => f.followingId) },
    },
    select: SELECT,
    orderBy: { followers: { _count: "desc" } },
    take: 12,
  });

  return withFollowStatus(viewerId, users);
}
